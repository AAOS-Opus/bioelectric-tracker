import mongoose from 'mongoose';
import { isTestMode } from '@/lib/test-mode';
// Load models at top level
import '@/models/schema';

// Use a more robust connection string with options
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:27017/bioelectric';
const MAX_RETRY_ATTEMPTS = 3; // Limit to exactly 3 retry attempts
const RETRY_DELAYS = [500, 1000, 2000]; // Exponential backoff delays in milliseconds

console.log('MongoDB URI:', MONGODB_URI);

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, retryAttempts: 0 };
}

/**
 * Gets delay for specific retry attempt using predefined exponential backoff
 * @param attempt - Current attempt number (0-based)
 * @returns Delay in milliseconds
 */
function getRetryDelay(attempt) {
  return RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
}

/**
 * Logs MongoDB errors with structured format
 * @param error - The error to log
 * @param operation - The operation that caused the error
 * @param attempt - Current connection attempt number (optional)
 */
function logMongoError(error, operation, attempt) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: error.message,
    operation,
    connectionAttempt: attempt
  };
  
  console.error('MongoDB Error:', JSON.stringify(errorLog, null, 2));
}

export async function connectToDatabase() {
  // Fail fast if TEST_MODE is enabled
  if (isTestMode()) {
    const testModeError = new Error('Database connection bypassed due to TEST_MODE');
    console.log('MongoDB connection bypassed: TEST_MODE is enabled');
    logMongoError(testModeError, 'test_mode_bypass');
    throw testModeError;
  }

  console.log('Attempting database connection...');
  
  if (cached.conn) {
    console.log('Using existing database connection');
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = connectWithRetry();
  }

  try {
    console.log('Awaiting database connection promise');
    cached.conn = await cached.promise;
    cached.retryAttempts = 0; // Reset on successful connection
    return cached.conn;
  } catch (e) {
    console.error('Database connection failed:', e);
    cached.promise = null;
    throw e;
  }
}

/**
 * Internal connection function with retry logic
 */
async function connectWithRetry() {
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      cached.retryAttempts = attempt + 1;

      const opts = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      };

      console.log(`MongoDB connection attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS + 1} (TEST_MODE: ${isTestMode() ? 'enabled' : 'disabled'})`);
      console.log('Creating new database connection with options:', opts);

      const connection = await mongoose.connect(MONGODB_URI, opts);
      console.log('MongoDB connected successfully');
      return connection;

    } catch (error) {
      lastError = error;
      logMongoError(lastError, 'connection', attempt + 1);

      // Don't retry on the last attempt
      if (attempt === MAX_RETRY_ATTEMPTS) {
        break;
      }

      // Calculate delay and wait before retry
      const delay = getRetryDelay(attempt);
      console.log(`Retrying MongoDB connection in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS + 1})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retry attempts failed
  const finalError = new Error(
    `MongoDB connection failed after ${MAX_RETRY_ATTEMPTS + 1} attempts. Last error: ${lastError?.message}`
  );
  logMongoError(finalError, 'connection_exhausted');
  throw finalError;
}
