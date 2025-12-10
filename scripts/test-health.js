#!/usr/bin/env node

/**
 * Health Endpoint Development Test Script
 *
 * This script makes a real HTTP request to the health endpoint and displays
 * the results with colored output and clear PASS/FAIL status.
 *
 * Requirements:
 * - Development server must be running (npm run dev)
 * - Health endpoint must be accessible at http://localhost:3000/api/health
 *
 * Usage:
 *   node scripts/test-health.js
 *   npm run test:health
 */

const http = require('http')
const https = require('https')
const { URL } = require('url')

// Configuration
const HEALTH_URL = process.env.HEALTH_URL || 'http://localhost:3000/api/health'
const TIMEOUT = 10000 // 10 seconds
const MAX_RETRIES = 3

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
}

// Helper functions for colored output
const colorize = (text, color) => `${colors[color]}${text}${colors.reset}`
const bold = (text) => `${colors.bright}${text}${colors.reset}`
const success = (text) => colorize(text, 'green')
const errorText = (text) => colorize(text, 'red')
const warning = (text) => colorize(text, 'yellow')
const info = (text) => colorize(text, 'blue')
const highlight = (text) => colorize(text, 'cyan')

// Pretty print JSON with colors
function prettyPrintJson(obj, indent = 0) {
  const spaces = '  '.repeat(indent)

  if (obj === null) return colorize('null', 'gray')
  if (typeof obj === 'boolean') return colorize(obj.toString(), obj ? 'green' : 'red')
  if (typeof obj === 'number') return colorize(obj.toString(), 'cyan')
  if (typeof obj === 'string') return colorize(`"${obj}"`, 'yellow')

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'

    const items = obj.map(item => `${spaces}  ${prettyPrintJson(item, indent + 1)}`).join(',\n')
    return `[\n${items}\n${spaces}]`
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj)
    if (keys.length === 0) return '{}'

    const items = keys.map(key => {
      const coloredKey = colorize(`"${key}"`, 'magenta')
      const value = prettyPrintJson(obj[key], indent + 1)
      return `${spaces}  ${coloredKey}: ${value}`
    }).join(',\n')

    return `{\n${items}\n${spaces}}`
  }

  return obj.toString()
}

// Make HTTP request with timeout
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const client = parsedUrl.protocol === 'https:' ? https : http

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Health-Test-Script/1.0'
      },
      timeout: TIMEOUT
    }

    const req = client.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: data
        })
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error(`Request timeout after ${TIMEOUT}ms`))
    })

    req.end()
  })
}

