#!/usr/bin/env node

/**
 * MongoDB Health Check Test Script
 *
 * This script demonstrates the MongoDB health monitoring system
 * and can be used for testing and debugging connection issues.
 *
 * Usage:
 *   node scripts/test-mongodb-health.js [options]
 *
 * Options:
 *   --uri <uri>       MongoDB connection URI
 *   --timeout <ms>    Connection timeout in milliseconds
 *   --verbose         Enable verbose logging
 *   --continuous      Run continuous health checks
 *   --interval <ms>   Interval for continuous checks (default: 5000)
 */

const { connectDB, checkMongoHealth, disconnectDB } = require('../src/lib/db')

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
  uri: null,
  timeout: 10000,
  verbose: false,
  continuous: false,
  interval: 5000
}

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--uri':
      options.uri = args[++i]
      break
    case '--timeout':
      options.timeout = parseInt(args[++i])
      break
    case '--verbose':
      options.verbose = true
      break
    case '--continuous':
      options.continuous = true
      break
    case '--interval':
      options.interval = parseInt(args[++i])
      break
    case '--help':
      console.log(`
MongoDB Health Check Test Script

Usage: node scripts/test-mongodb-health.js [options]

Options:
  --uri <uri>       MongoDB connection URI
  --timeout <ms>    Connection timeout in milliseconds
  --verbose         Enable verbose logging
  --continuous      Run continuous health checks
  --interval <ms>   Interval for continuous checks (default: 5000)
  --help           Show this help message

Examples:
  node scripts/test-mongodb-health.js
  node scripts/test-mongodb-health.js --uri mongodb://localhost:27017/test
  node scripts/test-mongodb-health.js --continuous --interval 3000
  node scripts/test-mongodb-health.js --verbose
`)
      process.exit(0)
    default:
      console.error(`Unknown option: ${args[i]}`)
      process.exit(1)
  }
}

// Set MongoDB URI if provided
if (options.uri) {
  process.env.MONGODB_URI = options.uri
}

/**
 * Formats health status for display
 */
function formatHealthStatus(health) {
  const status = {
    '🔗 MongoDB Status': health.mongoStatus,
    '⚡ Ping Time': health.pingTimeMs ? `${health.pingTimeMs}ms` : 'N/A',
    '🔌 Active Connections': health.activeConnections,
    '📦 Registered Models': health.registeredModels.length,
    '🔄 Connection Attempts': health.connectionAttempts || 0
  }

  if (health.registeredModels.length > 0) {
    status['📋 Models'] = health.registeredModels.join(', ')
  }

  if (health.lastError) {
    status['❌ Last Error'] = health.lastError
  }

  return status
}

/**
 * Runs a single health check
 */
async function runHealthCheck() {
  const startTime = Date.now()

  try {
    console.log('\n🔍 Running MongoDB health check...')

    // Perform health check
    const health = await checkMongoHealth()
    const checkDuration = Date.now() - startTime

    // Display results
    console.log('\n📊 Health Check Results:')
    console.table(formatHealthStatus(health))

    console.log(`\n⏱️  Check completed in ${checkDuration}ms`)

    // Determine overall health
    const isHealthy = health.mongoStatus === 'connected' &&
                     health.pingTimeMs !== null &&
                     health.pingTimeMs < 500

    console.log(`\n${isHealthy ? '✅' : '❌'} Overall Status: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`)

    if (options.verbose) {
      console.log('\n🔍 Detailed Information:')
      console.log(JSON.stringify(health, null, 2))
    }

    return isHealthy

  } catch (error) {
    console.error('\n❌ Health check failed:', error.message)

    if (options.verbose) {
      console.error('Stack trace:', error.stack)
    }

    return false
  }
}

/**
 * Tests the connection establishment
 */
async function testConnection() {
  const startTime = Date.now()

  try {
    console.log('\n🔌 Testing MongoDB connection...')

    const mongoose = await connectDB()
    const connectionTime = Date.now() - startTime

    console.log(`✅ Connection established in ${connectionTime}ms`)
    console.log(`📊 Connection state: ${mongoose.connection.readyState}`)
    console.log(`🏷️  Database name: ${mongoose.connection.name}`)
    console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`)

    if (options.verbose) {
      console.log('🔍 Connection details:')
      console.log({
        readyState: mongoose.connection.readyState,
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        models: Object.keys(mongoose.models)
      })
    }

    return true

  } catch (error) {
    const connectionTime = Date.now() - startTime
    console.error(`❌ Connection failed after ${connectionTime}ms:`, error.message)

    if (options.verbose) {
      console.error('Stack trace:', error.stack)
    }

    return false
  }
}

/**
 * Runs continuous health monitoring
 */
async function runContinuousMonitoring() {
  console.log(`\n🔄 Starting continuous monitoring (interval: ${options.interval}ms)`)
  console.log('Press Ctrl+C to stop\n')

  let checkCount = 0
  let healthyCount = 0

  const interval = setInterval(async () => {
    checkCount++
    const timestamp = new Date().toISOString()

    console.log(`\n📅 Check #${checkCount} at ${timestamp}`)

    const isHealthy = await runHealthCheck()
    if (isHealthy) healthyCount++

    const healthPercentage = ((healthyCount / checkCount) * 100).toFixed(1)
    console.log(`📈 Health rate: ${healthyCount}/${checkCount} (${healthPercentage}%)`)

  }, options.interval)

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Stopping continuous monitoring...')
    clearInterval(interval)

    console.log(`\n📊 Final Statistics:`)
    console.log(`   Total checks: ${checkCount}`)
    console.log(`   Healthy checks: ${healthyCount}`)
    console.log(`   Health rate: ${((healthyCount / checkCount) * 100).toFixed(1)}%`)

    await cleanup()
    process.exit(0)
  })
}

/**
 * Cleanup function
 */
async function cleanup() {
  try {
    console.log('\n🧹 Cleaning up connections...')
    await disconnectDB()
    console.log('✅ Cleanup completed')
  } catch (error) {
    console.error('❌ Cleanup error:', error.message)
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 MongoDB Health Check Test Script')
  console.log('===================================')

  if (options.uri) {
    console.log(`🔗 Using custom URI: ${options.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`)
  } else {
    console.log('🔗 Using default MongoDB URI from environment')
  }

  try {
    // Test initial connection
    const connectionSuccess = await testConnection()

    if (!connectionSuccess) {
      console.log('\n⚠️  Connection failed, but continuing with health checks...')
    }

    if (options.continuous) {
      await runContinuousMonitoring()
    } else {
      // Run single health check
      const healthSuccess = await runHealthCheck()

      // Exit with appropriate code
      process.exit(healthSuccess ? 0 : 1)
    }

  } catch (error) {
    console.error('\n💥 Unexpected error:', error.message)

    if (options.verbose) {
      console.error('Stack trace:', error.stack)
    }

    process.exit(1)

  } finally {
    if (!options.continuous) {
      await cleanup()
    }
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Run the script
main().catch(async (error) => {
  console.error('💥 Script execution failed:', error.message)
  await cleanup()
  process.exit(1)
})