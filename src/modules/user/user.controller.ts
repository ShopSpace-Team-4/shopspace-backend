import { Router, Request, Response } from 'express';
import { successResponse } from '../../common/response';
import { userService } from './user.service';
import { UnauthorizedException } from '../../common/exceptions';
import { validate } from '../../common/validation/general.valodation';
import { activeRoleSchema, addRoleSchema, linkGoogleSchema, updateProfileSchema, updatePasswordSchema } from './user.validation';
import { authenticate } from '../../middleware/authentication.middleware';
import { listingService } from '../listing/listing.service';

const router = Router();

// Every /users route requires a logged-in user.
router.use(authenticate);

router.get('/me', async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  const profile = await userService.getMe(req.user.userId);
  return successResponse({ res, data: profile });
});

router.get('/me/saved-listings', async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  const listings = await listingService.getSavedListings(req.user.userId);
  return successResponse({ res, data: listings });
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

router.patch('/me/active-role', validate(activeRoleSchema), async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  const profile = await userService.updateActiveRole(req.user.userId, req.body);
  return successResponse({ res, data: profile, message: 'Active role updated successfully' });
});

router.post('/me/roles', validate(addRoleSchema), async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  const result = await userService.addRole(req.user.userId, req.body);
  return successResponse({ res, data: result, message: 'Role updated successfully' });
});

router.patch('/me/link-google', validate(linkGoogleSchema), async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  const profile = await userService.linkGoogle(req.user.userId, req.body);
  return successResponse({ res, data: profile, message: 'Google account linked successfully' });
});

router.delete('/me', async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  await userService.deleteMe(req.user.userId);
  return successResponse({ res, message: 'Account deleted successfully' });
});

export const userRoutes = router;
