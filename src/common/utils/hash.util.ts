import bcrypt from 'bcrypt';
import { config } from '../../config/config';

// Thin wrapper around bcrypt, reused for both password hashing
// and OTP-code hashing (we never store either in plain text).
export const HashUtil = {
  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, config.bcrypt.saltRounds);
  },

  async compare(plainText: string, hashedText: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashedText);
  },
};
