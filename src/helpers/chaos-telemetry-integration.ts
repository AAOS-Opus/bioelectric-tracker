/**
 * Chaos Telemetry Integration Module
 * 
 * This module provides functionality to collect and analyze telemetry data
 * during chaos testing.
 * 
 * @federation-compatible
 * @machine-readable
 * @version 1.0.0
 */

/**
 * Types of chaos signals that can be collected
 */
export enum ChaosSignalType {
  API_FAILURE = 'api_failure',
  NETWORK_PARTITION = 'network_partition',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  LATENCY_INJECTION = 'latency_injection',
  DATA_CORRUPTION = 'data_corruption',
  COMPONENT_FAILURE = 'component_failure',
  RECOVERY_INITIATED = 'recovery_initiated',
  RECOVERY_COMPLETED = 'recovery_completed'
}

/**
 * Interface for chaos signal data
 */
export interface ChaosSignal {
  /** Type of chaos signal */
  type: ChaosSignalType;
  
  /** Component or service affected */
  target: string;
  
  /** Timestamp when the signal was generated */
  timestamp: number;
  
  /** Duration of the chaos event in milliseconds */
  duration?: number;
  
  /** Severity of the chaos event (0-1) */
  severity?: number;
  
  /** Additional metadata about the signal */
  metadata?: Record<string, any>;
}

/**
 * Interface for telemetry metrics
 */
export interface TelemetryMetrics {
  /** Error rate (0-1) */
  errorRate: number;
  
  /** Average response time in milliseconds */
  avgResponseTime: number;
  
  /** 95th percentile response time in milliseconds */
  p95ResponseTime: number;
  
  /** CPU utilization (0-1) */
  cpuUtilization: number;
  
  /** Memory utilization (0-1) */
  memoryUtilization: number;
  
  /** Network throughput in bytes/second */
  networkThroughput: number;
  
  /** Number of active connections */
  activeConnections: number;
  
  /** Custom metrics */
  custom: Record<string, number>;
}

/**
 * Interface for telemetry record
 */
export interface TelemetryRecord {
  /** ID of the record */
  id: string;
  
  /** Component or service that generated the record */
  component: string;
  
  /** Timestamp when the record was created */
  timestamp: number;
  
  /** Metrics collected */
  metrics: TelemetryMetrics;
  
  /** Associated chaos signals */
  signals: ChaosSignal[];
  
  /** Tags for categorization */
  tags: string[];
}

/**
 * Chaos Telemetry class
 */
export class ChaosTelemetry {
  private component: string;
  private records: TelemetryRecord[] = [];
  private isCollecting: boolean = false;
  private startTime: number = 0;

  /**
   * Create a new Chaos Telemetry instance
   * @param component The component to monitor
   */
  constructor(component: string) {
    this.component = component;
  }

  /**
   * Start collecting telemetry data
   */
  public startCollection(): void {
    this.isCollecting = true;
    this.startTime = Date.now();
    this.records = [];
    console.log(`[Telemetry] Started collection for component: ${this.component}`);
  }

  /**
   * End telemetry data collection
   */
  public endCollection(): void {
    this.isCollecting = false;
    console.log(`[Telemetry] Ended collection for component: ${this.component}`);
    console.log(`[Telemetry] Collected ${this.records.length} records over ${Date.now() - this.startTime}ms`);
  }

  /**
   * Capture baseline metrics
   * @returns The baseline metrics
   */
  public captureBaseline(): TelemetryMetrics {
    const baseline: TelemetryMetrics = {
      errorRate: 0,
      avgResponseTime: 100,
      p95ResponseTime: 200,
      cpuUtilization: 0.2,
      memoryUtilization: 0.3,
      networkThroughput: 1024 * 1024, // 1 MB/s
      activeConnections: 10,
      custom: {}
    };
    
    return baseline;
  }

  /**
   * Capture current metrics
   * @returns The current metrics
   */
  public captureMetrics(): TelemetryMetrics {
    // Placeholder implementation
    // In a real implementation, this would collect actual metrics
    
    const metrics: TelemetryMetrics = {
      errorRate: 0.05,
      avgResponseTime: 150,
      p95ResponseTime: 300,
      cpuUtilization: 0.4,
      memoryUtilization: 0.5,
      networkThroughput: 512 * 1024, // 512 KB/s
      activeConnections: 8,
      custom: {
        'cache.hitRate': 0.8,
        'queue.depth': 5
      }
    };
    
    return metrics;
  }

  /**
   * Record a chaos signal
   * @param signal The chaos signal to record
   */
  public recordSignal(signal: ChaosSignal): void {
    if (!this.isCollecting) {
      console.warn('[Telemetry] Attempted to record signal while not collecting');
      return;
    }
    
    const metrics = this.captureMetrics();
    
    const record: TelemetryRecord = {
      id: `${this.component}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      component: this.component,
      timestamp: Date.now(),
      metrics,
      signals: [signal],
      tags: [signal.type, this.component, 'chaos-test']
    };
    
    this.records.push(record);
  }

  /**
   * Get all collected telemetry records
   * @returns Array of telemetry records
   */
  public getRecords(): TelemetryRecord[] {
    return [...this.records];
  }
}

/**
 * Collect telemetry data for a chaos event
 * @param event The chaos signal to collect telemetry for
 * @returns Array of telemetry records
 */
export function collectTelemetry(event: ChaosSignal): TelemetryRecord[] {
  const telemetry = new ChaosTelemetry(event.target);
  telemetry.startCollection();
  telemetry.recordSignal(event);
  const records = telemetry.getRecords();
  telemetry.endCollection();
  return records;
}

/**
 * Singleton instance for global access
 */
export const telemetryIntegration = {
  /**
   * Connect to a component for telemetry collection
   * @param component The component to monitor
   * @returns A ChaosTelemetry instance
   */
  connect(component: string): ChaosTelemetry {
    return new ChaosTelemetry(component);
  }
};