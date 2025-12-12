import mongoose, { Schema } from 'mongoose';

const otpSchema = new Schema({
    phone: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: '5m' },
});

export const OtpCode = mongoose.model('OtpCode', otpSchema);
