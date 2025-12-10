/**
 * Chaos Harness
 * 
 * This module provides a simplified interface to the ChaosTestHarness.
 * 
 * @federation-compatible
 * @machine-readable
 * @version 1.0.0
 */

import { ChaosTestHarness } from './resilience/ChaosTestHarness';

// Re-export the ChaosTestHarness
export { ChaosTestHarness };

/**
 * Create a chaos test harness with default configuration
 */
export function createChaosHarness(component: string, options: any = {}) {
  return new ChaosTestHarness({
    targetComponent: component,
    failureRate: options.failureRate || 0.2,
    maxConcurrentFailures: options.maxConcurrentFailures || 1,
    journal: options.journal !== undefined ? options.journal : true,
    ...options
  });
}

/**
 * Get the global chaos configuration
 */
export function getChaosConfig() {
  // @ts-ignore - CHAOS_CONFIG is injected by Jest
  return global.CHAOS_CONFIG || {
    resourceProfiles: {
      basic: { memory: '256MB', cpu: '1 core', time: '5s' },
      cascade: { memory: '1GB', cpu: '2 cores', time: '15s' },
      recovery: { memory: '2GB', cpu: '4 cores', time: '30s' }
    }
  };
}

/**
 * Get resource profile for a test category
 */
export function getResourceProfile(category: string) {
  const config = getChaosConfig();
  return config.resourceProfiles[category] || config.resourceProfiles.basic;
}

/**
 * Simulate resource pressure
 */
export function simulateResourcePressure(type: string, amount: number) {
  console.log(`[Chaos] Simulating ${type} pressure: ${amount}`);
  
  // In a real implementation, this would actually consume resources
  if (type === 'memory') {
    // Simulate memory pressure
    const temp = new Array(Math.floor(amount * 1024 * 1024 / 8)).fill(0);
    console.log(`[Chaos] Allocated ${temp.length * 8} bytes`);
  } else if (type === 'cpu') {
    // Simulate CPU pressure
    const start = Date.now();
    while (Date.now() - start < amount * 100) {
      // Busy wait
      Math.random() * Math.random();
    }
    console.log(`[Chaos] CPU busy for ${Date.now() - start}ms`);
  }
}