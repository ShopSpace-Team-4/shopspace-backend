import { JwtPayload } from "jsonwebtoken";
import { IJwtPayload } from "../interfaces/jwt-payload.interface";

// Augments Express's Request type so `req.user` (set by the authentication
// middleware) and `req.decoded` (set by the token service) are typed.
declare global {
    namespace Express {
        interface Request {
            user?: IJwtPayload;
            decoded: JwtPayload;
        }
    }
}

export {};
