import { Schema, model, Document, Types } from 'mongoose';
import { OtpPurpose } from '../../common/enums/otp-purpose.enum';

export interface IOtpToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  otpCode: string; // hashed with bcrypt, never stored/returned in plain text
  purpose: OtpPurpose;
  expiresAt: Date;
  createdAt: Date;
}

const otpTokenSchema = new Schema<IOtpToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  otpCode: { type: String, required: true },
  purpose: { type: String, enum: Object.values(OtpPurpose), required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// TTL index: MongoDB automatically deletes the document once expiresAt passes.
// expireAfterSeconds: 0 means "delete exactly at the date stored in expiresAt".
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Speeds up the common lookup: "find the latest OTP for this user + purpose".
otpTokenSchema.index({ userId: 1, purpose: 1 });

export const OtpTokenModel = model<IOtpToken>('OtpToken', otpTokenSchema);
