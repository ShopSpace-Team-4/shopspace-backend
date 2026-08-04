import { z } from 'zod';
import { generalValidationFields } from '../../common/validation/general.valodation';

const { firstName, lastName, phone, password } = generalValidationFields;

export const updateProfileSchema = z.object({
  firstName: firstName.optional(),
  lastName: lastName.optional(),
  phone: phone.optional(),
}).refine((data) => Object.keys(data).length > 0, {
  error: 'At least one field must be provided',
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string({ error: 'currentPassword is mandatory' }),
  newPassword: password,
});

export const activeRoleSchema = z.object({
  role: generalValidationFields.role,
});

export const addRoleSchema = z.object({
  role: generalValidationFields.role,
});

export const linkGoogleSchema = z.object({
  idToken: z.string({ error: 'idToken is mandatory' }).min(1, { error: 'idToken is mandatory' }),
});
