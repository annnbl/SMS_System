import mongoose from 'mongoose';
import { ENV } from './env.js';

let mongodInstance = null;

export const connectDB = async () => {
  try {
    console.log(`[DB] Attempting connection to MongoDB at: ${ENV.MONGODB_URI}`);
    // Set a 3-second timeout for initial connection attempt so fallback is fast if not running locally
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('[DB] Connected to MongoDB database successfully.');
  } catch (err) {
    console.warn(`[DB] Could not connect to primary MongoDB (${err.message}). Starting MongoMemoryServer fallback...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      console.log(`[DB] MongoMemoryServer started successfully at ${memoryUri}`);
      await mongoose.connect(memoryUri);
      console.log('[DB] Connected to in-memory MongoDB fallback database.');
    } catch (fallbackErr) {
      console.error('[DB] Fatal error: Failed to connect to MongoDB and failed to start in-memory fallback:', fallbackErr);
      process.exit(1);
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('[DB] Runtime MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected.');
  });
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};
