import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (retryCount = 0, maxRetries = 5) => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    // Connection options with pooling and retry logic
    const options = {
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2,  // Minimum number of connections in the pool
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Socket timeout
      retryWrites: true, // Enable retry writes
      retryReads: true,   // Enable retry reads
      w: 'majority',      // Write concern
      wtimeoutMS: 10000,  // Write timeout (using correct option name)
    };

    const conn = await mongoose.connect(mongoUri, options);
    
    // Handle connection events with better error handling
    mongoose.connection.on('error', (err) => {
      // Don't exit the process, let it try to reconnect
    });
    
    mongoose.connection.on('disconnected', () => {
      // Attempting to reconnect
    });
    
    mongoose.connection.on('reconnected', () => {
      // Reconnected successfully
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        process.exit(0);
      } catch (error) {
        process.exit(1);
      }
    });
    
    // Handle process termination
    process.on('SIGTERM', async () => {
      try {
        await mongoose.connection.close();
        process.exit(0);
      } catch (error) {
        process.exit(1);
      }
    });
    
  } catch (error) {
    // Check if we've exceeded max retries
    if (retryCount >= maxRetries) {
      process.exit(1);
    }
    
    // Calculate exponential backoff delay (2^retryCount * 1000ms, max 30 seconds)
    const delay = Math.min(Math.pow(2, retryCount) * 1000, 30000);
    
    // Retry connection after delay
    setTimeout(() => {
      connectDB(retryCount + 1, maxRetries);
    }, delay);
  }
};

export default connectDB;
