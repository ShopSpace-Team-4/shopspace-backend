import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/config';
import { authRoutes } from './modules/auth';
import { userRoutes } from './modules/user';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Builds and configures the Express application instance.
// Kept separate from main.ts so tests can import the app without
// actually binding a port or opening a DB connection.
export function createApp(): Application {
  const app = express();

  // ---- Global middleware ----
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // ---- Health check ----
  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'ShopSpace API is running', env: config.env });
  });

  // ---- Feature routes ----
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);

  // ---- 404 + global error handler (must be registered last) ----
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
