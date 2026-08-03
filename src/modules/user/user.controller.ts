import { Router, Request, Response } from 'express';
import { successResponse } from '../../common/response';
import { userService } from './user.service';
import { UnauthorizedException } from '../../common/exceptions';
import { validate } from '../../common/validation/general.valodation';
import { updateProfileSchema, updatePasswordSchema } from './user.validation';
import { authenticate } from '../../middleware/authentication.middleware';

const router = Router();

// Every /users route requires a logged-in user.
router.use(authenticate);

router.get('/me', async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  const profile = await userService.getMe(req.user.userId);
  return successResponse({ res, data: profile });
});

router.put('/me', validate(updateProfileSchema), async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  const profile = await userService.updateMe(req.user.userId, req.body);
  return successResponse({ res, data: profile, message: 'Profile updated successfully' });
});

router.put('/me/password', validate(updatePasswordSchema), async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  await userService.updatePassword(req.user.userId, req.body);
  return successResponse({ res, message: 'Password updated successfully' });
});

router.delete('/me', async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  await userService.deleteMe(req.user.userId);
  return successResponse({ res, message: 'Account deleted successfully' });
});

export const userRoutes = router;
