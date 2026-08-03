import { IJwtPayload } from '../interfaces/jwt-payload.interface';

// Augments Express's Request type so `req.user` is typed everywhere
// after the authentication middleware runs.
declare global {
  namespace Express {
    interface Request {
      user?: IJwtPayload;
    }
  }
}

export {};
