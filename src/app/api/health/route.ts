import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

type MongoHealthStatus = {
  mongoStatus: 'connected' | 'connecting' | 'disconnected'
  pingTimeMs: number | null
  activeConnections: number
  registeredModels: string[]
  lastError?: string
  connectionAttempts?: number
}

async function checkMongoHealth(): Promise<MongoHealthStatus> {
  const startPing = Date.now()

  try {
    if (mongoose.connection.readyState !== 1) {
      return {
        mongoStatus: 'disconnected',
        pingTimeMs: null,
        activeConnections: 0,
        registeredModels: []
      }
    }

    await mongoose.connection.db?.admin().ping()
    const pingTime = Date.now() - startPing

    return {
      mongoStatus: 'connected',
      pingTimeMs: pingTime,
      activeConnections: mongoose.connections.length,
      registeredModels: Object.keys(mongoose.models)
    }
  } catch (error) {
    return {
      mongoStatus: 'disconnected',
      pingTimeMs: null,
      activeConnections: 0,
      registeredModels: [],
      lastError: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * MongoDB Health Check API Route
 *
 * Provides comprehensive health monitoring for MongoDB connections with
 * environment-aware security controls and structured response format.
 *
 * Features:
 * - Real-time connection status monitoring
 * - Ping latency measurement with timeout protection
 * - Active connection pool metrics
 * - Registered Mongoose model inventory
 * - Error tracking and diagnostics
 * - Environment-based access control
 *
 * Security:
 * - Disabled by default in production environments
 * - Requires ENABLE_HEALTH_ENDPOINT=true in production
 * - Sanitized output with no sensitive information exposure
 * - Request rate limiting considerations (implement externally)
 *
 * Response Format:
 * HTTP 200: Database connected and responsive (ping < 500ms)
 * HTTP 503: Database disconnected or ping exceeds threshold
 * HTTP 404: Health endpoint disabled (production without explicit enable)
 */

// Force dynamic rendering for real-time health status
export const dynamic = 'force-dynamic'

/**
 * Enhanced health check response interface with metadata
 */
interface HealthCheckResponse extends MongoHealthStatus {
  timestamp: string
  environment: string
  uptime: number
  version: string
}

/**
 * Environment configuration for health endpoint access control
 */
const NODE_ENV = process.env.NODE_ENV || 'development'
const ENABLE_HEALTH_ENDPOINT = process.env.ENABLE_HEALTH_ENDPOINT === 'true'
const PING_THRESHOLD_MS = 500
const HEALTH_CHECK_TIMEOUT = 8000 // 8 seconds timeout for entire health check

/**
 * GET /api/health
 *
 * Performs comprehensive MongoDB health check and returns structured status information.
 * Access is environment-aware with production safety controls.
 *
 * @param request - Next.js request object (unused but required for API route)
 * @returns NextResponse with health status and appropriate HTTP status code
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    // Environment-based access control
    if (NODE_ENV === 'production' && !ENABLE_HEALTH_ENDPOINT) {
      return NextResponse.json(
        {
          error: 'Health endpoint not available',
          message: 'Health monitoring is disabled in production. Set ENABLE_HEALTH_ENDPOINT=true to enable.'
        },
        { status: 404 }
      )
    }

    // Fast-fail check: if MongoDB is not connected, return immediately
    if (mongoose.connection.readyState !== 1) {
      const response = {
        mongoStatus: 'disconnected' as const,
        timestamp: new Date().toISOString()
      }

      return NextResponse.json(response, {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Check-Duration': `${Date.now() - startTime}ms`,
          'X-Environment': NODE_ENV
        }
      })
    }

    // Perform full health check with timeout protection (only when connected)
    const healthStatus = await Promise.race([
      checkMongoHealth(),
      new Promise<MongoHealthStatus>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), HEALTH_CHECK_TIMEOUT)
      )
    ])

    // Calculate total processing time
    const totalTime = Date.now() - startTime

    // Get memory usage
    const memoryUsage = process.memoryUsage();

    // Construct comprehensive response
    const response: HealthCheckResponse = {
      ...healthStatus,
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    }

    // Add memory info for development
    if (NODE_ENV === 'development') {
      (response as any).memory = {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      };
    }

    // Determine HTTP status based on health criteria
    const isHealthy =
      healthStatus.mongoStatus === 'connected' &&
      healthStatus.pingTimeMs !== null &&
      healthStatus.pingTimeMs < PING_THRESHOLD_MS

    const httpStatus = isHealthy ? 200 : 503

    // Add response headers for monitoring tools
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Health-Check-Duration': `${totalTime}ms`,
      'X-Environment': NODE_ENV
    }

    // Log health check for monitoring (development only for detailed logs)
    if (NODE_ENV === 'development') {
      console.log('Health Check Result:', {
        status: httpStatus,
        mongoStatus: healthStatus.mongoStatus,
        pingTime: healthStatus.pingTimeMs,
        activeConnections: healthStatus.activeConnections,
        processingTime: totalTime
      })
    } else {
      // Production logging (minimal, structured)
      console.log(JSON.stringify({
        event: 'health_check',
        status: httpStatus,
        mongoStatus: healthStatus.mongoStatus,
        pingMs: healthStatus.pingTimeMs,
        timestamp: response.timestamp
      }))
    }

    return NextResponse.json(response, { status: httpStatus, headers })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown health check error'
    const totalTime = Date.now() - startTime

    // Log health check error
    console.error('Health Check Error:', {
      error: errorMessage,
      processingTime: totalTime,
      timestamp: new Date().toISOString()
    })

    // Return error response with 503 status
    const errorResponse: HealthCheckResponse = {
      mongoStatus: 'disconnected',
      pingTimeMs: null,
      activeConnections: 0,
      registeredModels: [],
      lastError: errorMessage,
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    }

    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Duration': `${totalTime}ms`,
        'X-Environment': NODE_ENV
      }
    })
  }
}

/**
 * HEAD /api/health
 *
 * Lightweight health check that returns only HTTP status without response body.
 * Useful for load balancers and monitoring systems that only need status codes.
 *
 * @param request - Next.js request object
 * @returns NextResponse with empty body and appropriate status code
 */
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    // Environment access control (same as GET)
    if (NODE_ENV === 'production' && !ENABLE_HEALTH_ENDPOINT) {
      return new NextResponse(null, { status: 404 })
    }

    // Quick health check (reduced timeout for HEAD requests)
    const healthStatus = await Promise.race([
      checkMongoHealth(),
      new Promise<MongoHealthStatus>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), 3000)
      )
    ])

    // Determine status based on health criteria
    const isHealthy =
      healthStatus.mongoStatus === 'connected' &&
      healthStatus.pingTimeMs !== null &&
      healthStatus.pingTimeMs < PING_THRESHOLD_MS

    const httpStatus = isHealthy ? 200 : 503

    return new NextResponse(null, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Environment': NODE_ENV
      }
    })

  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}

/**
 * OPTIONS /api/health
 *
 * CORS preflight support for health check endpoint.
 * Returns allowed methods and headers for cross-origin requests.
 *
 * @param request - Next.js request object
 * @returns NextResponse with CORS headers
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  })
}