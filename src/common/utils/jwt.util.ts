import jwt, { SignOptions } from 'jsonwebtoken';
import {
  JWT_ACCESS_EXPIRES_IN,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_EXPIRES_IN,
  JWT_REFRESH_SECRET,
} from '../../config/config';
import { IJwtPayload } from '../interfaces/jwt-payload.interface';

// Centralizes every place we create or read a JWT so the auth module
// never touches the `jsonwebtoken` package directly.
export const JwtUtil = {
  signAccessToken(payload: IJwtPayload): string {
    return jwt.sign(payload, JWT_ACCESS_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES_IN,
    } as SignOptions);
  },

  signRefreshToken(payload: IJwtPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    } as SignOptions);
  },

  verifyAccessToken(token: string): IJwtPayload {
    return jwt.verify(token, JWT_ACCESS_SECRET) as IJwtPayload;
  },

  verifyRefreshToken(token: string): IJwtPayload {
    return jwt.verify(token, JWT_REFRESH_SECRET) as IJwtPayload;
  },
};
