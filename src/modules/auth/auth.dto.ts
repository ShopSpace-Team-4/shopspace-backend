import { Role } from '../../common/enums/role.enum';

// Pure TypeScript shapes for what each auth endpoint expects/returns.
// auth.validation.ts enforces these shapes at runtime with Joi.

export interface SignupDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface VerifyAccountDto {
  email: string;
  otpCode: string;
}

export interface ResendOtpDto {
  email: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  otpCode: string;
  newPassword: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}
