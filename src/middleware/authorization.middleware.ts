import { Request, Response, NextFunction } from 'express';
import { Role } from '../common/enums/role.enum';
import { ForbiddenException, UnauthorizedException } from '../common/exceptions';

// Generic role guard: authorize(Role.LANDLORD, Role.TENANT) etc.
// Must run AFTER `authenticate`, since it reads req.user.
function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedException());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenException());
    }
    next();
  };
}

// Convenience guards used throughout the routes, matching the PRD's two
// Phase 1 roles (Landlord / Tenant).
export const isLandlord = authorize(Role.LANDLORD);
export const isTenant = authorize(Role.TENANT);
export { authorize };
