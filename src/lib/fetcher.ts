/**
 * Enhanced SWR Fetcher Utility
 *
 * Provides a reusable fetcher function for SWR data fetching
 * with enhanced error handling, retry logic, circuit breaker pattern,
 * TEST_MODE support, and graceful degradation.
 */

import { isTestMode } from '@/lib/test-mode';

export interface FetchError extends Error {
  status?: number;
  info?: any;
  isRetryable?: boolean;
  attempt?: number;
  isNetworkError?: boolean;
}

// Circuit breaker state management
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  isOpen: boolean;
}

const circuitBreakers = new Map<string, CircuitBreakerState>();
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

/**
 * Determines if an error should trigger a retry
 */
const isRetryableError = (error: FetchError): boolean => {
  // Don't retry client errors (4xx), except for 408 (timeout) and 429 (rate limit)
  if (error.status && error.status >= 400 && error.status < 500) {
    return error.status === 408 || error.status === 429;
  }
  
  // Retry network errors and server errors (5xx)
  return Boolean(error.isNetworkError || (error.status && error.status >= 500));
};

/**
 * Creates a delay for exponential backoff
 */
const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Gets exponential backoff delay for retry attempt
 */
const getRetryDelay = (attempt: number): number => {
  const delays = [500, 1000, 2000]; // Exactly as specified
  return delays[attempt - 1] || 2000;
};

/**
 * Checks and updates circuit breaker state
 */
const checkCircuitBreaker = (url: string): boolean => {
  const state = circuitBreakers.get(url);
  if (!state) return false;

  if (state.isOpen) {
    const now = Date.now();
    if (now - state.lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
      // Reset circuit breaker
      state.isOpen = false;
      state.failures = 0;
      if (isTestMode()) {
        console.log(`[TEST_MODE] Circuit breaker reset for ${url}`);
      }
      return false;
    }
    return true;
  }

  return false;
};

/**
 * Updates circuit breaker on failure
 */
const updateCircuitBreakerOnFailure = (url: string): void => {
  const state = circuitBreakers.get(url) || { failures: 0, lastFailureTime: 0, isOpen: false };
  state.failures++;
  state.lastFailureTime = Date.now();

  if (state.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    state.isOpen = true;
    if (isTestMode()) {
      console.log(`[TEST_MODE] Circuit breaker opened for ${url} after ${state.failures} failures`);
    }
  }

  circuitBreakers.set(url, state);
};

/**
 * Resets circuit breaker on success
 */
const resetCircuitBreaker = (url: string): void => {
  const state = circuitBreakers.get(url);
  if (state && state.failures > 0) {
    state.failures = 0;
    state.isOpen = false;
    circuitBreakers.set(url, state);
  }
};

/**
 * Enhanced fetch with retry logic and error handling
 */
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> => {
  // Check circuit breaker
  if (checkCircuitBreaker(url)) {
    const error = new Error('Circuit breaker is open') as FetchError;
    error.status = 503;
    error.isRetryable = false;
    throw error;
  }

  if (isTestMode()) {
    console.log(`[TEST_MODE] Fetcher is operating in fallback mode for ${url}`);
  }

  let lastError: FetchError | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Success - reset circuit breaker
      resetCircuitBreaker(url);
      
      return response;
    } catch (error) {
      const fetchError = error as FetchError;
      fetchError.isNetworkError = true;
      fetchError.attempt = attempt;
      fetchError.isRetryable = isRetryableError(fetchError);
      
      lastError = fetchError;

      if (isTestMode()) {
        console.log(`[TEST_MODE] Retry attempt ${attempt}/${maxRetries} failed for ${url}:`, error);
      }

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === maxRetries || !fetchError.isRetryable) {
        break;
      }

      // Wait before retrying with exponential backoff
      const retryDelay = getRetryDelay(attempt);
      if (isTestMode()) {
        console.log(`[TEST_MODE] Waiting ${retryDelay}ms before retry ${attempt + 1}`);
      }
      await delay(retryDelay);
    }
  }

  // All retries failed - update circuit breaker
  updateCircuitBreakerOnFailure(url);
  
  if (!lastError) {
    lastError = new Error('Unknown error occurred during fetch') as FetchError;
    lastError.status = 500;
    lastError.isRetryable = false;
  }
  
  throw lastError;
};

/**
 * Enhanced error processing with better categorization
 */
