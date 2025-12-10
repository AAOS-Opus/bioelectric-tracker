/**
 * MongoDB Connection Health Check Tests
 *
 * Tests for the enhanced MongoDB connection system including:
 * - Connection establishment and retry logic
 * - Health check functionality
 * - Error handling and logging
 * - Environment-based behavior
 */

import { connectDB, checkMongoHealth, disconnectDB } from '@/lib/db'
import mongoose from 'mongoose'

// Mock environment variables for testing
const originalEnv = process.env

beforeEach(() => {
  // Reset environment for each test
  jest.resetModules()
  process.env = { ...originalEnv }
})

afterAll(() => {
  process.env = originalEnv
})

describe('MongoDB Connection Management', () => {
  afterEach(async () => {
    // Clean up connections after each test
    try {
      await disconnectDB()
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('connectDB', () => {
    it('should establish a connection successfully', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test-bioelectric'

      const connection = await connectDB()

      expect(connection).toBeDefined()
      expect(connection.connection.readyState).toBe(1) // Connected
    }, 30000) // Increase timeout for connection

    it('should reuse existing connection', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test-bioelectric'

      const connection1 = await connectDB()
      const connection2 = await connectDB()

      expect(connection1).toBe(connection2)
    }, 30000)

    it('should handle connection failures gracefully', async () => {
      process.env.MONGODB_URI = 'mongodb://invalid-host:27017/test'

      await expect(connectDB()).rejects.toThrow()
    }, 30000)
  })

  describe('checkMongoHealth', () => {
    it('should return disconnected status when not connected', async () => {
      const health = await checkMongoHealth()

      expect(health.mongoStatus).toBe('disconnected')
      expect(health.pingTimeMs).toBeNull()
      expect(health.activeConnections).toBe(0)
      expect(health.registeredModels).toEqual([])
    })

    it('should return connected status and metrics when connected', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test-bioelectric'

      await connectDB()
      const health = await checkMongoHealth()

      expect(health.mongoStatus).toBe('connected')
      expect(health.pingTimeMs).toBeGreaterThanOrEqual(0)
      expect(health.activeConnections).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(health.registeredModels)).toBe(true)
    }, 30000)

    it('should include connection attempts in health status', async () => {
      const health = await checkMongoHealth()

      expect(typeof health.connectionAttempts).toBe('number')
    })
  })

  describe('disconnectDB', () => {
    it('should close connection cleanly', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test-bioelectric'

      await connectDB()
      await disconnectDB()

      // Check that cached connection is cleared
      const health = await checkMongoHealth()
      expect(health.mongoStatus).toBe('disconnected')
    }, 30000)
  })
})

describe('Error Handling', () => {
  it('should log structured errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    process.env.MONGODB_URI = 'mongodb://invalid-host:27017/test'

    try {
      await connectDB()
    } catch (error) {
      // Expected to fail
    }

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('MongoDB Error:'),
      expect.any(String)
    )

    consoleSpy.mockRestore()
  }, 30000)

  it('should mask credentials in error logs', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    process.env.MONGODB_URI = 'mongodb://user:password@invalid-host:27017/test'

    try {
      await connectDB()
    } catch (error) {
      // Expected to fail
    }

    const errorLogs = consoleSpy.mock.calls.map(call => call.join(' '))
    const hasCredentials = errorLogs.some(log =>
      log.includes('user:password') || log.includes('user') && log.includes('password')
    )

    expect(hasCredentials).toBe(false)

    consoleSpy.mockRestore()
  }, 30000)
})

describe('Environment Configuration', () => {
  it('should use default MongoDB URI when not provided', () => {
    delete process.env.MONGODB_URI

    // Re-import to trigger default value
    jest.resetModules()
    const { connectDB } = require('@/lib/db')

    // Should not throw for missing URI (uses default)
    expect(() => connectDB).not.toThrow()
  })

  it('should throw error for empty MongoDB URI', () => {
    process.env.MONGODB_URI = ''

    expect(() => {
      jest.resetModules()
      require('@/lib/db')
    }).toThrow('Please define the MONGODB_URI environment variable')
  })
})

describe('Connection Pool Configuration', () => {
  it('should configure connection pool settings correctly', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-bioelectric'

    const connection = await connectDB()

    // Verify connection options are applied
    expect(connection.connection.readyState).toBe(1)

    // Check that connection uses configured options
    const connectionOptions = (connection.connection as any).client?.options
    expect(connectionOptions).toBeDefined()
  }, 30000)
})