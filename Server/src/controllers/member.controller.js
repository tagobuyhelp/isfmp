import { Member } from "../models/member.model.js";
import { OtpCode } from "../models/otp.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { generateOTP } from "../utils/otpGenerator.js";
import { sendMail } from "../utils/sendMail.js";
import { Membership } from "../models/membership.model.js";
import { generateIdCard } from "../utils/generateIdCard.js";
import cloudinary from "../utils/cloudinaryConfig.js";

const BASE_URL = process.env.BASE_URL || "http://localhost:4055";

// 1. Generate OTP and Send to Email
const generateAndSendOtp = asyncHandler(async (email) => {
    const otp = generateOTP();
    await OtpCode.create({ email, otp });
    await sendMail({
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
    });
});

// 2. Verify OTP
const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const otpRecord = await OtpCode.findOne({ email, otp });

    if (!otpRecord) {
        throw new ApiError(400, "Invalid or expired OTP.");
    }

    // OTP is valid; remove it from the database
    await OtpCode.deleteOne({ email, otp });

    return res.status(200).json(new ApiResponse(200, "OTP verified successfully"));
});

// 3. Verify if Member Exists
const verifyMember = asyncHandler(async (req, res) => {
    const { aadhaar, phone, email } = req.body;
    await generateAndSendOtp(email); // Generate OTP when verifying a member

    const member = await Member.findOne({ aadhaar, phone });

    

    
    if (member) {
        const message = "Member found. OTP has been sent to your email to resume registration.";
        return res.status(200).json(new ApiResponse(200, message));
    } else {
        const message = "Member not found. Proceed with full registration after OTP verification.";
        return res.status(404).json(new ApiResponse(404, message));
    }
});



// 4. Register a New Member
const registerMember = asyncHandler(async (req, res) => {
    const { email, ...memberData } = req.body;

    // Check if a member with the same Aadhaar number already exists
    const existingMember = await Member.findOne({ aadhaar: memberData.aadhaar });
    if (existingMember) {
        throw new ApiError(409, "Member already exists. Use the update option.");
    }

    let photoUrl = null;

    // Check if a photo was uploaded
    if (req.file) {
        // Upload the photo to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "member_photos",
        });
        photoUrl = result.secure_url;
    }

    // Create the new member with the photo path if available
    const member = await Member.create({ email, ...memberData, photo: photoUrl });


    //Send email to the new member
    // Send success email
    const emailContent = `
    <p>Dear ${member.fullname},</p>

    <p>Thank you for submitting your membership application. We’re excited to welcome you to our community!</p>
    <p>To proceed, please complete your membership payment at your earliest convenience. Once we receive your payment, we will carefully review your application and update your membership status.</p>
    <p>If you have any questions or need assistance, feel free to contact our support team. We’re here to help!</p>

    <p>Warm regards,</p>
    <p><strong>INDIAN NATIONAL LEAGUE</strong></p>

    `;
    await sendMail({
        to: member.email,
        subject: 'We’ve Received Your Application – Complete Your Membership Payment',
        html: emailContent
    })

    return res.status(201).json(new ApiResponse(201, "We’ve Received Your Application – Complete Your Membership Payment", member));
});


// 5. Update Member Information
const updateMember = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body; // Ensure 'updates' is extracted correctly
    let photoUrl = null;

    // Check if a new photo was uploaded
    if (req.file) {
        console.log('member_photos', req.file);
        // Upload the new photo to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "member_photos",
        });
        photoUrl = result.secure_url;
        console.log(result);
        updates.photo = photoUrl;
    }
    const updatedMember = await Member.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
    );

    if (!updatedMember) throw new ApiError(404, "Member not found.");

    return res.status(200).json(new ApiResponse(200, "Member updated successfully", updatedMember));
});


// 6. Delete Member
const deleteMember = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedMember = await Member.findByIdAndDelete(id);
    if (!deletedMember) throw new ApiError(404, "Member not found.");

    return res.status(200).json(new ApiResponse(200, "Member deleted successfully"));
});

const getMemberByPhoneEmail = asyncHandler(async (req, res) => {
    const { phone, email } = req.body;

    if (!phone || !email) {
        throw new ApiError(400, "Phone and email are required.");
    }

    const member = await Member.findOne({ phone, email });

    if (!member) {
        throw new ApiError(404, "Member not found.");
    }

    return res.status(200).json(new ApiResponse(200, "Member found", member));
});



// 7. Get Member by ID
const getMemberById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log('id...',id);
    const member = await Member.findById(id);
    if (!member) throw new ApiError(404, "Member not found.");
    return res.status(200).json(new ApiResponse(200, "Member found", member));
});






// 8. Get All Members with Paginationls


