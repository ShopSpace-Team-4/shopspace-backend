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
