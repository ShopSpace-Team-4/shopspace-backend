import rateLimit from 'express-rate-limit';
import { config } from '../config/config';

// Reused factory so every sensitive endpoint gets a consistent, configurable
// limiter instead of hand-rolled logic per route.
function makeLimiter(maxRequests: number, message: string) {
  return rateLimit({
    windowMs: config.rateLimit.windowMinutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: true, // return rate limit info in RateLimit-* headers
    legacyHeaders: false,
    message: { success: false, message },
  });
}

// Brute-force protection on login.
export const loginRateLimiter = makeLimiter(
  config.rateLimit.maxRequests,
  'Too many login attempts. Please try again later.'
);

// Stricter limiter for forgot-password to prevent email-bombing a victim.
export const forgotPasswordRateLimiter = makeLimiter(
  3,
  'Too many password reset requests. Please try again later.'
);

// Prevents OTP spam that could rack up email-sending costs / annoy users.
export const resendOtpRateLimiter = makeLimiter(3, 'Too many OTP requests. Please try again later.');
