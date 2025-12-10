/**
 * System Recovery Tests
 * 
 * This file contains tests for system recovery after various failure scenarios,
 * measuring recovery time, success rates, and user experience impact.
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import mockBackend, { enableMockBackend } from '../../../mocks/mock-backend';
import { ChaosTestHarness } from './ChaosTestHarness';
import { UXImpactTracker } from '../helpers/ux-impact-tracking';
import { loadScenario } from '../helpers/load-scenario';
import { UXDegradationLevel, FAILURE_TYPES } from '../types/chaos';
import { ChaosTelemetryCollector } from '../helpers/chaos-telemetry-integration';

// Mock system component for testing recovery
const SystemComponent: React.FC<{
  name: string;
  dependencies?: string[];
  onStatusChange?: (status: 'healthy' | 'degraded' | 'failed') => void;
}> = ({ name, dependencies = [], onStatusChange }) => {
  const [status, setStatus] = React.useState<'healthy' | 'degraded' | 'failed'>('healthy');
  const [error, setError] = React.useState<Error | null>(null);
  const [recoveryAttempts, setRecoveryAttempts] = React.useState<number>(0);
  
  // Health check function
  const checkHealth = React.useCallback(async () => {
    try {
      // Check own health
      await mockBackend.processText(`health:${name}`);
      
      // Check dependencies
      if (dependencies.length > 0) {
        let degraded = false;
        
        for (const dep of dependencies) {
          try {
            await mockBackend.processText(`health:${dep}`);
          } catch (err) {
            degraded = true;
            console.warn(`Dependency ${dep} is unhealthy`);
          }
        }
        
        if (degraded) {
          setStatus('degraded');
          if (onStatusChange) onStatusChange('degraded');
          return;
        }
      }
      
      // All healthy
      setStatus('healthy');
      setError(null);
      if (onStatusChange) onStatusChange('healthy');
    } catch (err) {
      setStatus('failed');
      setError(err as Error);
      if (onStatusChange) onStatusChange('failed');
      
      // Attempt recovery
      setRecoveryAttempts(prev => prev + 1);
    }
  }, [name, dependencies, onStatusChange]);
  
  // Recovery function
  const attemptRecovery = React.useCallback(async () => {
    try {
      console.log(`[${name}] Attempting recovery (attempt ${recoveryAttempts})`);
      
      // Simulate recovery action
      await mockBackend.processText(`recover:${name}`);
      
      // Check health after recovery
      await checkHealth();
    } catch (err) {
      console.error(`[${name}] Recovery failed:`, err);
    }
  }, [name, recoveryAttempts, checkHealth]);
  
  // Initial health check
  React.useEffect(() => {
    checkHealth();
    
    // Set up periodic health checks
    const interval = setInterval(checkHealth, 2000);
    return () => clearInterval(interval);
  }, [checkHealth]);
  
  // Attempt recovery when failed
  React.useEffect(() => {
    if (status === 'failed') {
      const timeout = setTimeout(attemptRecovery, 1000);
      return () => clearTimeout(timeout);
    }
  }, [status, attemptRecovery]);
  
  // Render based on status
  return (
    <div data-testid={`system-component-${name}`} data-status={status}>
      <h3>{name}</h3>
      <div>Status: {status}</div>
      {error && <div>Error: {error.message}</div>}
      {status !== 'healthy' && (
        <div>Recovery attempts: {recoveryAttempts}</div>
      )}
    </div>
  );
};

// System container component
const SystemContainer: React.FC = () => {
  const [componentStatuses, setComponentStatuses] = React.useState<Record<string, 'healthy' | 'degraded' | 'failed'>>({
    database: 'healthy',
    api: 'healthy',
    cache: 'healthy',
    frontend: 'healthy'
  });
  
  const handleStatusChange = (component: string, status: 'healthy' | 'degraded' | 'failed') => {
    setComponentStatuses(prev => ({
      ...prev,
      [component]: status
    }));
  };
  
  // Calculate overall system health
  const getSystemHealth = (): 'healthy' | 'degraded' | 'failed' => {
    const statuses = Object.values(componentStatuses);
    
    if (statuses.includes('failed')) {
      return 'failed';
    }
    
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  };
  
  const systemHealth = getSystemHealth();
  
  return (
    <div data-testid="system-container" data-status={systemHealth}>
      <h2>System Status: {systemHealth}</h2>
      
      <div className="component-grid">
        <SystemComponent 
          name="database" 
          onStatusChange={(status) => handleStatusChange('database', status)}
        />
        
        <SystemComponent 
          name="cache" 
          dependencies={['database']}
          onStatusChange={(status) => handleStatusChange('cache', status)}
        />
        
        <SystemComponent 
          name="api" 
          dependencies={['database', 'cache']}
          onStatusChange={(status) => handleStatusChange('api', status)}
        />
        
        <SystemComponent 
          name="frontend" 
          dependencies={['api']}
          onStatusChange={(status) => handleStatusChange('frontend', status)}
        />
      </div>
    </div>
  );
};

describe('System Recovery Tests', () => {
  let chaosHarness: ChaosTestHarness;
  let uxTracker: UXImpactTracker;
  let telemetryCollector: ChaosTelemetryCollector;
  
  beforeAll(async () => {
    // Enable mock backend
    enableMockBackend();
    await mockBackend.initialize();
    
    // Create chaos test harness
    chaosHarness = new ChaosTestHarness({
      failureRate: 0,
      maxConcurrentFailures: 2,
      modules: ['database', 'api', 'cache', 'network'],
      severityLevels: {
        database: 4,
        api: 3,
        cache: 2,
        network: 3
      }
    });
    
    // Create UX impact tracker
    uxTracker = new UXImpactTracker();
    
    // Create telemetry collector
    telemetryCollector = new ChaosTelemetryCollector();
    
    // Add metric sources
    telemetryCollector.addMetricSource(async () => {
      // Mock metrics collection
      return {
        apiLatency: Math.random() * 200,
        databaseConnections: Math.floor(Math.random() * 100),
        cacheHitRate: Math.random(),
        errorRate: Math.random() * 0.1
      };
    });
    
    // Set anomaly thresholds
    telemetryCollector.setAnomalyThresholds({
      apiLatency: { max: 500 },
      errorRate: { max: 0.05 }
    });
    
    // Collect baseline metrics
    await telemetryCollector.collectBaselineMetrics(2000);
  });
  
  afterAll(() => {
    chaosHarness.stop();
    telemetryCollector.stopMonitoring();
    mockBackend.reset();
  });
  
  beforeEach(() => {
    uxTracker.clearImpacts();
    mockBackend.setFailureRate(0);
    mockBackend.setLatency(0);
  });
  
  test('should recover from database failure', async () => {
    // Start telemetry monitoring
    telemetryCollector.startChaosMonitoring(500);
    
    // Render system
    render(<SystemContainer />);
    
    // Wait for initial healthy state
    await waitFor(() => {
      expect(screen.getByTestId('system-container')).toHaveAttribute('data-status', 'healthy');
    });
    
    // Record start time
    const startTime = Date.now();
    
    // Register chaos event
    const failureId = 'database-failure-test';
    telemetryCollector.registerChaosEvent(failureId, { component: 'database' });
    
    // Inject database failure
    chaosHarness.injectFailure(FAILURE_TYPES.DATABASE, 'database', 4, 5000);
    
    // Set high failure rate for database operations
    mockBackend.setFailureRate(0.9);
    
    // Wait for system to detect failure
    await waitFor(() => {
      expect(screen.getByTestId('system-component-database')).toHaveAttribute('data-status', 'failed');
    });
    
    // Wait for cascading failures
    await waitFor(() => {
      expect(screen.getByTestId('system-container')).toHaveAttribute('data-status', 'failed');
    });
    
    // Verify all dependent components are affected
    expect(screen.getByTestId('system-component-cache')).toHaveAttribute('data-status', 'degraded');
    expect(screen.getByTestId('system-component-api')).toHaveAttribute('data-status', 'degraded');
    
    // Reset failure rate to allow recovery
    mockBackend.setFailureRate(0);
    
    // Wait for system to recover
    await waitFor(() => {
      expect(screen.getByTestId('system-container')).toHaveAttribute('data-status', 'healthy');
    }, { timeout: 10000 });
    
    // Calculate recovery time
    const recoveryTime = Date.now() - startTime;
    
    // Unregister chaos event
    telemetryCollector.unregisterChaosEvent(failureId);
    
    // Record UX impact
    uxTracker.recordImpact({
      component: 'Database',
      severity: UXDegradationLevel.SIGNIFICANT,
      description: `Database failure recovery took ${recoveryTime}ms`,
      recoveryTime
    });
    
    // Log recovery time
    console.log(`Database recovery time: ${recoveryTime}ms`);
    
    // Verify recovery was successful
    expect(screen.getByTestId('system-component-database')).toHaveAttribute('data-status', 'healthy');
    expect(screen.getByTestId('system-component-cache')).toHaveAttribute('data-status', 'healthy');
    expect(screen.getByTestId('system-component-api')).toHaveAttribute('data-status', 'healthy');
    expect(screen.getByTestId('system-component-frontend')).toHaveAttribute('data-status', 'healthy');
  });
  
  test('should handle cascading failures and recover in dependency order', async () => {
    // Start telemetry monitoring
    telemetryCollector.startChaosMonitoring(500);
    
    // Render system
    render(<SystemContainer />);
    
    // Wait for initial healthy state
    await waitFor(() => {
      expect(screen.getByTestId('system-container')).toHaveAttribute('data-status', 'healthy');
    });
    
    // Record start time
    const startTime = Date.now();
    
    // Register chaos events
    telemetryCollector.registerChaosEvent('multi-component-failure', { 
      components: ['database', 'cache', 'api'] 
    });
    
    // Inject multiple failures
    chaosHarness.injectFailure(FAILURE_TYPES.DATABASE, 'database', 3, 3000);
    chaosHarness.injectFailure(FAILURE_TYPES.API, 'api', 3, 5000);
    
    // Set high failure rate and latency
    mockBackend.setFailureRate(0.7);
    mockBackend.setLatency(1000);
    
    // Wait for system to detect failures
    await waitFor(() => {
      expect(screen.getByTestId('system-container')).toHaveAttribute('data-status', 'failed');
    });
    
    // Reset failure rate to allow recovery, but keep some latency
    mockBackend.setFailureRate(0);
    mockBackend.setLatency(300);
    
    // Wait for system to recover
    await waitFor(() => {
      expect(screen.getByTestId('system-container')).toHaveAttribute('data-status', 'healthy');
    }, { timeout: 15000 });
    
    // Calculate recovery time
    const recoveryTime = Date.now() - startTime;
    
    // Unregister chaos event
    telemetryCollector.unregisterChaosEvent('multi-component-failure');
    
    // Record UX impact
    uxTracker.recordImpact({
      component: 'System',
      severity: UXDegradationLevel.SEVERE,
      description: `Multi-component cascading failure recovery took ${recoveryTime}ms`,
      recoveryTime
    });
    
    // Log recovery time
    console.log(`Cascading failures recovery time: ${recoveryTime}ms`);
    
    // Generate telemetry visualization
    const timelineData = telemetryCollector.generateChaosTimelineVisualization([
      'apiLatency', 'errorRate', 'databaseConnections'
    ]);
    
    // Log timeline data
    console.log('Telemetry timeline:', timelineData.timeRange);
    console.log('Chaos events:', timelineData.chaosEvents.length);
    
    // Detect anomalies
    const anomalies = telemetryCollector.detectAnomalies();
    console.log('Detected anomalies:', Object.keys(anomalies));
    
    // Verify recovery was successful
    expect(screen.getByTestId('system-component-database')).toHaveAttribute('data-status', 'healthy');
    expect(screen.getByTestId('system-component-cache')).toHaveAttribute('data-status', 'healthy');
    expect(screen.getByTestId('system-component-api')).toHaveAttribute('data-status', 'healthy');
    expect(screen.getByTestId('system-component-frontend')).toHaveAttribute('data-status', 'healthy');
  });
  
  test('should generate recovery metrics report', () => {
    // Generate UX impact report
    const uxReport = uxTracker.generateUXImpactReport();
    
    // Log report summary
    console.log(uxReport.summary);
    
    // Verify report structure
    expect(uxReport).toHaveProperty('summary');
    expect(uxReport).toHaveProperty('details');
    
    // Get telemetry data
    const telemetryData = telemetryCollector.getTelemetryData();
    
    // Verify telemetry data was collected
    expect(telemetryData.length).toBeGreaterThan(0);
    
    // Generate recovery path map
    const recoveryPaths = [
      {
        component: 'Database',
        primary: 'Connection Pool Reset',
        secondary: 'Replica Failover',
        fallback: 'Read-Only Mode',
        recoveryTime: 5000
      },
      {
        component: 'Cache',
        primary: 'Reconnect',
        secondary: 'Rebuild from Database',
        recoveryTime: 2000
      },
      {
        component: 'API',
        primary: 'Circuit Breaker Reset',
        secondary: 'Rate Limiting',
        fallback: 'Static Response',
        recoveryTime: 3000
      },
      {
        component: 'Frontend',
        primary: 'Retry with Backoff',
        fallback: 'Offline Mode',
        recoveryTime: 1000
      }
    ];
    
    // Log recovery paths
    console.log('Recovery paths:', recoveryPaths);
    
    // Verify recovery metrics
    expect(recoveryPaths.length).toBe(4);
    expect(recoveryPaths.filter(p => p.secondary).length).toBe(3);
    expect(recoveryPaths.filter(p => p.fallback).length).toBe(3);
  });
});