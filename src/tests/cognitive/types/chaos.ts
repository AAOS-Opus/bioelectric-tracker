/**
 * Chaos Testing Types
 * 
 * This file defines types used in chaos testing.
 * 
 * @federation-compatible
 * @machine-readable
 * @version 1.0.0
 */

/**
 * Failure types that can be injected
 */
export const FAILURE_TYPES = {
  API_TIMEOUT: 'api-timeout',
  DATA_CORRUPTION: 'data-corruption',
  NETWORK_PARTITION: 'network-partition',
  MEMORY_PRESSURE: 'memory-pressure',
  CPU_PRESSURE: 'cpu-pressure',
  DISK_PRESSURE: 'disk-pressure',
  DEPENDENCY_FAILURE: 'dependency-failure',
  RATE_LIMITING: 'rate-limiting',
  PERMISSION_DENIED: 'permission-denied',
  INVALID_STATE: 'invalid-state'
};

/**
 * Recovery paths that can be tested
 */
export const RECOVERY_PATHS = {
  RETRY: 'retry',
  FALLBACK_DATA: 'fallback-data',
  GRACEFUL_DEGRADATION: 'graceful-degradation',
  CIRCUIT_BREAKER: 'circuit-breaker',
  TIMEOUT: 'timeout',
  CACHE: 'cache',
  ALTERNATIVE_PATH: 'alternative-path',
  MANUAL_INTERVENTION: 'manual-intervention'
};

/**
 * Resource profiles for tests
 */
export interface ResourceProfile {
  memory: string;
  cpu?: string;
  time: string;
  network?: string;
  disk?: string;
}

/**
 * Federation event types
 */
export type FederationEventType = 
  | 'circuit.change'
  | 'recovery.path'
  | 'dependency.update'
  | 'resource.threshold';

/**
 * Federation event payload
 */
export interface FederationEventPayload {
  component?: string;
  from?: string;
  to?: string;
  reason?: string;
  metrics?: Record<string, any>;
  dependencies?: Record<string, string[]>;
  resources?: ResourceProfile;
  [key: string]: any;
}

/**
 * Federation event
 */
export interface FederationEvent {
  type: FederationEventType;
  payload: FederationEventPayload;
  path?: string[];
  reasoning: string;
}

/**
 * Circuit breaker states
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF-OPEN';

/**
 * Chaos test error with structured metadata
 */
export interface ChaosTestErrorMetadata {
  component: string;
  failureType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  message?: string;
}

/**
 * Chaos test report
 */
export interface ChaosTestReport {
  testRunSummary: {
    totalTests: number;
    passedTests: number;
    skippedTests: number;
    failedTests: number;
    duration: number;
    timestamp: number;
  };
  failureMap: Record<string, {
    component: string;
    failureType: string;
    severity: string;
    reasoning: string;
    recoveryState: string;
  }>;
  dependencyGraph: Record<string, string[]>;
  federationSignals: FederationEvent[];
  resourceUtilization: {
    memory: number;
    cpu: number;
    time: number;
  };
}