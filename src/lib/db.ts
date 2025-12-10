import mongoose from 'mongoose'
import { isTestMode } from '@/lib/test-mode'

declare global {
  var mongoose: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
    reconnectAttempts: number
    lastConnectionError: Error | null
    lastConnectionTime: Date | null
  }
}

/**
 * MongoDB connection configuration and utilities
 * Provides robust connection management with exponential backoff,
 * structured error logging, and health monitoring capabilities
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/bioelectric-tracker'
const NODE_ENV = process.env.NODE_ENV || 'development'
const MAX_RECONNECT_ATTEMPTS = 3 // Limit to exactly 3 retry attempts
const RETRY_DELAYS = [500, 1000, 2000] // Exponential backoff delays in milliseconds
const CONNECTION_TIMEOUT = 10000 // 10 seconds
const PING_TIMEOUT = 5000 // 5 seconds

/**
 * Structured error logging interface for MongoDB operations
 */
interface MongoErrorLog {
  timestamp: string
  error: string
  mongoCode?: number
  mongoCodeName?: string
  stack?: string
  connectionAttempt?: number
  uri?: string
  operation: string
}

/**
 * MongoDB connection health status
 */
export interface MongoHealthStatus {
  mongoStatus: 'connected' | 'connecting' | 'disconnected'
  pingTimeMs: number | null
  activeConnections: number
  registeredModels: string[]
  lastError?: string
  connectionAttempts?: number
}

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

// Enhanced global cache with reconnection tracking
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
    reconnectAttempts: 0,
    lastConnectionError: null,
    lastConnectionTime: null
  }
}

/**
 * Logs MongoDB errors with structured format including error codes and timestamps
 * @param error - The error to log
 * @param operation - The operation that caused the error
 * @param attempt - Current connection attempt number (optional)
 */
function logMongoError(error: Error, operation: string, attempt?: number): void {
  const errorLog: MongoErrorLog = {
    timestamp: new Date().toISOString(),
    error: error.message,
    operation,
    stack: NODE_ENV === 'development' ? error.stack : undefined,
    uri: MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') // Mask credentials
  }

  // Extract MongoDB-specific error information
  if ('code' in error) {
    errorLog.mongoCode = error.code as number
  }
  if ('codeName' in error) {
    errorLog.mongoCodeName = error.codeName as string
  }
  if (attempt !== undefined) {
    errorLog.connectionAttempt = attempt
  }

  console.error('MongoDB Error:', JSON.stringify(errorLog, null, 2))

  // Cache the last error for health checks
  cached.lastConnectionError = error
}

/**
 * Gets delay for specific retry attempt using predefined exponential backoff
 * @param attempt - Current attempt number (0-based)
 * @returns Delay in milliseconds
 */
function getRetryDelay(attempt: number): number {
  // Use predefined delays for exact exponential backoff: 500ms, 1000ms, 2000ms
  return RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
}

/**
 * Connects to MongoDB with enhanced error handling, connection pooling,
 * and exponential backoff retry logic
 * @returns Promise resolving to mongoose connection
 */
export async function connectDB(): Promise<typeof mongoose> {
  // Fail fast if TEST_MODE is enabled
  if (isTestMode()) {
    const testModeError = new Error('Database connection bypassed due to TEST_MODE')
    console.log('MongoDB connection bypassed: TEST_MODE is enabled')
    logMongoError(testModeError, 'test_mode_bypass')
    throw testModeError
  }

  // Return existing connection if available and healthy
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn
  }

  // Return existing promise if connection is in progress
  if (cached.promise) {
    try {
      return await cached.promise
    } catch (error) {
      // Clear failed promise to allow retry
      cached.promise = null
      throw error
    }
  }

  // Create new connection promise with retry logic
  cached.promise = connectWithRetry()

  try {
    cached.conn = await cached.promise
    cached.reconnectAttempts = 0 // Reset on successful connection
    cached.lastConnectionTime = new Date()
    cached.lastConnectionError = null
    return cached.conn
  } catch (error) {
    cached.promise = null // Clear failed promise
    throw error
  }
}

/**
 * Internal connection function with exponential backoff retry logic
 * @returns Promise resolving to mongoose connection
 */
