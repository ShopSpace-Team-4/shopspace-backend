import express from "express";
import { PORT } from "./config/config";
import type { Request, Response, Express, NextFunction } from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import { authRoutes } from "./modules/auth";
import { userRoutes } from "./modules/user";
import DBConnection from "./DB/connection.db";
import { globalErrorHandler } from "./middleware/error.middleware";
const bootsrap = async () => {
  const app: Express = express();

  // ---- Global middleware ----
  app.use(express.json(), cors(), cookieParser())

  app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ message: 'hello buddy 👻' })
  })

  // ---- API routes ----
  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/users', userRoutes)

  // ---- Error handling (must be last) ----
  app.use(globalErrorHandler)
  await DBConnection()


  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
export default bootsrap
