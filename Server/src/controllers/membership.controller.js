import { Membership } from "../models/membership.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Transaction } from "../models/transaction.model.js";
import { generateTnxId, generateMembershipId } from "../utils/generateId.js";
import { phonepePayment } from "../utils/phonepePayment.js";
import { sendMail } from "../utils/sendMail.js"; // Import sendMail utility
import { Member } from "../models/member.model.js";
import crypto from 'crypto';
import axios from 'axios';
import cron from 'node-cron';




const createMembership = asyncHandler(async (req, res) => {
    const { aadhaar } = req.body;

    if (!aadhaar) {
        throw new ApiError(400, "Aadhaar number is required");
    }
    const member = await Member.findOne({ aadhaar });



    const validityMonths = 36;

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + validity);


    const memberId = member._id;
    const amount = 100; // Assuming 100 INR

    const existingMembership = await Membership.findOne({ member: memberId });
    if (existingMembership && existingMembership.status === 'active') {
        throw new ApiError(400, "Membership active or fees already paid");
    } else if (existingMembership && existingMembership.status === 'inactive') {
        existingMembership.status = 'inactive';
        existingMembership.expiryDate = expiryDate;
        await existingMembership.save();
    } else {
        // Create a new membership
        const membership = await Membership.create({
            member: memberId,
            membershipId: generateMembershipId(member.type),
            fee: amount,
            validity: validityMonths,
            status: 'inactive',
            expiryDate
        });
    }

    // Generate a transaction ID & Get Mobile Number
    const transactionId = generateTnxId();
    const mobileNumber = member.phone;



    const redirectUrl = process.env.MEMBERSHIP_PAYMENT_STATUS_URL;

    // Initiate Payment With Phonepe
    const paymentUrl = await phonepePayment(
        transactionId,
        memberId,
        amount,
        mobileNumber,
        redirectUrl
    );



    // Respond with created transaction and membership
    if (paymentUrl) {
        res.status(200).json(
            {paymentLink: paymentUrl}
        );
    } else {
        throw new ApiError(500, "Payment initiation failed. Please try again.");
    }
});

const checkMemberPaymentStatus = asyncHandler(async (req, res) => {
    const merchantTransactionId = req.params.merchantTransactionId;

    if (!merchantTransactionId) {
        throw new ApiError(400, 'Merchant Transaction Id is required');
    }

    const MERCHANT_ID = process.env.MERCHANT_ID;
    const successUrl = "https://indiannationalleague.party/memberships-success";
    const failureUrl = "https://indiannationalleague.party/membership-fail";

    // Calculate xVerify
    const string = `/pg/v1/status/${process.env.MERCHANT_ID}/${merchantTransactionId}` + process.env.SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + process.env.SALT_INDEX;

    const options = {
        method: 'GET',
        url: `${process.env.PHONEPE_STATUS_URL}/${process.env.MERCHANT_ID}/${merchantTransactionId}`,
        headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
            'X-MERCHANT-ID': MERCHANT_ID,
        },
    };

    try {
        // Make API request to PhonePe
        const response = await axios.request(options);


        console.log(response);

        // Check payment status from PhonePe response
        if (response.data.success === true) {
            // Find the corresponding transaction
            const transaction = await Transaction.findOne({ transactionId: merchantTransactionId });
            const membership = await Membership.findOne({ transaction: transaction._id });
            const member = await Member.findOne({email: membership.email, phone: membership.phone});


            if (transaction && membership) {
                transaction.paymentStatus = "completed";
                await transaction.save();

                membership.status = "active";
                await membership.save();

                member.membershipStatus = "active";

                // Send success email
                const emailContent = `
                    <p>Dear Member,</p>
                    <p><strong>Your INL ID:</strong> ${membership.memberId}</p>
                    <p>Your membership fee payment was successful.</p>
                    <p>Amount: ₹${transaction.amount}</p>
                    <p>Transaction ID: ${merchantTransactionId}</p>
                    <p>Thank you for your payment!</p>
                `;
            await sendMail({
                to: membership.email,
                subject: 'Membership Payment Success',
                html: emailContent
            })

                return res.redirect(successUrl);
            } else {
                throw new ApiError(404, 'Transaction not found');
            }
        } else {
            // Find the corresponding transaction
            const transaction = await Transaction.findOne({ transactionId: merchantTransactionId });
            const membership = await Membership.findOne({ transaction: transaction._id });

            if (transaction) {
                transaction.paymentStatus = "failed";
                await transaction.save();
            }


            // Send failure email
            const emailContent = `
                <p>Dear Member,</p>
                <p>Your payment for membership fees failed.</p>
                <p>Transaction ID: ${merchantTransactionId}</p>
                <p>Please try again or contact support for further assistance.</p>
            `;
            await sendMail({
                to: membership.email,
                subject: 'Membership Payment Failed',
                html: emailContent
            })

            // Handle other statuses like failure or pending
            return res.redirect(failureUrl);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error while checking payment status',
            error: error.message,
        });
    }
});

