import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../common/validation/validate.middleware';
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

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);
router.post('/verify', validate(verifyAccountSchema), authController.verify);
router.post('/resend-otp', resendOtpRateLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post(
  '/forgot-password',
  forgotPasswordRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export { router as authRoutes };
