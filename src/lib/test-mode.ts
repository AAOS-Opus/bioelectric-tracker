/**
 * TEST_MODE utility for graceful MongoDB degradation
 * 
 * This module provides a centralized way to check if the application
 * is running in TEST_MODE, which bypasses MongoDB connections and
 * uses mock data instead.
 */

/**
 * Checks if the application is running in TEST_MODE
 * 
 * TEST_MODE is enabled when NEXT_PUBLIC_TEST_MODE environment variable
 * is set to 'true'. This flag is accessible on both server-side and
 * client-side components.
 * 
 * @returns {boolean} True if TEST_MODE is enabled, false otherwise
 */
export function isTestMode(): boolean {
  return process.env.NEXT_PUBLIC_TEST_MODE === 'true'
}

/**
 * Gets the current TEST_MODE status as a string for logging
 * 
 * @returns {string} 'enabled' or 'disabled'
 */
export function getTestModeStatus(): string {
  return isTestMode() ? 'enabled' : 'disabled'
}

/**
 * Conditional execution helper for TEST_MODE
 * 
 * Executes different functions based on TEST_MODE status.
 * Useful for switching between real and mock implementations.
 * 
 * @param testModeCallback - Function to execute when TEST_MODE is enabled
 * @param normalCallback - Function to execute when TEST_MODE is disabled
 * @returns The result of the executed callback
 */
export function withTestMode<T>(
  testModeCallback: () => T,
  normalCallback: () => T
): T {
  return isTestMode() ? testModeCallback() : normalCallback()
}

/**
 * Async version of withTestMode for Promise-based operations
 * 
 * @param testModeCallback - Async function to execute when TEST_MODE is enabled
 * @param normalCallback - Async function to execute when TEST_MODE is disabled
 * @returns Promise resolving to the result of the executed callback
 */
export async function withTestModeAsync<T>(
  testModeCallback: () => Promise<T>,
  normalCallback: () => Promise<T>
): Promise<T> {
  return isTestMode() ? await testModeCallback() : await normalCallback()
}

/**
 * Environment information for debugging
 */
export const testModeInfo = {
  get isEnabled() {
    return isTestMode()
  },
  get envValue() {
    return process.env.NEXT_PUBLIC_TEST_MODE
  },
  get status() {
    return getTestModeStatus()
  }
} as const