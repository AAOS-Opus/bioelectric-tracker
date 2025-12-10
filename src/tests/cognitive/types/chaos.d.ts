/**
 * Chaos Testing Type Declarations
 * 
 * This file provides TypeScript declarations for chaos testing.
 * 
 * @federation-compatible
 * @machine-readable
 * @version 1.0.0
 */

declare namespace ChaosTest {
  /**
   * Chaos test configuration
   */
  interface Config {
    failureRate: number;
    maxConcurrentFailures?: number;
    modules?: string[];
    severityLevels?: Record<string, number>;
    targetComponent?: string;
    failureTypes?: string[];
    recoveryPaths?: string[];
    journal?: boolean;
  }

  /**
   * Active failure information
   */
  interface ActiveFailure {
    id: string;
    type: string;
    component: string;
    severity: number;
    startTime: number;
    duration: number;
    timeoutId: NodeJS.Timeout;
  }

  /**
   * Federation event
   */
  interface FederationEvent {
    type: 'circuit.change' | 'recovery.path' | 'dependency.update' | 'resource.threshold';
    payload: any;
    path?: string[];
    reasoning: string;
  }

  /**
   * Circuit state
   */
  type CircuitState = 'CLOSED' | 'OPEN' | 'HALF-OPEN';

  /**
   * Resource profile
   */
  interface ResourceProfile {
    memory: string;
    cpu?: string;
    time: string;
    network?: string;
    disk?: string;
  }

  /**
   * Test report
   */
  interface Report {
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
      linkedDependencies?: string[];
      impact?: string;
    }>;
    dependencyGraph: Record<string, string[]>;
    federationSignals: FederationEvent[];
    resourceUtilization: {
      memory: number;
      cpu: number;
      time: number;
    };
  }

  /**
   * Test metadata
   */
  interface TestMetadata {
    category: string;
    resourceProfile: ResourceProfile;
    targets: string[];
    skipReason?: string;
    skipCi?: boolean;
  }
}

/**
 * Global declarations
 */
declare global {
  /**
   * Global event emitter
   */
  var eventEmitter: NodeJS.EventEmitter;

  /**
   * Global garbage collector
   */
  var gc: () => void;

  /**
   * Chaos test metadata
   */
  interface ChaosTestMetadata {
    '@chaos': string;
    '@resource-profile': ChaosTest.ResourceProfile;
    '@targets': string[];
    '@skip-reason'?: string;
    '@chaos-skip-ci'?: boolean;
  }
}

export = ChaosTest;
export as namespace ChaosTest;