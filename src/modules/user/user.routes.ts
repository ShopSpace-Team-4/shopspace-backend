import { Router } from 'express';
import { userController } from './user.controller';
import { validate } from '../../common/validation/validate.middleware';
import { updateProfileSchema, updatePasswordSchema } from './user.validation';
import { authenticate } from '../../middleware/authentication.middleware';

const router = Router();

// Every /users route requires a logged-in user.
router.use(authenticate);

router.get('/me', userController.getMe);
router.put('/me', validate(updateProfileSchema), userController.updateMe);
router.put('/me/password', validate(updatePasswordSchema), userController.updatePassword);
router.delete('/me', userController.deleteMe);

export { router as userRoutes };
