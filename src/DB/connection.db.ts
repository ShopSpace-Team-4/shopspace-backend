import mongoose from 'mongoose';
import { config } from '../config/config';

// Opens the MongoDB connection once at app startup (called from main.ts).
export async function connectDB(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongo.uri);
    console.log(`[DB] Connected to MongoDB (${config.env})`);
  } catch (error) {
    console.error('[DB] Connection failed:', error);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected');
  });
}
