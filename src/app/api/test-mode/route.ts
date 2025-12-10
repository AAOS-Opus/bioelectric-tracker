import { NextResponse } from 'next/server'
import { isTestMode, testModeInfo } from '@/lib/test-mode'

/**
 * Test API route to verify TEST_MODE functionality on server-side
 */
export async function GET() {
  try {
    const testModeStatus = {
      isTestMode: isTestMode(),
      status: testModeInfo.status,
      envValue: testModeInfo.envValue,
      timestamp: new Date().toISOString(),
      runtime: 'server-side'
    }

    return NextResponse.json({
      success: true,
      testMode: testModeStatus,
      message: isTestMode() 
        ? 'TEST_MODE is enabled - MongoDB will be bypassed' 
        : 'TEST_MODE is disabled - MongoDB connections will be used'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check TEST_MODE status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}