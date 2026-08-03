/// <reference path="./common/types/express.d.ts" />
import { createApp } from './app.controller';
import { connectDB } from './DB/connection.db';
import { config } from './config/config';

// The only file that actually starts the server: connects to Mongo,
// then boots the Express app on the configured port.
async function bootstrap(): Promise<void> {
  await connectDB();

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`[Server] ShopSpace API running on port ${config.port} (${config.env})`);
  });
}

bootstrap().catch((error) => {
  console.error('[Bootstrap] Failed to start server:', error);
  process.exit(1);
});
