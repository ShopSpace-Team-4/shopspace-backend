import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MINUTES } from '../config/config';

// Reused factory so every sensitive endpoint gets a consistent, configurable
// limiter instead of hand-rolled logic per route.
function makeLimiter(maxRequests: number, message: string) {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    max: maxRequests,
    standardHeaders: true, // return rate limit info in RateLimit-* headers
    legacyHeaders: false,
    message: { success: false, message },
  });
}

// Brute-force protection on login.
export const loginRateLimiter = makeLimiter(
  RATE_LIMIT_MAX_REQUESTS,
  'Too many login attempts. Please try again later.'
);

// Stricter limiter for forgot-password to prevent email-bombing a victim.
export const forgotPasswordRateLimiter = makeLimiter(
  3,
  'Too many password reset requests. Please try again later.'
);

// Prevents OTP spam that could rack up email-sending costs / annoy users.
export const resendOtpRateLimiter = makeLimiter(3, 'Too many OTP requests. Please try again later.');

export const aiAdvisorRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || 'anonymous',
  message: { success: false, message: 'Too many AI Advisor requests. Please try again later.' },
});
