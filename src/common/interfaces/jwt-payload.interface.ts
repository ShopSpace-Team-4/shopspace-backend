import { Role } from '../enums/role.enum';

// Shape of the data we encode inside every access/refresh JWT.
export interface IJwtPayload {
  userId: string;
  roles: Role[];
  tokenVersion?: number; // bump this on logout/password change to invalidate old refresh tokens
}
