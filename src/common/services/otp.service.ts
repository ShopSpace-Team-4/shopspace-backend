import { Types } from 'mongoose';
import { config } from '../../config/config';
import { OtpPurpose } from '../enums/otp-purpose.enum';
import { generateOtp } from '../utils/otp-generator.util';
import { HashUtil } from '../utils/hash.util';
import { otpTokenRepository } from '../../DB/repository/otp-token.repository';
import { emailService } from './email.service';
import { BadRequestException } from '../exceptions';

// Orchestrates the full OTP lifecycle. auth.service.ts calls this rather
// than touching the OtpToken model or nodemailer directly.
class OtpService {
  async generateAndSend(userId: Types.ObjectId, email: string, purpose: OtpPurpose): Promise<void> {
    // Invalidate any previous unused codes for this purpose first.
    await otpTokenRepository.deleteAllForUserAndPurpose(userId, purpose);

    const plainOtp = generateOtp();
    const hashedOtp = await HashUtil.hash(plainOtp);
    const expiresAt = new Date(Date.now() + config.otp.expiresInMinutes * 60 * 1000);

    await otpTokenRepository.create({
      userId,
      otpCode: hashedOtp,
      purpose,
      expiresAt,
    });

    await emailService.sendOtpEmail(email, plainOtp, purpose);
  }

  async verify(userId: Types.ObjectId, purpose: OtpPurpose, otpCode: string): Promise<void> {
    const record = await otpTokenRepository.findLatestByUserAndPurpose(userId, purpose);

    // Mongo's TTL index cleans up expired docs, but that's a background
    // sweep (runs every ~60s), so we double-check expiry here too.
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('OTP code is invalid or has expired');
    }

    const isMatch = await HashUtil.compare(otpCode, record.otpCode);
    if (!isMatch) {
      throw new BadRequestException('OTP code is invalid or has expired');
    }

    // One-time use: burn it once verified successfully.
    await otpTokenRepository.deleteAllForUserAndPurpose(userId, purpose);
  }
}

export const otpService = new OtpService();