const renewMembership = asyncHandler(async (req, res) => {
    const { memberId, amount, email, mobileNumber, type } = req.body;

    const membership = await Membership.findOne({ memberId });
    if (!membership) {
        throw new ApiError(400, "Membership doesn't exist");
    }

    if (membership.status === 'active') {
        throw new ApiError(400, "Membership is already active");
    }

    const transactionId = generateTnxId();

    const transaction = await Transaction.create({
        memberId,
        transactionId,
        transactionType: 'membershipRenewal',
        paymentStatus: 'pending',
        amount,
    });

    const now = new Date();

    membership.transaction = transaction._id;
    membership.fee = amount;
    membership.type = type || membership.type;
    membership.status = 'inactive'; // Set inactive until payment is completed
    membership.startDate = now;
    membership.lastRenewalDate = now;
    membership.renewalCount += 1;
    await membership.save(); // This will trigger the pre-save hook to calculate expiryDate

    const paymentUrl = await phonepePayment(transactionId, memberId, amount, mobileNumber, process.env.MEMBERSHIP_PAYMENT_STATUS_URL);
    await sendMail({
        to: email,
        subject: "Membership Renewal Initiated",
        html: `<p>Complete payment here: <a href="${paymentUrl}">Pay Now</a></p>`
    });

    res.status(200).json(new ApiResponse(200, paymentUrl, 'Membership renewal payment initiated.'));
});

const cancelMembership = asyncHandler(async (req, res) => {
    const { memberId, reason } = req.body;

    const membership = await Membership.findOne({ memberId });
    if (!membership || membership.status !== 'active') {
        throw new ApiError(400, "No active membership found");
    }

    membership.status = 'canceled';
    membership.cancellationDate = new Date();
    membership.cancellationReason = reason || 'Not specified';
    await membership.save();

    await sendMail({
        to: membership.email,
        subject: 'Membership Canceled',
        html: `<p>Your membership has been successfully canceled.</p>`
    });

    res.status(200).json(new ApiResponse(200, null, 'Membership canceled successfully.'));
});


const getMembershipDetails = asyncHandler(async (req, res) => {
    const { memberId } = req.params;

    const membership = await Membership.findOne({ memberId }).populate('transaction');
    if (!membership) {
        throw new ApiError(404, 'Membership not found');
    }

    res.status(200).json(new ApiResponse(200, membership, 'Membership details retrieved successfully.'));
});


const listAllMemberships = asyncHandler(async (req, res) => {
    // Get query parameters for advanced functionality
    const { page = 1, limit = 100, sort = 'createdAt', order = 'asc', status, memberId, fields } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (memberId) filter.memberId = memberId;

    // Convert 'order' parameter to a value for sorting
    const sortOrder = order === 'desc' ? -1 : 1;

    // Select specific fields if specified
    const selectedFields = fields ? fields.split(',').join(' ') : null;

    // Calculate pagination parameters
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    // Fetch memberships with the advanced options
    const memberships = await Membership.find(filter)
        .select(selectedFields)
        .populate('transaction')
        .sort({ [sort]: sortOrder })
        .skip(skip)
        .limit(pageSize);

    // Count total documents for pagination info
    const totalMemberships = await Membership.countDocuments(filter);

    res.status(200).json(new ApiResponse(200, {
        memberships,
        total: totalMemberships,
        page: pageNumber,
        pages: Math.ceil(totalMemberships / pageSize),
    }, 'All memberships retrieved successfully.'));
});


