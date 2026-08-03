import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Role } from '../enums/role.enum';
import { BadRequestException } from '../exceptions';

// Reusable zod fields aligned with the User model (src/DB/models/user.model.ts)
const passwordRule = z.string({ error: 'password is mandatory' })
  .min(8, { error: 'password must be at least 8 characters long' })
  .max(20, { error: 'password must be at most 20 characters long' })
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    { error: 'password must contain at least one uppercase, one lowercase, one number and one special character' }
  );

export const generalValidationFields = {
  firstName: z.string({ error: 'firstName is mandatory' })
    .min(2, { error: 'firstName must be at least 2 characters' })
    .max(50, { error: 'firstName must be at most 50 characters' }),
  lastName: z.string({ error: 'lastName is mandatory' })
    .min(2, { error: 'lastName must be at least 2 characters' })
    .max(50, { error: 'lastName must be at most 50 characters' }),
  email: z.email({ error: 'email is mandatory' }),
  phone: z.string({ error: 'phone is mandatory' })
    .regex(/^01[0125][0-9]{8}$/, { error: 'Invalid Egyptian phone number' }),
  password: passwordRule,
  newPassword: passwordRule,
  role: z.enum(Object.values(Role) as [Role, ...Role[]], { error: 'invalid role' }),
  otpCode: z.string({ error: 'otpCode is required' }).regex(/^\d{6}$/, { error: 'Invalid OTP' }),
  refreshToken: z.string({ error: 'refreshToken is mandatory' }),
};

// Generic middleware that validates req.body against a zod schema.
export const validate = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      }));
      return next(new BadRequestException('validation error', { issues }));
    }
    return next();
  };
};
