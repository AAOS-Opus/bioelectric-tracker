/**
 * Health Endpoint Comprehensive Test Suite
 *
 * IMPORTANT: This test requires the development server to be running!
 * Run `npm run dev` in a separate terminal before executing these tests.
 *
 * The tests make actual HTTP requests to http://localhost:3000/api/health
 * to verify real-world functionality of the MongoDB health check endpoint.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import fs from 'fs'
import path from 'path'

// Test configuration
const HEALTH_ENDPOINT_URL = 'http://localhost:3000/api/health'
const HEALTH_ENDPOINT_FILE = path.join(process.cwd(), 'src/app/api/health/route.ts')
const TEST_TIMEOUT = 30000 // 30 seconds

// Health check response interface for type checking
interface HealthCheckResponse {
  mongoStatus: 'connected' | 'connecting' | 'disconnected'
  pingTimeMs: number | null
  activeConnections: number
  registeredModels: string[]
  timestamp: string
  environment: string
  uptime: number
  version: string
  lastError?: string
  connectionAttempts?: number
}

// Helper function to make HTTP requests with timeout
async function makeHealthRequest(url: string = HEALTH_ENDPOINT_URL): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Health-Check-Test/1.0'
      },
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Health check request timed out after 10 seconds')
    }
    throw error
  }
}

// Helper function to validate response structure
function validateHealthResponse(data: any): data is HealthCheckResponse {
  const requiredFields = ['mongoStatus', 'pingTimeMs', 'activeConnections', 'registeredModels']
  const validStatuses = ['connected', 'connecting', 'disconnected']

  // Check required fields exist
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`)
    }
  }

  // Validate mongoStatus
  if (!validStatuses.includes(data.mongoStatus)) {
    throw new Error(`Invalid mongoStatus: ${data.mongoStatus}. Must be one of: ${validStatuses.join(', ')}`)
  }

  // Validate pingTimeMs
  if (data.pingTimeMs !== null && typeof data.pingTimeMs !== 'number') {
    throw new Error(`Invalid pingTimeMs: ${data.pingTimeMs}. Must be a number or null`)
  }

  // Validate activeConnections
  if (typeof data.activeConnections !== 'number' || data.activeConnections < 0) {
    throw new Error(`Invalid activeConnections: ${data.activeConnections}. Must be a non-negative number`)
  }

  // Validate registeredModels
  if (!Array.isArray(data.registeredModels)) {
    throw new Error(`Invalid registeredModels: ${data.registeredModels}. Must be an array`)
  }

  return true
}

describe('Health Endpoint Comprehensive Tests', () => {
  beforeAll(() => {
    console.log('\n🏥 Starting Health Endpoint Test Suite')
    console.log('=====================================')
    console.log(`📍 Target URL: ${HEALTH_ENDPOINT_URL}`)
    console.log(`⏰ Test timeout: ${TEST_TIMEOUT / 1000}s`)
    console.log('\n⚠️  REQUIREMENT: Development server must be running (npm run dev)')
  })

  afterAll(() => {
    console.log('\n✅ Health Endpoint Test Suite Completed')
  })

  describe('File System Checks', () => {
    it('should verify health endpoint file exists at expected location', () => {
      console.log(`\n🔍 Checking for file: ${HEALTH_ENDPOINT_FILE}`)

      expect(fs.existsSync(HEALTH_ENDPOINT_FILE)).toBe(true)

      const stats = fs.statSync(HEALTH_ENDPOINT_FILE)
      expect(stats.isFile()).toBe(true)

      console.log(`✅ File exists and is ${stats.size} bytes`)
    })

    it('should verify health endpoint file contains expected exports', () => {
      const content = fs.readFileSync(HEALTH_ENDPOINT_FILE, 'utf-8')

      // Check for required exports
      expect(content).toContain('export async function GET')
      expect(content).toContain('export async function HEAD')
      expect(content).toContain('export async function OPTIONS')

      // Check for key functionality
      expect(content).toContain('checkMongoHealth')
      expect(content).toContain('ENABLE_HEALTH_ENDPOINT')
      expect(content).toContain('mongoStatus')
      expect(content).toContain('pingTimeMs')

      console.log('✅ Health endpoint file contains all expected exports and functionality')
    })
  })

  describe('HTTP Request Tests', () => {
    it('should successfully make HTTP request to health endpoint', async () => {
      console.log(`\n🌐 Making HTTP GET request to ${HEALTH_ENDPOINT_URL}`)

      let response: Response
      try {
        response = await makeHealthRequest()
        console.log(`📊 Response status: ${response.status} ${response.statusText}`)
        console.log(`📋 Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`)
      } catch (error) {
        if (error.message.includes('fetch')) {
          throw new Error(
            `Failed to connect to health endpoint. Is the development server running?\n` +
            `Start the server with: npm run dev\n` +
            `Original error: ${error.message}`
          )
        }
        throw error
      }

      expect(response).toBeDefined()
      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.status).toBeLessThan(600)
    }, TEST_TIMEOUT)

    it('should return valid JSON response', async () => {
      console.log('\n📋 Validating JSON response format')

      const response = await makeHealthRequest()

      let data: any
      try {
        data = await response.json()
        console.log(`📦 Response data keys: ${Object.keys(data).join(', ')}`)
      } catch (error) {
        throw new Error(`Failed to parse JSON response: ${error.message}`)
      }

      expect(data).toBeDefined()
      expect(typeof data).toBe('object')
      expect(data).not.toBeNull()
    }, TEST_TIMEOUT)
  })

  describe('Response Structure Validation', () => {
    let healthData: any

    beforeAll(async () => {
      console.log('\n🔍 Fetching health data for structure validation...')
      const response = await makeHealthRequest()
      healthData = await response.json()
      console.log(`📊 Full response: ${JSON.stringify(healthData, null, 2)}`)
    })

    it('should include all required fields', () => {
      const requiredFields = ['mongoStatus', 'pingTimeMs', 'activeConnections', 'registeredModels']

      console.log('\n✅ Checking required fields:')
      for (const field of requiredFields) {
        console.log(`   ${field}: ${healthData[field]}`)
        expect(healthData).toHaveProperty(field)
      }
    })

    it('should have valid mongoStatus value', () => {
      const validStatuses = ['connected', 'connecting', 'disconnected']

      console.log(`\n🔌 MongoDB Status: ${healthData.mongoStatus}`)
      expect(validStatuses).toContain(healthData.mongoStatus)
      expect(typeof healthData.mongoStatus).toBe('string')
    })

    it('should have valid pingTimeMs when connected', () => {
      console.log(`\n⚡ Ping Time: ${healthData.pingTimeMs}ms`)

      if (healthData.mongoStatus === 'connected') {
        expect(healthData.pingTimeMs).not.toBeNull()
        expect(typeof healthData.pingTimeMs).toBe('number')
        expect(healthData.pingTimeMs).toBeGreaterThanOrEqual(0)

        if (healthData.pingTimeMs > 1000) {
          console.warn(`⚠️  High ping time detected: ${healthData.pingTimeMs}ms`)
        }
      } else {
        console.log('ℹ️  Ping time is null (database not connected)')
      }
    })

    it('should have valid activeConnections count', () => {
      console.log(`\n🔗 Active Connections: ${healthData.activeConnections}`)

      expect(typeof healthData.activeConnections).toBe('number')
      expect(healthData.activeConnections).toBeGreaterThanOrEqual(0)

      if (healthData.activeConnections > 50) {
        console.warn(`⚠️  High connection count: ${healthData.activeConnections}`)
      }
    })

    it('should have valid registeredModels array', () => {
      console.log(`\n📦 Registered Models: [${healthData.registeredModels.join(', ')}]`)

      expect(Array.isArray(healthData.registeredModels)).toBe(true)

      // Check if models are strings
      healthData.registeredModels.forEach((model: any, index: number) => {
        expect(typeof model).toBe('string')
        expect(model.length).toBeGreaterThan(0)
      })

      console.log(`📊 Total models registered: ${healthData.registeredModels.length}`)
    })

    it('should include metadata fields', () => {
      const metadataFields = ['timestamp', 'environment', 'uptime', 'version']

      console.log('\n📋 Checking metadata fields:')
      for (const field of metadataFields) {
        console.log(`   ${field}: ${healthData[field]}`)
        expect(healthData).toHaveProperty(field)
      }

      // Validate timestamp format
      expect(() => new Date(healthData.timestamp)).not.toThrow()

      // Validate uptime is a number
      expect(typeof healthData.uptime).toBe('number')
      expect(healthData.uptime).toBeGreaterThanOrEqual(0)
    })

    it('should pass complete response structure validation', () => {
      console.log('\n🧪 Running comprehensive structure validation...')

      expect(() => validateHealthResponse(healthData)).not.toThrow()

      console.log('✅ All structure validation checks passed')
    })
  })

  describe('HTTP Status Code Validation', () => {
    it('should return correct status codes based on health', async () => {
      console.log('\n📊 Validating HTTP status codes...')

      const response = await makeHealthRequest()
      const data = await response.json()

      console.log(`🔌 MongoDB Status: ${data.mongoStatus}`)
      console.log(`⚡ Ping Time: ${data.pingTimeMs}ms`)
      console.log(`📊 HTTP Status: ${response.status}`)

      if (data.mongoStatus === 'connected' && data.pingTimeMs !== null && data.pingTimeMs < 500) {
        expect(response.status).toBe(200)
        console.log('✅ Healthy response (200) - MongoDB connected with good ping')
      } else {
        expect(response.status).toBe(503)
        console.log('⚠️  Unhealthy response (503) - MongoDB disconnected or slow ping')
      }
    }, TEST_TIMEOUT)

    it('should handle HEAD requests correctly', async () => {
      console.log('\n🔍 Testing HEAD request method...')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      try {
        const response = await fetch(HEALTH_ENDPOINT_URL, {
          method: 'HEAD',
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        console.log(`📊 HEAD response status: ${response.status}`)
        console.log(`📏 Response body length: ${(await response.text()).length}`)

        expect([200, 503]).toContain(response.status)

        // HEAD response should have no body
        const text = await response.text()
        expect(text).toBe('')

      } catch (error) {
        clearTimeout(timeoutId)
        throw error
      }
    }, TEST_TIMEOUT)

    it('should handle OPTIONS requests for CORS', async () => {
      console.log('\n🌐 Testing OPTIONS request for CORS...')

      const response = await fetch(HEALTH_ENDPOINT_URL, {
        method: 'OPTIONS'
      })

      console.log(`📊 OPTIONS response status: ${response.status}`)
      console.log(`🔧 Allow header: ${response.headers.get('Allow')}`)

      expect(response.status).toBe(200)
      expect(response.headers.get('Allow')).toContain('GET')
      expect(response.headers.get('Allow')).toContain('HEAD')
      expect(response.headers.get('Allow')).toContain('OPTIONS')
    }, TEST_TIMEOUT)
  })

  describe('Error Handling Tests', () => {
    it('should handle malformed requests gracefully', async () => {
      console.log('\n🧪 Testing error handling with invalid requests...')

      // Test with invalid HTTP method
      const response = await fetch(HEALTH_ENDPOINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'data' })
      })

      console.log(`📊 POST response status: ${response.status}`)

      // Should return 405 Method Not Allowed or handle gracefully
      expect([405, 404]).toContain(response.status)
    }, TEST_TIMEOUT)
  })

  describe('Performance Tests', () => {
    it('should respond within reasonable time limits', async () => {
      console.log('\n⏱️  Testing response time performance...')

      const startTime = Date.now()
      const response = await makeHealthRequest()
      const endTime = Date.now()

      const responseTime = endTime - startTime
      console.log(`🕐 Response time: ${responseTime}ms`)

      expect(responseTime).toBeLessThan(5000) // Should respond within 5 seconds

      if (responseTime > 1000) {
        console.warn(`⚠️  Slow response detected: ${responseTime}ms`)
      }

      // Check if X-Health-Check-Duration header is present
      const durationHeader = response.headers.get('X-Health-Check-Duration')
      if (durationHeader) {
        console.log(`📊 Server-reported duration: ${durationHeader}`)
      }
    }, TEST_TIMEOUT)
  })
})