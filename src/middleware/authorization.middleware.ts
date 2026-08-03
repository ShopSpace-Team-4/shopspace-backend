import { NextFunction, Request, Response } from "express";
import { ForbiddenException, UnauthorizedException } from "../common/exceptions";
import { Role } from "../common/enums/role.enum";
export const authorization = (accessRoles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) throw new UnauthorizedException();

        if (!accessRoles.includes(req.user.role)) {
            throw new ForbiddenException("Not authorized account");
        }

        return next();
    };
};