const getAllMembers = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        search = '', 
        sort = 'createdAt', 
        order = 'desc',
        status,
        membershipType,
        state,
        district,
        parliamentConstituency
    } = req.query;

    // Build the query
    let query = {};

    // Search functionality
    if (search) {
        query.$or = [
            { fullname: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
        ];
    }

    // Filter by status
    if (status) {
        query.membershipStatus = status;
    }

    // Filter by membershipType
    if (membershipType) {
        query.membershipType = membershipType;
    }

    // Filter by state
    if (state) {
        query.state = { $regex: state, $options: 'i' };
    }

    // Filter by district
    if (district) {
        query.district = { $regex: district, $options: 'i' };
    }

    // Filter by parliamentConstituency
    if (parliamentConstituency) {
        query.parliamentConstituency = { $regex: parliamentConstituency, $options: 'i' };
    }

    // Execute the query with pagination
    const totalMembers = await Member.countDocuments(query);
    const members = await Member.find(query)
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    // Fetch location options
    const states = await Member.distinct('state');
    const districts = await Member.distinct('district');
    const parliamentConstituencies = await Member.distinct('parliamentConstituency');

    // Prepare the pagination info
    const totalPages = Math.ceil(totalMembers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(200).json(
        new ApiResponse(200, "Members fetched successfully", {
            members,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalMembers,
                hasNextPage,
                hasPrevPage
            },
            locationOptions: {
                states: states.filter(Boolean).sort(),
                districts: districts.filter(Boolean).sort(),
                parliamentConstituencies: parliamentConstituencies.filter(Boolean).sort()
            }
        })
    );
});



// 9. Check Member Membership Buying Status
const checkMembership = asyncHandler(async (req, res) => {
    const { aadhaar } = req.body;

    if (!aadhaar) {
        throw new ApiError(400, "Aadhaar and phone are required.");
    }

    // Check if a membership record exists
    const membership = await Membership.findOne({ aadhaar });

    if (!membership) {
        return res.status(404).json(new ApiResponse(404, "No membership found. Please purchase a membership.", null));
    }

    // Check membership status
    switch (membership.status) {
        case 'inactive':
            return res.status(200).json(new ApiResponse(200, "Membership is inactive. Please complete the payment.", { status: 'inactive' }));
        
        case 'expired':
            return res.status(200).json(new ApiResponse(200, "Membership has expired. Please renew your membership.", { status: 'expired', expiryDate: membership.expiryDate }));
        
        case 'canceled':
            return res.status(200).json(new ApiResponse(200, "Membership was canceled. Please contact support for reactivation.", { status: 'canceled', cancellationDate: membership.cancellationDate }));
        
        case 'active':
            // Fetch the member details
            const member = await Member.findOne({ email, phone });
            
            if (!member) {
                throw new ApiError(404, "Member details not found in the database.");
            }

            // Update membership status and store member ID if not already done
            if (member.membershipStatus !== 'active' || !member.memberId) {
                member.membershipStatus = 'active';
                member.memberId = membership.memberId;
                await member.save();
            }


            return res.status(200).json(new ApiResponse(200, "Membership is active.", { status: 'active', member}));
        
        default:
            throw new ApiError(500, "Unknown membership status.");
    }
});


const checkMembership2 = asyncHandler(async (req, res) => {
    const { aadhaar } = req.body;
    console.log('checkMembership2 function called');

    // Validate input
    if (!email || !phone) {
        return res.status(400).json({ success: false, message: "Please enter aadhaar" });
    }

    // Find the membership by email and phone
    const membership = await Membership.findOne({ aadhaar });

    if (!membership || membership.status === 'inactive') {
        return res.status(404).json({ success: false, message: "Membership not found - Pay your membership fee",  });
    }

    const member = await Member.findOne({ aadhaar });


        // Format the response
    const updatedMember = {
        ...member.toObject(),
        photo: member.photo ? `${BASE_URL}/${member.photo}` : "",
        idCard: member.idCard ? `${BASE_URL}${member.idCard}` : "",
    };


    
    

    // Membership exists
    return res.status(200).json({ success: true, message: "Membership already exists", updatedMember });
});




// 10. Member Id Card Generator
const memberIdCardGenerator = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch member by ID
        const member = await Member.findById(id);
        if (!member) {
            throw new ApiError(404, "Member not found");
        }

        // Fetch membership by member _id
        const membership = await Membership.findOne({ member: member._id });
        if (!membership) {
            throw new ApiError(404, "Membership not found");
        }

        if (!member.photo) {
            throw new ApiError(404, "Member Photo not found");
        }



        // Extract details
        const memberName = member.fullname;
        const memberId = membership.memberId;
        const memberDob = new Intl.DateTimeFormat('en-GB').format(new Date(member.dob));
        const memberType = membership.type.toUpperCase();

        
        const ValidUpto = new Intl.DateTimeFormat('en-GB').format(new Date(membership.expiryDate));
        const memberPhoto = member.photo;

        // Generate the ID card if it doesn't exist

            const generated = await generateIdCard(
                memberName,
                memberId,
                memberDob,
                memberType,
                ValidUpto,
                memberPhoto
            );

            if (!generated) {
                throw new ApiError(500, "ID Card Generation Failed");
            }


        

        // Send response
        res.status(200).json({
            success: true,
            message: "ID card generated & sent successfully",
            idCardPath: member.idCard,
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "An error occurred while generating the ID card",
        });
    }
});


export {
    verifyMember,
    registerMember,
    getMemberById,
    updateMember,
    deleteMember,
    getAllMembers,
    verifyOtp,
    checkMembership,
    memberIdCardGenerator,
    checkMembership2,
    getMemberByPhoneEmail,
};
