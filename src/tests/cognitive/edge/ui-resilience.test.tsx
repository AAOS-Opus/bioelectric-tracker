/**
 * UI Resilience Edge Case Tests
 * 
 * This file contains tests for UI component resilience under various failure conditions,
 * including:
 * - Network failures
 * - Backend service failures
 * - Memory pressure
 * - CPU load
 * - Rendering failures
 */

import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import mockBackend, { enableMockBackend } from '../../../mocks/mock-backend';
import { ChaosTestHarness } from '../resilience/ChaosTestHarness';
import { UXImpactTracker } from '../helpers/ux-impact-tracking';
import { loadScenario } from '../helpers/load-scenario';
import { UXDegradationLevel, FAILURE_TYPES } from '../types/chaos';

// Mock UI component for testing resilience
const ResilientDataDisplay: React.FC<{
  dataSource: string;
  fallbackMessage?: string;
  retryCount?: number;
  onError?: (error: Error) => void;
}> = ({ dataSource, fallbackMessage = 'No data available', retryCount = 3, onError }) => {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [retries, setRetries] = React.useState<number>(0);
  
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate data fetching with potential failures
      const result = await mockBackend.processText(`fetch:${dataSource}`);
      
      setData(result);
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      
      if (onError) {
        onError(err as Error);
      }
    }
  }, [dataSource, onError]);
  
  // Retry logic
  React.useEffect(() => {
    if (error && retries < retryCount) {
      const timer = setTimeout(() => {
        setRetries(prev => prev + 1);
        fetchData();
      }, 1000 * (retries + 1)); // Exponential backoff
      
      return () => clearTimeout(timer);
    }
  }, [error, retries, retryCount, fetchData]);
  
  // Initial data fetch
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Reset retries when data source changes
  React.useEffect(() => {
    setRetries(0);
  }, [dataSource]);
  
  // Render based on state
  if (loading && !data) {
    return <div data-testid="loading-state">Loading data from {dataSource}...</div>;
  }
  
  if (error && retries >= retryCount) {
    return (
      <div data-testid="error-state">
        <p>Error loading data: {error.message}</p>
        <button onClick={() => { setRetries(0); fetchData(); }}>
          Retry
        </button>
      </div>
    );
  }
  
  if (!data) {
    return <div data-testid="fallback-state">{fallbackMessage}</div>;
  }
  
  return (
    <div data-testid="data-display">
      <h3>Data from {dataSource}</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

describe('UI Resilience Edge Cases', () => {
  let chaosHarness: ChaosTestHarness;
  let uxTracker: UXImpactTracker;
  
  beforeAll(async () => {
    // Enable mock backend
    enableMockBackend();
    await mockBackend.initialize();
    
    // Create chaos test harness
    chaosHarness = new ChaosTestHarness({
      failureRate: 0,
      maxConcurrentFailures: 1,
      modules: ['network', 'api'],
      severityLevels: {
        network: 3,
        api: 3
      }
    });
    
    // Create UX impact tracker
    uxTracker = new UXImpactTracker();
  });
  
  afterAll(() => {
    chaosHarness.stop();
    mockBackend.reset();
  });
  
  beforeEach(() => {
    uxTracker.clearImpacts();
    mockBackend.setFailureRate(0);
  });
  
  test('should handle network failures with retry mechanism', async () => {
    // Set up error handler
    const handleError = jest.fn();
    
    // Set high failure rate to simulate network issues
    mockBackend.setFailureRate(0.8);
    
    // Render component
    render(
      <ResilientDataDisplay
        dataSource="user-profile"
        onError={handleError}
        retryCount={3}
      />
    );
    
    // Initially should show loading state
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    
    // Wait for retries and eventual error state
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    // Verify error handler was called
    expect(handleError).toHaveBeenCalled();
    
    // Verify retry button is present
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    
    // Reset failure rate
    mockBackend.setFailureRate(0);
    
    // Click retry button
    fireEvent.click(retryButton);
    
    // Should show loading state again
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    
    // Wait for successful data fetch
    await waitFor(() => {
      expect(screen.getByTestId('data-display')).toBeInTheDocument();
    });
    
    // Record UX impact
    uxTracker.recordImpact({
      component: 'ResilientDataDisplay',
      severity: UXDegradationLevel.MODERATE,
      description: 'Network failures required multiple retries',
      recoveryTime: 5000
    });
  });
  
  test('should handle backend service failures gracefully', async () => {
    // Inject backend failure
    chaosHarness.injectFailure(FAILURE_TYPES.API, 'backend-service', 4);
    
    // Render component with fallback message
    render(
      <ResilientDataDisplay
        dataSource="system-status"
        fallbackMessage="System status information is temporarily unavailable"
        retryCount={1}
      />
    );
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });
    
    // Verify error message
    expect(screen.getByText(/Error loading data/)).toBeInTheDocument();
    
    // End the failure
    chaosHarness.stop();
    
    // Click retry button
    fireEvent.click(screen.getByText('Retry'));
    
    // Wait for successful data fetch
    await waitFor(() => {
      expect(screen.getByTestId('data-display')).toBeInTheDocument();
    });
    
    // Record UX impact
    uxTracker.recordImpact({
      component: 'ResilientDataDisplay',
      severity: UXDegradationLevel.SIGNIFICANT,
      description: 'Backend service failure required manual retry',
      recoveryTime: 2000
    });
  });
  
  test('should handle high latency conditions', async () => {
    // Set high latency
    mockBackend.setLatency(3000);
    
    // Start performance measurement
    const startTime = Date.now();
    
    // Render component
    render(
      <ResilientDataDisplay
        dataSource="analytics-dashboard"
      />
    );
    
    // Should show loading state
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    
    // Wait for data to load despite high latency
    await waitFor(() => {
      expect(screen.getByTestId('data-display')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Calculate total render time
    const renderTime = Date.now() - startTime;
    
    // Record UX impact based on render time
    let severity = UXDegradationLevel.NONE;
    if (renderTime > 4000) {
      severity = UXDegradationLevel.SEVERE;
    } else if (renderTime > 3000) {
      severity = UXDegradationLevel.SIGNIFICANT;
    } else if (renderTime > 2000) {
      severity = UXDegradationLevel.MODERATE;
    } else if (renderTime > 1000) {
      severity = UXDegradationLevel.MINOR;
    }
    
    uxTracker.recordImpact({
      component: 'ResilientDataDisplay',
      severity,
      description: `High latency condition (${renderTime}ms render time)`,
      recoveryTime: renderTime
    });
    
    // Reset latency
    mockBackend.setLatency(0);
  });
  
  test('should handle multiple concurrent failures', async () => {
    // Apply CPU load
    await loadScenario({
      cpu: {
        targetUsage: 0.7,
        pattern: 'spike',
        duration: 2000
      }
    });
    
    // Set moderate failure rate
    mockBackend.setFailureRate(0.4);
    
    // Set moderate latency
    mockBackend.setLatency(1000);
    
    // Render multiple components concurrently
    const { rerender } = render(
      <>
        <ResilientDataDisplay dataSource="user-profile" />
        <ResilientDataDisplay dataSource="system-status" />
        <ResilientDataDisplay dataSource="analytics-dashboard" />
      </>
    );
    
    // Wait for at least one component to load successfully
    await waitFor(() => {
      const displays = screen.queryAllByTestId('data-display');
      const errors = screen.queryAllByTestId('error-state');
      const loading = screen.queryAllByTestId('loading-state');
      
      // Record component states
      console.log(`Component states: ${displays.length} loaded, ${errors.length} errors, ${loading.length} loading`);
      
      // Expect at least one component to have loaded
      expect(displays.length).toBeGreaterThan(0);
    }, { timeout: 10000 });
    
    // Count final states
    const displays = screen.queryAllByTestId('data-display');
    const errors = screen.queryAllByTestId('error-state');
    const loading = screen.queryAllByTestId('loading-state');
    
    // Record UX impact based on success rate
    const totalComponents = 3;
    const successRate = displays.length / totalComponents;
    
    let severity = UXDegradationLevel.NONE;
    if (successRate < 0.3) {
      severity = UXDegradationLevel.CRITICAL;
    } else if (successRate < 0.5) {
      severity = UXDegradationLevel.SEVERE;
    } else if (successRate < 0.7) {
      severity = UXDegradationLevel.SIGNIFICANT;
    } else if (successRate < 0.9) {
      severity = UXDegradationLevel.MODERATE;
    } else if (successRate < 1) {
      severity = UXDegradationLevel.MINOR;
    }
    
    uxTracker.recordImpact({
      component: 'MultipleDataDisplays',
      severity,
      description: `Multiple concurrent failures: ${displays.length}/${totalComponents} components loaded successfully`,
      recoveryTime: 0
    });
    
    // Reset conditions
    mockBackend.setFailureRate(0);
    mockBackend.setLatency(0);
    
    // Rerender to recover
    rerender(
      <>
        <ResilientDataDisplay dataSource="user-profile" />
        <ResilientDataDisplay dataSource="system-status" />
        <ResilientDataDisplay dataSource="analytics-dashboard" />
      </>
    );
    
    // Wait for all components to recover
    await waitFor(() => {
      const displays = screen.queryAllByTestId('data-display');
      expect(displays.length).toBe(3);
    });
  });
  
  test('should generate UX impact report', () => {
    // Generate report
    const report = uxTracker.generateUXImpactReport();
    
    // Log report summary
    console.log(report.summary);
    
    // Verify report structure
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('details');
    
    // Verify impacts were recorded
    expect(Object.keys(report.details).length).toBeGreaterThan(0);
  });
});