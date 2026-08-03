import Joi from 'joi';
import { Role } from '../../common/enums/role.enum';

// One schema per auth endpoint. Wired to routes via the generic
// `validate()` middleware, e.g. validate(signupSchema).
const password = Joi.string().min(8).max(64).required().messages({
  'string.min': 'Password must be at least 8 characters long',
});

export const signupSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\+?[0-9]{8,15}$/)
    .required()
    .messages({ 'string.pattern.base': 'Phone number is invalid' }),
  password,
  role: Joi.string()
    .valid(...Object.values(Role))
    .required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const verifyAccountSchema = Joi.object({
  email: Joi.string().email().required(),
  otpCode: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
});

export const resendOtpSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otpCode: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
  newPassword: password,
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
