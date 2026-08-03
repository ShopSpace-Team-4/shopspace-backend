import crypto from 'crypto';
import { config } from '../../config/config';

// Generates a numeric OTP code, e.g. "483920", using a cryptographically
// secure random source (not Math.random()).
export function generateOtp(length: number = config.otp.length): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
}
