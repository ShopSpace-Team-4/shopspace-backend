import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.util';
import { ApiResponse } from '../../common/response/api-response';
import { userService } from './user.service';
import { UnauthorizedException } from '../../common/exceptions';

export const userController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedException();
    const profile = await userService.getMe(req.user.userId);
    return ApiResponse.success(res, profile);
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedException();
    const profile = await userService.updateMe(req.user.userId, req.body);
    return ApiResponse.success(res, profile, 'Profile updated successfully');
  }),

  updatePassword: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedException();
    await userService.updatePassword(req.user.userId, req.body);
    return ApiResponse.success(res, null, 'Password updated successfully');
  }),

  deleteMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedException();
    await userService.deleteMe(req.user.userId);
    return ApiResponse.success(res, null, 'Account deleted successfully');
  }),
};
