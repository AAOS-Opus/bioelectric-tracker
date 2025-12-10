import { connectDB, checkMongoHealth } from '@/lib/db'
import { NextResponse } from 'next/server'

/**
 * Legacy database test endpoint
 *
 * This endpoint is maintained for backward compatibility but will redirect
 * users to the new comprehensive health check endpoint at /api/health
 *
 * @deprecated Use /api/health for comprehensive MongoDB health monitoring
 */

// Force dynamic rendering to ensure real-time connection testing
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('Legacy database test endpoint called - consider using /api/health instead')

    // Use the enhanced connection function
    const mongoose = await connectDB()

    // Get comprehensive health status
    const healthStatus = await checkMongoHealth()

    // Try to get collections list as a concrete test
    const collections = await mongoose.connection.db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)

    // Return enhanced response with migration notice
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      notice: 'This endpoint is deprecated. Use /api/health for comprehensive health monitoring.',
      migration: {
        newEndpoint: '/api/health',
        benefits: [
          'Structured error logging',
          'Connection pool metrics',
          'Ping latency measurement',
          'Environment-aware access control',
          'Enhanced error reporting'
        ]
      },
      // Legacy format for compatibility
      state: healthStatus.mongoStatus,
      collections: collectionNames,
      // Enhanced information
      pingTimeMs: healthStatus.pingTimeMs,
      activeConnections: healthStatus.activeConnections,
      registeredModels: healthStatus.registeredModels
    })

  } catch (error) {
    console.error('Legacy database test failed:', error)

    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      notice: 'This endpoint is deprecated. Use /api/health for comprehensive health monitoring.',
      migration: {
        newEndpoint: '/api/health',
        benefits: [
          'Structured error logging',
          'Connection retry logic',
          'Better error diagnostics'
        ]
      },
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
