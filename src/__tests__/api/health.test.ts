/**
 * Health Check API Route Tests
 *
 * Tests for the /api/health endpoint including:
 * - Environment-based access control
 * - Health status reporting
 * - HTTP status code handling
 * - Response format validation
 */

import { GET, HEAD, OPTIONS } from '@/app/api/health/route'
import { NextRequest } from 'next/server'

// Mock the db module
jest.mock('@/lib/db', () => ({
  checkMongoHealth: jest.fn()
}))

import { checkMongoHealth } from '@/lib/db'
const mockCheckMongoHealth = checkMongoHealth as jest.MockedFunction<typeof checkMongoHealth>

// Create mock request
function createMockRequest(url = 'http://localhost:3000/api/health'): NextRequest {
  return new NextRequest(url)
}

describe('/api/health endpoint', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('GET /api/health', () => {
    it('should return 200 for healthy MongoDB connection', async () => {
      process.env.NODE_ENV = 'development'

      mockCheckMongoHealth.mockResolvedValue({
        mongoStatus: 'connected',
        pingTimeMs: 50,
        activeConnections: 5,
        registeredModels: ['User', 'Phase', 'Product']
      })

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.mongoStatus).toBe('connected')
      expect(data.pingTimeMs).toBe(50)
      expect(data.activeConnections).toBe(5)
      expect(data.registeredModels).toEqual(['User', 'Phase', 'Product'])
      expect(data.timestamp).toBeDefined()
      expect(data.environment).toBe('development')
      expect(data.uptime).toBeGreaterThanOrEqual(0)
    })

    it('should return 503 for disconnected MongoDB', async () => {
      process.env.NODE_ENV = 'development'

      mockCheckMongoHealth.mockResolvedValue({
        mongoStatus: 'disconnected',
        pingTimeMs: null,
        activeConnections: 0,
        registeredModels: [],
        lastError: 'Connection refused'
      })

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.mongoStatus).toBe('disconnected')
      expect(data.lastError).toBe('Connection refused')
    })

    it('should return 503 for slow ping times', async () => {
      process.env.NODE_ENV = 'development'

      mockCheckMongoHealth.mockResolvedValue({
        mongoStatus: 'connected',
        pingTimeMs: 800, // Above 500ms threshold
        activeConnections: 3,
        registeredModels: ['User']
      })

      const request = createMockRequest()
      const response = await GET(request)

      expect(response.status).toBe(503)
    })

    it('should return 404 in production without explicit enable', async () => {
      process.env.NODE_ENV = 'production'
      delete process.env.ENABLE_HEALTH_ENDPOINT

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Health endpoint not available')
      expect(mockCheckMongoHealth).not.toHaveBeenCalled()
    })

    it('should work in production with explicit enable', async () => {
      process.env.NODE_ENV = 'production'
      process.env.ENABLE_HEALTH_ENDPOINT = 'true'

      mockCheckMongoHealth.mockResolvedValue({
        mongoStatus: 'connected',
        pingTimeMs: 100,
        activeConnections: 2,
        registeredModels: ['User', 'Phase']
      })

      const request = createMockRequest()
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockCheckMongoHealth).toHaveBeenCalled()
    })

    it('should handle health check timeout', async () => {
      process.env.NODE_ENV = 'development'

      // Mock a hanging health check
      mockCheckMongoHealth.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          mongoStatus: 'connected',
          pingTimeMs: 50,
          activeConnections: 1,
          registeredModels: []
        }), 10000)) // 10 second delay
      )

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.lastError).toContain('timeout')
    }, 10000)

    it('should include correct response headers', async () => {
      process.env.NODE_ENV = 'development'

      mockCheckMongoHealth.mockResolvedValue({
        mongoStatus: 'connected',
        pingTimeMs: 50,
        activeConnections: 1,
        registeredModels: []
      })

      const request = createMockRequest()
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      expect(response.headers.get('X-Environment')).toBe('development')
      expect(response.headers.get('X-Health-Check-Duration')).toMatch(/\d+ms/)
    })
  })

  describe('HEAD /api/health', () => {
    it('should return status without body for healthy connection', async () => {
      process.env.NODE_ENV = 'development'

      mockCheckMongoHealth.mockResolvedValue({
        mongoStatus: 'connected',
        pingTimeMs: 50,
        activeConnections: 1,
        registeredModels: []
      })

      const request = createMockRequest()
      const response = await HEAD(request)

      expect(response.status).toBe(200)
      expect(response.body).toBeNull()
    })

    it('should return 503 for unhealthy connection', async () => {
      process.env.NODE_ENV = 'development'

      mockCheckMongoHealth.mockResolvedValue({
        mongoStatus: 'disconnected',
        pingTimeMs: null,
        activeConnections: 0,
        registeredModels: []
      })

      const request = createMockRequest()
      const response = await HEAD(request)

      expect(response.status).toBe(503)
      expect(response.body).toBeNull()
    })

    it('should return 404 in production without enable', async () => {
      process.env.NODE_ENV = 'production'
      delete process.env.ENABLE_HEALTH_ENDPOINT

      const request = createMockRequest()
      const response = await HEAD(request)

      expect(response.status).toBe(404)
      expect(response.body).toBeNull()
      expect(mockCheckMongoHealth).not.toHaveBeenCalled()
    })
  })

  describe('OPTIONS /api/health', () => {
    it('should return CORS headers', async () => {
      const request = createMockRequest()
      const response = await OPTIONS(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Allow')).toBe('GET, HEAD, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, HEAD, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization')
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400')
    })
  })

  describe('Error Handling', () => {
    it('should handle health check function errors', async () => {
      process.env.NODE_ENV = 'development'

      mockCheckMongoHealth.mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.mongoStatus).toBe('disconnected')
      expect(data.lastError).toBe('Database connection failed')
    })

    it('should handle non-Error exceptions', async () => {
      process.env.NODE_ENV = 'development'

      mockCheckMongoHealth.mockRejectedValue('String error')

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.lastError).toBe('Unknown health check error')
    })
  })

  describe('Environment Variables', () => {
    it('should detect development environment correctly', async () => {
      process.env.NODE_ENV = 'development'

      mockCheckMongoHealth.mockResolvedValue({
        mongoStatus: 'connected',
        pingTimeMs: 50,
        activeConnections: 1,
        registeredModels: []
      })

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(data.environment).toBe('development')
    })

    it('should detect production environment correctly', async () => {
      process.env.NODE_ENV = 'production'
      process.env.ENABLE_HEALTH_ENDPOINT = 'true'

      mockCheckMongoHealth.mockResolvedValue({
        mongoStatus: 'connected',
        pingTimeMs: 50,
        activeConnections: 1,
        registeredModels: []
      })

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(data.environment).toBe('production')
    })

    it('should handle missing NODE_ENV', async () => {
      delete process.env.NODE_ENV

      mockCheckMongoHealth.mockResolvedValue({
        mongoStatus: 'connected',
        pingTimeMs: 50,
        activeConnections: 1,
        registeredModels: []
      })

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(data.environment).toBe('development') // Default fallback
    })
  })
})