const processError = async (response: Response, attempt?: number): Promise<FetchError> => {
  const error = new Error(`HTTP Error: ${response.status}`) as FetchError;
  error.status = response.status;
  error.attempt = attempt;
  error.isRetryable = isRetryableError(error);

  // Categorize error types
  if (response.status >= 400 && response.status < 500) {
    error.isNetworkError = false;
    if (response.status === 401) {
      error.message = 'Authentication required - please log in';
    } else if (response.status === 403) {
      error.message = 'Access forbidden - insufficient permissions';
    } else if (response.status === 404) {
      error.message = 'Resource not found';
    } else if (response.status === 408) {
      error.message = 'Request timeout - please try again';
    } else if (response.status === 429) {
      error.message = 'Rate limit exceeded - please wait before retrying';
    } else {
      error.message = `Client error: ${response.status}`;
    }
  } else if (response.status >= 500) {
    error.isNetworkError = false;
    error.message = `Server error: ${response.status} - please try again later`;
  }

  try {
    error.info = await response.json();
  } catch {
    error.info = { message: response.statusText };
  }

  return error;
};

/**
 * Enhanced default fetcher function for SWR
 * Handles authentication, retry logic, circuit breaker, and error responses
 */
export const fetcher = async (url: string): Promise<any> => {
  try {
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
    });

    // Handle non-200 responses
    if (!response.ok) {
      const error = await processError(response);
      throw error;
    }

    return response.json();
  } catch (error) {
    const fetchError = error as FetchError;
    
    if (isTestMode()) {
      console.log(`[TEST_MODE] Fetcher error for ${url}:`, {
        message: fetchError.message,
        status: fetchError.status,
        attempt: fetchError.attempt,
        isRetryable: fetchError.isRetryable,
        isNetworkError: fetchError.isNetworkError
      });
    }

    // Return error object instead of throwing to prevent infinite re-renders
    return {
      error: true,
      message: fetchError.message || 'An unexpected error occurred',
      status: fetchError.status,
      details: fetchError.info,
      isRetryable: fetchError.isRetryable,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Enhanced POST fetcher for mutations
 */
export const postFetcher = async (url: string, data?: any): Promise<any> => {
  try {
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await processError(response);
      throw error;
    }

    return response.json();
  } catch (error) {
    const fetchError = error as FetchError;
    
    if (isTestMode()) {
      console.log(`[TEST_MODE] POST fetcher error for ${url}:`, {
        message: fetchError.message,
        status: fetchError.status,
        attempt: fetchError.attempt,
        isRetryable: fetchError.isRetryable,
        isNetworkError: fetchError.isNetworkError
      });
    }

    // Return error object instead of throwing to prevent infinite re-renders
    return {
      error: true,
      message: fetchError.message || 'An unexpected error occurred',
      status: fetchError.status,
      details: fetchError.info,
      isRetryable: fetchError.isRetryable,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Enhanced SWR configuration with better error handling
 */
export const swrConfig = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  errorRetryCount: 0, // We handle retries in the fetcher
  errorRetryInterval: 0,
  dedupingInterval: 2000,
  focusThrottleInterval: 5000,
  shouldRetryOnError: false, // Prevent SWR from retrying since we handle it
  onError: (error: any) => {
    // Only log actual errors, not our graceful error objects
    if (error && !error.error) {
      console.error('SWR Error:', error);
    }
  }
};

/**
 * Enhanced error handler for SWR hooks
 * Now handles graceful error objects returned by our fetchers
 */
export const handleSWRError = (error: any) => {
  // Handle our graceful error objects
  if (error && error.error === true) {
    if (isTestMode()) {
      console.log('[TEST_MODE] Handling graceful error:', error.message);
    }
    return error;
  }

  // Handle actual thrown errors
  const fetchError = error as FetchError;
  console.error('SWR Error:', fetchError);

  // Handle specific error cases
  if (fetchError.status === 401) {
    console.warn('Unauthorized request - user may need to re-authenticate');
  } else if (fetchError.status === 403) {
    console.warn('Forbidden request - insufficient permissions');
  } else if (fetchError.status && fetchError.status >= 500) {
    console.error('Server error - retry may help');
  }

  return fetchError;
};

/**
 * Utility to check if SWR data contains an error
 */
export const isErrorResponse = (data: any): boolean => {
  return data && data.error === true;
};

/**
 * Utility to extract error message from SWR data
 */
export const getErrorMessage = (data: any): string => {
  if (isErrorResponse(data)) {
    return data.message || 'An error occurred';
  }
  return '';
};

/**
 * Circuit breaker status utility for debugging
 */
export const getCircuitBreakerStatus = (url: string) => {
  const state = circuitBreakers.get(url);
  return {
    url,
    failures: state?.failures || 0,
    isOpen: state?.isOpen || false,
    lastFailureTime: state?.lastFailureTime || 0
  };
};