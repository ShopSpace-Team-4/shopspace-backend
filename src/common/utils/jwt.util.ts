import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../../config/config';
import { IJwtPayload } from '../interfaces/jwt-payload.interface';

// Centralizes every place we create or read a JWT so the auth module
// never touches the `jsonwebtoken` package directly.
export const JwtUtil = {
  signAccessToken(payload: IJwtPayload): string {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
    } as SignOptions);
  },

  signRefreshToken(payload: IJwtPayload): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as SignOptions);
  },

  verifyAccessToken(token: string): IJwtPayload {
    return jwt.verify(token, config.jwt.accessSecret) as IJwtPayload;
  },

  verifyRefreshToken(token: string): IJwtPayload {
    return jwt.verify(token, config.jwt.refreshSecret) as IJwtPayload;
  },
};
