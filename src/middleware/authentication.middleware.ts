import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../common/utils/jwt.util';
import { UnauthorizedException } from '../common/exceptions';
import { userRepository } from '../DB/repository/user.repository';

// "protect" — attach this to any route that requires a logged-in user.
// Reads "Authorization: Bearer <token>", verifies it, and loads req.user.
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No authentication token provided');
    }

    const token = authHeader.split(' ')[1];
    const payload = JwtUtil.verifyAccessToken(token);

    // Make sure the user still exists and the token wasn't issued before
    // a logout/password-change (tokenVersion mismatch).
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Session expired, please log in again');
    }

    req.user = payload;
    next();
  } catch (error) {
    next(new UnauthorizedException('Invalid or expired token'));
  }
}

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const payload = JwtUtil.verifyAccessToken(token);
    const user = await userRepository.findById(payload.userId);
    if (!user || user.tokenVersion !== payload.tokenVersion) return next();

    req.user = payload;
    return next();
  } catch {
    return next();
  }
}
