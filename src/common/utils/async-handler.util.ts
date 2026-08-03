import { Request, Response, NextFunction, RequestHandler } from 'express';

// Wraps an async controller/middleware function and forwards any thrown
// error to next(), so we never need try/catch in every controller method.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