async function connectWithRetry(): Promise<typeof mongoose> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RECONNECT_ATTEMPTS; attempt++) {
    try {
      cached.reconnectAttempts = attempt + 1

      const connectionOptions: mongoose.ConnectOptions = {
        bufferCommands: false,
        maxPoolSize: 10, // Maximum number of connections in pool
        minPoolSize: 2,  // Minimum number of connections in pool
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        serverSelectionTimeoutMS: CONNECTION_TIMEOUT,
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
        retryWrites: true, // Retry write operations on transient errors
        retryReads: true,  // Retry read operations on transient errors
        // Monitoring and logging
        monitorCommands: NODE_ENV === 'development',
      }

      console.log(`MongoDB connection attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS + 1} (TEST_MODE: ${isTestMode() ? 'enabled' : 'disabled'})`)

      const connection = await mongoose.connect(MONGODB_URI, connectionOptions)

      // Set up connection event listeners for monitoring
      setupConnectionListeners(connection)

      console.log('MongoDB connected successfully')
      return connection

    } catch (error) {
      lastError = error as Error
      logMongoError(lastError, 'connection', attempt + 1)

      // Don't retry on the last attempt
      if (attempt === MAX_RECONNECT_ATTEMPTS) {
        break
      }

      // Calculate delay and wait before retry
      const delay = getRetryDelay(attempt)
      console.log(`Retrying MongoDB connection in ${delay}ms (attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS + 1})...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // All retry attempts failed
  const finalError = new Error(
    `MongoDB connection failed after ${MAX_RECONNECT_ATTEMPTS + 1} attempts. Last error: ${lastError?.message}`
  )
  logMongoError(finalError, 'connection_exhausted')
  throw finalError
}

/**
 * Sets up MongoDB connection event listeners for monitoring and logging
 * @param connection - The mongoose connection to monitor
 */
function setupConnectionListeners(connection: typeof mongoose): void {
  const db = connection.connection

  // Remove existing listeners to prevent duplicates during hot reloads
  db.removeAllListeners('connected')
  db.removeAllListeners('error')
  db.removeAllListeners('disconnected')
  db.removeAllListeners('reconnected')

  db.on('connected', () => {
    console.log('MongoDB connected event triggered')
    cached.lastConnectionTime = new Date()
    cached.lastConnectionError = null
  })

  db.on('error', (error: Error) => {
    logMongoError(error, 'runtime_error')
  })

  db.on('disconnected', () => {
    console.log('MongoDB disconnected')
    // Don't automatically reconnect in production - let the application handle it
    if (NODE_ENV === 'development') {
      console.log('Attempting to reconnect...')
    }
  })

  db.on('reconnected', () => {
    console.log('MongoDB reconnected')
    cached.reconnectAttempts = 0
    cached.lastConnectionTime = new Date()
    cached.lastConnectionError = null
  })

  // Development-only command monitoring
  if (NODE_ENV === 'development') {
    mongoose.set('debug', (collectionName: string, method: string, query: any) => {
      console.log(`MongoDB Query: ${collectionName}.${method}`, query)
    })
  }
}

/**
 * Performs a health check on the MongoDB connection
 * @returns Promise resolving to health status information
 */
export async function checkMongoHealth(): Promise<MongoHealthStatus> {
  const startTime = Date.now()
  let pingTimeMs: number | null = null
  let mongoStatus: 'connected' | 'connecting' | 'disconnected' = 'disconnected'

  try {
    // Check connection state
    if (!cached.conn) {
      mongoStatus = 'disconnected'
    } else {
      const readyState = cached.conn.connection.readyState
      switch (readyState) {
        case 0: mongoStatus = 'disconnected'; break
        case 1: mongoStatus = 'connected'; break
        case 2: mongoStatus = 'connecting'; break
        default: mongoStatus = 'disconnected'
      }
    }

    // Perform ping test if connected
    if (mongoStatus === 'connected' && cached.conn) {
      const pingStart = Date.now()

      // Use admin.ping() for more accurate latency measurement
      await Promise.race([
        cached.conn.connection.db.admin().ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Ping timeout')), PING_TIMEOUT)
        )
      ])

      pingTimeMs = Date.now() - pingStart
    }

    // Get active connections count
    const activeConnections = cached.conn?.connection.readyState === 1
      ? (cached.conn.connection as any).client?.topology?.s?.sessionPool?.sessionCount || 0
      : 0

    // Get registered models
    const registeredModels = cached.conn
      ? Object.keys(cached.conn.models)
      : []

    const healthStatus: MongoHealthStatus = {
      mongoStatus,
      pingTimeMs,
      activeConnections,
      registeredModels,
      connectionAttempts: cached.reconnectAttempts
    }

    // Include last error if health check is not fully healthy
    if (cached.lastConnectionError && (mongoStatus !== 'connected' || !pingTimeMs || pingTimeMs > 500)) {
      healthStatus.lastError = cached.lastConnectionError.message
    }

    return healthStatus

  } catch (error) {
    logMongoError(error as Error, 'health_check')

    return {
      mongoStatus: 'disconnected',
      pingTimeMs: null,
      activeConnections: 0,
      registeredModels: [],
      lastError: (error as Error).message,
      connectionAttempts: cached.reconnectAttempts
    }
  }
}

/**
 * Gracefully closes the MongoDB connection
 * @returns Promise that resolves when connection is closed
 */
export async function disconnectDB(): Promise<void> {
  try {
    if (cached.conn) {
      await cached.conn.disconnect()
      cached.conn = null
      cached.promise = null
      console.log('MongoDB connection closed')
    }
  } catch (error) {
    logMongoError(error as Error, 'disconnect')
    throw error
  }
}