// Validate health response structure
function validateHealthResponse(data) {
  const errors = []
  const warnings = []

  // Required fields
  const requiredFields = ['mongoStatus', 'pingTimeMs', 'activeConnections', 'registeredModels']
  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`)
    }
  }

  // Validate mongoStatus
  const validStatuses = ['connected', 'connecting', 'disconnected']
  if (data.mongoStatus && !validStatuses.includes(data.mongoStatus)) {
    errors.push(`Invalid mongoStatus: ${data.mongoStatus}. Must be one of: ${validStatuses.join(', ')}`)
  }

  // Validate pingTimeMs
  if (data.pingTimeMs !== null && (typeof data.pingTimeMs !== 'number' || data.pingTimeMs < 0)) {
    errors.push(`Invalid pingTimeMs: ${data.pingTimeMs}. Must be a non-negative number or null`)
  }

  // Check for slow ping
  if (data.pingTimeMs && data.pingTimeMs > 500) {
    warnings.push(`Slow ping time detected: ${data.pingTimeMs}ms`)
  }

  // Validate activeConnections
  if (typeof data.activeConnections !== 'number' || data.activeConnections < 0) {
    errors.push(`Invalid activeConnections: ${data.activeConnections}. Must be a non-negative number`)
  }

  // Validate registeredModels
  if (!Array.isArray(data.registeredModels)) {
    errors.push(`Invalid registeredModels: ${data.registeredModels}. Must be an array`)
  }

  // Check for high connection count
  if (data.activeConnections && data.activeConnections > 20) {
    warnings.push(`High connection count: ${data.activeConnections}`)
  }

  return { errors, warnings }
}

// Display test results
function displayResults(response, validationResult, duration) {
  console.log('\n' + bold('='.repeat(60)))
  console.log(bold('📊 HEALTH CHECK TEST RESULTS'))
  console.log(bold('='.repeat(60)))

  // HTTP Status
  console.log('\n' + bold('🌐 HTTP Response:'))
  const statusColor = response.statusCode === 200 ? 'green' :
                     response.statusCode >= 400 ? 'red' : 'yellow'
  console.log(`   Status: ${colorize(response.statusCode, statusColor)} ${response.statusMessage}`)
  console.log(`   Duration: ${highlight(duration + 'ms')}`)

  // Parse JSON response
  let data
  try {
    data = JSON.parse(response.body)
  } catch (error) {
    console.log('\n' + error('❌ FAILED: Invalid JSON response'))
    console.log('Response body:', response.body)
    return false
  }

  // Display response data
  console.log('\n' + bold('📋 Response Data:'))
  console.log(prettyPrintJson(data))

  // Validation results
  console.log('\n' + bold('🧪 Validation Results:'))

  if (validationResult.errors.length === 0) {
    console.log(success('✅ Structure validation: PASSED'))
  } else {
    console.log(errorText('❌ Structure validation: FAILED'))
    validationResult.errors.forEach(err => {
      console.log(errorText(`   • ${err}`))
    })
  }

  // Warnings
  if (validationResult.warnings.length > 0) {
    console.log('\n' + warning('⚠️  Warnings:'))
    validationResult.warnings.forEach(warn => {
      console.log(warning(`   • ${warn}`))
    })
  }

  // Health status interpretation
  console.log('\n' + bold('🏥 Health Status:'))
  if (data.mongoStatus === 'connected') {
    if (data.pingTimeMs && data.pingTimeMs < 500) {
      console.log(success('✅ MongoDB: HEALTHY (connected with good latency)'))
    } else {
      console.log(warning('⚠️  MongoDB: CONNECTED but slow ping'))
    }
  } else if (data.mongoStatus === 'connecting') {
    console.log(warning('🔄 MongoDB: CONNECTING'))
  } else {
    console.log(errorText('❌ MongoDB: DISCONNECTED'))
  }

  // Overall result
  const isPassed = validationResult.errors.length === 0 && response.statusCode < 400
  console.log('\n' + bold('🎯 OVERALL RESULT:'))
  if (isPassed) {
    console.log(success('🎉 PASSED - Health endpoint is working correctly!'))
  } else {
    console.log(errorText('💥 FAILED - Issues detected with health endpoint'))
  }

  console.log('\n' + bold('='.repeat(60)))

  return isPassed
}

// Main test function
async function runHealthTest(retryCount = 0) {
  console.log(bold('🚀 Health Endpoint Test Script'))
  console.log(bold('==============================='))
  console.log(`📍 Target URL: ${highlight(HEALTH_URL)}`)
  console.log(`⏰ Timeout: ${TIMEOUT / 1000}s`)

  if (retryCount > 0) {
    console.log(warning(`🔄 Retry attempt ${retryCount}/${MAX_RETRIES}`))
  }

  console.log('\n' + info('Making HTTP request...'))

  const startTime = Date.now()
  let response

  try {
    response = await makeRequest(HEALTH_URL)
    const duration = Date.now() - startTime

    // Parse and validate response
    let data
    try {
      data = JSON.parse(response.body)
    } catch (parseError) {
      console.log(errorText('\n❌ Failed to parse JSON response'))
      console.log('Raw response:', response.body)
      return false
    }

    const validationResult = validateHealthResponse(data)
    const passed = displayResults(response, validationResult, duration)

    return passed

  } catch (requestError) {
    console.log(errorText(`\n❌ Request failed: ${requestError.message}`))

    if (requestError.code === 'ECONNREFUSED') {
      console.log('\n' + warning('🔧 Troubleshooting Tips:'))
      console.log('   • Make sure the development server is running: npm run dev')
      console.log('   • Check if the server is listening on the correct port (3000)')
      console.log('   • Verify the health endpoint is properly configured')
    }

    // Retry logic
    if (retryCount < MAX_RETRIES) {
      console.log(info(`\n🔄 Retrying in 2 seconds... (${retryCount + 1}/${MAX_RETRIES})`))
      await new Promise(resolve => setTimeout(resolve, 2000))
      return runHealthTest(retryCount + 1)
    }

    console.log(errorText('\n💥 All retry attempts failed'))
    return false
  }
}

// Run the test
if (require.main === module) {
  runHealthTest()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(err => {
      console.error(errorText('\n💥 Unexpected error:'), err.message)
      process.exit(1)
    })
}

module.exports = { runHealthTest, validateHealthResponse }