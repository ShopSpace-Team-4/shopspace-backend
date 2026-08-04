import { z } from 'zod';
import {
  signupSchema,
  loginSchema,
  verifyAccountSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  googleAuthSchema,
} from './auth.validation';

// Pure TypeScript shapes for what each auth endpoint expects/returns,
// derived from the zod validation schemas so the DTOs can never drift
// apart from the runtime validation.
export type SignupDto = z.infer<typeof signupSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type VerifyAccountDto = z.infer<typeof verifyAccountSchema>;
export type ResendOtpDto = z.infer<typeof resendOtpSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type GoogleAuthDto = z.infer<typeof googleAuthSchema>;

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}
