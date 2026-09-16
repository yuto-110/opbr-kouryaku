import mongoose from 'mongoose';
import { logger } from '../../logger';

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    logger.info('Already connected to MongoDB');
    return;
  }

  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    await mongoose.connect(mongodbUri);
    isConnected = true;
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to MongoDB');
    throw error;
  }
}

export async function disconnectDB() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error({ error }, 'Failed to disconnect from MongoDB');
    throw error;
  }
}

export function getConnection() {
  return mongoose.connection;
}
