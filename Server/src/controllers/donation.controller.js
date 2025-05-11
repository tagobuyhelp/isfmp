import { Donation } from '../models/donation.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { phonepePayment } from '../utils/phonepePayment.js';
import { generateUserId, generateTnxId } from '../utils/generateId.js';
import { Transaction } from '../models/transaction.model.js';
import { sendMail } from '../utils/sendMail.js';

const handleDonationRequest = asyncHandler(async (req, res) => {
    const { donorName, donorEmail, donorPhone, amount, purpose, isAnonymous } = req.body;

    if (!donorName || !amount) {
        throw new ApiError(400, 'Donor name or amount must be provided!');
    }

    // Generate UserId
    const userId = generateUserId();

    // Create a Transaction record
    const transaction = await Transaction.create({
        memberId: userId,
        transactionId: generateTnxId(),
        transactionType: 'donation',
        amount: amount,
        paymentStatus: 'pending'
    });

    console.log(transaction.transactionId);

    // Create the donation record
    const donation = await Donation.create({
        donorName: donorName,
        donorEmail: donorEmail,
        donorPhone: donorPhone,
        amount: amount,
        paymentStatus: 'pending',
        purpose: purpose,
        transactionId: transaction.transactionId,
        isAnonymous: isAnonymous,
    });

    const merchantTnxId = transaction.transactionId;
    const redirectUrl = process.env.REDIRECT_URL;

    // Initiate payment with PhonePe
    const phonepeResponse = await phonepePayment(
        merchantTnxId,
        userId,
        amount,
        donorPhone,
        redirectUrl
    );

    if (phonepeResponse) {
        // Prepare email content
        const emailContent = `
            <p>Dear ${donorName},</p>
            <p>Your payment process for the donation has been initiated successfully.</p>
            <p>Amount: ₹${amount}</p>
            <p>Transaction ID: ${merchantTnxId}</p>
            <p>Please complete the payment using the link below:</p>
            <a href="${phonepeResponse}" style="display: inline-block; padding: 10px 20px; margin: 10px 0; background-color: #4CAF50; color: white; text-align: center; text-decoration: none; border-radius: 5px;">Complete Payment</a>
            <p>Thank you!</p>
            
            <hr style="margin: 20px 0; border: 1px solid #ccc;">
            
            <p><strong>Address</strong></p>
            <p>
                Indian Secular Front (ISF)<br>
                Furfura Sharif, Hooghly, West Bengal
            </p>

            <p><strong>Contact Information</strong><br>
                Telephone No: 8967330331<br>
                E-Mail ID: info@isf.org
            </p>
        `;

        // Send confirmation email to the donor using the sendMail utility
        await sendMail({
            to: donorEmail,
            subject: 'Donation Payment Initiation',
            html: emailContent,
        });

        // Send the payment URL to the frontend
        res.status(200).json({
            success: true,
            paymentUrl: phonepeResponse
        });
    } else {
        // Handle payment initiation failure
        res.status(500).json({
            success: false,
            message: 'Payment initiation failed. Please try again later.'
        });
    }
});

// If the transaction is successful - create donation
const createDonation = asyncHandler(async (req, res) => {
    const { merchantTransactionId } = req.params;

    // Fetch the transaction by its ID
    const transaction = await Transaction.findOne({
        transactionId: merchantTransactionId,
        paymentStatus: 'success'
    });

    if (!transaction) {
        throw new ApiError(400, 'Transaction not found or payment not successful');
    }

    // Create the donation record
    const donation = await Donation.create({
        donorName: transaction.memberId,  // or use req.body if donor details are passed
        amount: transaction.amount,
        transactionId: merchantTransactionId,
        donationStatus: 'confirmed'
    });

    res.status(201).json({
        success: true,
        message: 'Donation created successfully',
        donation
    });
});

const getDonations = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', ...filters } = req.query;
    
    // Parse sorting order
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = { [sort]: sortOrder };

    // Filter and retrieve specified fields
    const fieldSelection = req.query.fields ? req.query.fields.split(',').join(' ') : '';

    // Convert page and limit to integers for pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build query based on filters
    const query = { ...filters };

    // Fetch donations with advanced options
    const donations = await Donation.find(query)
        .sort(sortOptions)
        .select(fieldSelection)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

    // Send response
    res.status(200).json(new ApiResponse(200, donations, 'All donations retrieved successfully.'));
});



export {
    handleDonationRequest,
    createDonation,
    getDonations
};
