import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.util';
import { ApiResponse } from '../../common/response/api-response';
import { authService } from './auth.service';
import { UnauthorizedException } from '../../common/exceptions';

// Thin HTTP layer: parse req -> call service -> shape response.
// No business logic lives here, only request/response plumbing.
export const authController = {
  signup: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.signup(req.body);
    return ApiResponse.success(res, result, 'Signup successful. Please check your email for an OTP code.', 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const tokens = await authService.login(req.body);
    return ApiResponse.success(res, tokens, 'Login successful');
  }),

  verify: asyncHandler(async (req: Request, res: Response) => {
    await authService.verifyAccount(req.body);
    return ApiResponse.success(res, null, 'Account verified successfully');
  }),

  resendOtp: asyncHandler(async (req: Request, res: Response) => {
    await authService.resendOtp(req.body);
    return ApiResponse.success(res, null, 'A new OTP code has been sent to your email');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedException();
    await authService.logout(req.user.userId);
    return ApiResponse.success(res, null, 'Logged out successfully');
  }),

  refreshToken: asyncHandler(async (req: Request, res: Response) => {
    const tokens = await authService.refreshToken(req.body);
    return ApiResponse.success(res, tokens, 'Token refreshed successfully');
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body);
    return ApiResponse.success(res, null, 'If that email exists, a reset code has been sent');
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body);
    return ApiResponse.success(res, null, 'Password reset successfully. Please log in again.');
  }),
};
