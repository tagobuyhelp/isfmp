import mongoose, { Schema } from "mongoose";
import { generateMembershipId } from "../utils/generateId.js";

const membershipSchema = new Schema({
    member: {
        type: Schema.Types.ObjectId,
        ref: 'Member',
        required: true,
        index: true
    },
    membershipId: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    fee: {
        type: Number,
        required: true,
        min: 0
    },
    validity: {
        type: Number,
        required: true,
        min: 0,
        default: 36 // 3 years in months
    },
    status: {
        type: String,
        enum: ['inactive', 'active', 'expired', 'canceled'],
        default: 'inactive'
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: true
    },
    lastRenewalDate: {
        type: Date
    },
    renewalCount: {
        type: Number,
        default: 0
    },
    cancellationDate: {
        type: Date
    },
    cancellationReason: {
        type: String
    }
}, { timestamps: true });




// Pre-save hook to calculate expiryDate and generate memberId
membershipSchema.pre('save', async function(next) {
    if (this.isNew || this.isModified('startDate') || this.isModified('validity')) {
        const expiryDate = new Date(this.startDate);
        expiryDate.setMonth(expiryDate.getMonth() + this.validity);
        this.expiryDate = expiryDate;
    }

    if (this.isNew || !this.memberId) {
        let newMemberId;
        let isUnique = false;
        while (!isUnique) {
            newMemberId = generateMemberId(this.membershipType);
            // Check if the generated memberId already exists
            const existingMember = await this.constructor.findOne({ memberId: newMemberId });
            if (!existingMember) {
                isUnique = true;
            }
        }
        this.memberId = newMemberId;
    }

    next();
});

export const Membership = mongoose.model('Membership', membershipSchema);