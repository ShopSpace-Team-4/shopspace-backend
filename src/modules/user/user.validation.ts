import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  phone: Joi.string()
    .pattern(/^\+?[0-9]{8,15}$/)
    .messages({ 'string.pattern.base': 'Phone number is invalid' }),
}).min(1); // at least one field must be provided

export const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(64).required().messages({
    'string.min': 'Password must be at least 8 characters long',
  }),
});
