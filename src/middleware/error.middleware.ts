import { Request, Response, NextFunction } from 'express';
import { AppException } from '../common/exceptions';
import { config } from '../config/config';

// Last middleware in the chain (registered in app.controller.ts).
// Every thrown error — custom AppException or unexpected — lands here.
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppException) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Handle Mongo duplicate-key errors that slip through without a manual check.
  if ((err as any).code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
    });
  }

  console.error('[Unhandled Error]', err);

  return res.status(500).json({
    success: false,
    message: config.env === 'production' ? 'Internal server error' : err.message,
  });
}

// 404 handler for unmatched routes.
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
}
