import { z } from 'zod';
import { generalValidationFields } from '../../common/validation/general.valodation';

// One schema per auth endpoint, composed directly from the shared
// model-aligned fields so nothing is defined twice.
export const signupSchema = z.object({
  firstName: generalValidationFields.firstName,
  lastName: generalValidationFields.lastName,
  email: generalValidationFields.email,
  phone: generalValidationFields.phone,
  password: generalValidationFields.password,
});

export const loginSchema = z.object({
  email: generalValidationFields.email,
  password: generalValidationFields.password,
});

export const verifyAccountSchema = z.object({
  email: generalValidationFields.email,
  otpCode: generalValidationFields.otpCode,
});

export const resendOtpSchema = z.object({
  email: generalValidationFields.email,
});

export const forgotPasswordSchema = z.object({
  email: generalValidationFields.email,
});

export const resetPasswordSchema = z.object({
  email: generalValidationFields.email,
  otpCode: generalValidationFields.otpCode,
  newPassword: generalValidationFields.newPassword,
});

export const refreshTokenSchema = z.object({
  refreshToken: generalValidationFields.refreshToken,
});

export const googleAuthSchema = z.object({
  idToken: z.string({ error: 'idToken is mandatory' }).min(1, { error: 'idToken is mandatory' }),
});