// Daily cron job for membership management
cron.schedule('0 0 * * *', async () => {
    console.log("Running daily membership management tasks...");

    const now = new Date();

    try {
        // 1. Expire active memberships
        const expiredResult = await Membership.updateMany(
            { 
                status: 'active', 
                expiryDate: { $lt: now } 
            },
            { 
                $set: { status: 'expired' }
            }
        );

        console.log(`${expiredResult.nModified} memberships have been expired.`);

        // 2. Send expiration emails
        const recentlyExpiredMemberships = await Membership.find({
            status: 'expired',
            expiryDate: { 
                $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
                $lt: now 
            }
        });

        for (const membership of recentlyExpiredMemberships) {
            await sendMail({
                to: membership.email,
                subject: "Membership Expired",
                html: `
                    <p>Dear Member,</p>
                    <p>Your membership (ID: ${membership.memberId}) has expired.</p>
                    <p>Please renew your membership to continue enjoying our services.</p>
                    <p>Thank you for your continued support!</p>
                `
            });
            console.log(`Expiration email sent for memberId: ${membership.memberId}`);
        }

        // 3. Send renewal reminders for memberships expiring soon
        const soonToExpireMemberships = await Membership.find({
            status: 'active',
            expiryDate: { 
                $gte: now,
                $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
            }
        });

        for (const membership of soonToExpireMemberships) {
            const daysUntilExpiry = Math.ceil((membership.expiryDate - now) / (1000 * 60 * 60 * 24));
            await sendMail({
                to: membership.email,
                subject: "Membership Expiring Soon",
                html: `
                    <p>Dear Member,</p>
                    <p>Your membership (ID: ${membership.memberId}) will expire in ${daysUntilExpiry} day(s).</p>
                    <p>Please renew your membership to avoid any interruption in services.</p>
                    <p>Thank you for your continued support!</p>
                `
            });
            console.log(`Renewal reminder sent for memberId: ${membership.memberId}`);
        }

        console.log("Daily membership management tasks completed successfully.");
    } catch (error) {
        console.error("Error in daily membership management tasks:", error);
    }
});

const updateExistingMemberships = asyncHandler(async (req, res) => {
    const updateResults = await Membership.aggregate([
        {
            $addFields: {
                startDate: { $ifNull: ["$startDate", "$createdAt"] },
                expiryDate: {
                    $ifNull: [
                        "$expiryDate",
                        {
                            $add: [
                                { $ifNull: ["$startDate", "$createdAt"] },
                                { $multiply: [{ $ifNull: ["$validity", 36] }, 30 * 24 * 60 * 60 * 1000] }
                            ]
                        }
                    ]
                },
                renewalCount: { $ifNull: ["$renewalCount", 0] },
                lastRenewalDate: { $ifNull: ["$lastRenewalDate", null] }
            }
        },
        {
            $set: {
                status: {
                    $cond: {
                        if: { $lt: ["$expiryDate", new Date()] },
                        then: "expired",
                        else: { $ifNull: ["$status", "active"] }
                    }
                }
            }
        },
        { $merge: { into: "memberships", whenMatched: "merge" } }
    ]);

    console.log("Membership update completed");
    res.status(200).json(new ApiResponse(200, updateResults, 'Existing memberships updated successfully.'));
});


export {
    createMembership,
    checkMemberPaymentStatus,
    renewMembership,
    cancelMembership,
    getMembershipDetails,
    listAllMemberships,
    updateExistingMemberships
};
