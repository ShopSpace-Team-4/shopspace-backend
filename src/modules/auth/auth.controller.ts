import { Router, Request, Response } from 'express';
import { successResponse } from '../../common/response';
import { authService } from './auth.service';
import { UnauthorizedException } from '../../common/exceptions';
import { validate } from '../../common/validation/general.valodation';
import {
  signupSchema,
  loginSchema,
  verifyAccountSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from './auth.validation';
import { authenticate } from '../../middleware/authentication.middleware';
import { loginRateLimiter, forgotPasswordRateLimiter, resendOtpRateLimiter } from '../../middleware/rate-limit.middleware';

const router = Router();

// Thin HTTP layer: parse req -> call service -> shape response.
// No business logic lives here, only request/response plumbing.
router.post('/signup', validate(signupSchema), async (req: Request, res: Response) => {
  const result = await authService.signup(req.body);
  return successResponse({ res, data: result, message: 'Signup successful. Please check your email for an OTP code.', status: 201 });
});

router.post('/login', loginRateLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  const tokens = await authService.login(req.body);
  return successResponse({ res, data: tokens, message: 'Login successful' });
});

router.post('/verify', validate(verifyAccountSchema), async (req: Request, res: Response) => {
  await authService.verifyAccount(req.body);
  return successResponse({ res, message: 'Account verified successfully' });
});

router.post('/resend-otp', resendOtpRateLimiter, validate(resendOtpSchema), async (req: Request, res: Response) => {
  await authService.resendOtp(req.body);
  return successResponse({ res, message: 'A new OTP code has been sent to your email' });
});

router.post('/logout', authenticate, async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedException();
  await authService.logout(req.user.userId);
  return successResponse({ res, message: 'Logged out successfully' });
});

router.post('/refresh-token', validate(refreshTokenSchema), async (req: Request, res: Response) => {
  const tokens = await authService.refreshToken(req.body);
  return successResponse({ res, data: tokens, message: 'Token refreshed successfully' });
});

router.post(
  '/forgot-password',
  forgotPasswordRateLimiter,
  validate(forgotPasswordSchema),
  async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body);
    return successResponse({ res, message: 'If that email exists, a reset code has been sent' });
  }
);

router.post('/reset-password', validate(resetPasswordSchema), async (req: Request, res: Response) => {
  await authService.resetPassword(req.body);
  return successResponse({ res, message: 'Password reset successfully. Please log in again.' });
});

export const authRoutes = router;
