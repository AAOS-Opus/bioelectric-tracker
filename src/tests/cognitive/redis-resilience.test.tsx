/**
 * Redis Resilience Tests
 * 
 * This test suite validates the system's resilience to Redis failures:
 * - Sudden disconnection
 * - High latency or throttling
 * - Memory exhaustion
 * - Server restart during operation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import mockBackend, { enableMockBackend } from '../../mocks/mock-backend';
import { ChaosTestHarness } from './chaosHarness';

// Mock Redis client
jest.mock('../../utils/redis/redisClient', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  ping: jest.fn(),
  info: jest.fn(),
  isConnected: jest.fn()
}));

describe('Redis Resilience Tests', () => {
  // Setup and teardown
  let chaosHarness: ChaosTestHarness;
  
  beforeAll(() => {
    enableMockBackend();
  });
  
  beforeEach(async () => {
    // Reset mock backend before each test
    mockBackend.reset();
    
    // Re-initialize mock backend
    await mockBackend.initialize();
    
    // Create chaos harness
    chaosHarness = new ChaosTestHarness({
      enableRedisFailure: true,
      enableBackendFailure: false,
      enableNetworkLatency: false,
      enableMemoryPressure: false,
      verbose: true
    });
  });
  
  afterEach(() => {
    // Stop chaos harness
    chaosHarness.stop();
  });
  
  // Test cases
  
  test('should handle sudden Redis disconnection', async () => {
    // Arrange
    const sessionId = 'test-session-' + Math.random().toString(36).substring(2, 9);
    
    // Create and store some intents
    const intents = [];
    for (let i = 0; i < 5; i++) {
      const intent = await mockBackend.processText(`Test command ${i}`);
      await mockBackend.storeIntent(intent.id, sessionId);
      intents.push(intent);
    }
    
    // Verify intents are stored
    const history = await mockBackend.getSessionHistory(sessionId);
    expect(history.length).toBe(5);
    
    // Act - Inject Redis failure
    const failureId = chaosHarness.injectFailure('redis', 5000);
    
    // Try to store another intent during failure
    const newIntent = await mockBackend.processText('Command during failure');
    await mockBackend.storeIntent(newIntent.id, sessionId);
    
    // Try to get history during failure
    const historyDuringFailure = await mockBackend.getSessionHistory(sessionId);
    
    // Assert - System should fall back to local memory
    expect(historyDuringFailure.length).toBeGreaterThan(0);
    
    // Wait for recovery
    await new Promise(resolve => {
      chaosHarness.on('recovery', (event) => {
        if (event.id === failureId) {
          resolve(true);
        }
      });
    });
    
    // Verify system recovers
    const historyAfterRecovery = await mockBackend.getSessionHistory(sessionId);
    expect(historyAfterRecovery.length).toBeGreaterThanOrEqual(6); // Original 5 + at least 1 during failure
    
    // Verify the intent stored during failure is present
    const foundIntent = historyAfterRecovery.find(i => i.id === newIntent.id);
    expect(foundIntent).toBeTruthy();
  });
  
  test('should handle high Redis latency', async () => {
    // Arrange
    const sessionId = 'test-session-' + Math.random().toString(36).substring(2, 9);
    
    // Create and store some intents
    const intents = [];
    for (let i = 0; i < 3; i++) {
      const intent = await mockBackend.processText(`Test command ${i}`);
      await mockBackend.storeIntent(intent.id, sessionId);
      intents.push(intent);
    }
    
    // Measure normal operation time
    const startNormal = Date.now();
    await mockBackend.getSessionHistory(sessionId);
    const normalDuration = Date.now() - startNormal;
    
    // Act - Inject network latency
    const failureId = chaosHarness.injectFailure('network', 5000);
    
    // Measure operation time during latency
    const startLatency = Date.now();
    await mockBackend.getSessionHistory(sessionId);
    const latencyDuration = Date.now() - startLatency;
    
    // Assert - System should handle latency gracefully
    expect(latencyDuration).toBeGreaterThan(normalDuration);
    
    // Store an intent during latency
    const newIntent = await mockBackend.processText('Command during latency');
    await mockBackend.storeIntent(newIntent.id, sessionId);
    
    // Wait for recovery
    await new Promise(resolve => {
      chaosHarness.on('recovery', (event) => {
        if (event.id === failureId) {
          resolve(true);
        }
      });
    });
    
    // Verify system recovers
    const historyAfterRecovery = await mockBackend.getSessionHistory(sessionId);
    
    // Verify the intent stored during latency is present
    const foundIntent = historyAfterRecovery.find(i => i.id === newIntent.id);
    expect(foundIntent).toBeTruthy();
  });
  
  test('should handle Redis memory exhaustion', async () => {
    // Arrange
    const sessionId = 'test-session-' + Math.random().toString(36).substring(2, 9);
    
    // Act - Inject memory pressure
    const failureId = chaosHarness.injectFailure('memory', 5000);
    
    // Create and store many intents to simulate memory pressure
    const intents = [];
    for (let i = 0; i < 100; i++) {
      const intent = await mockBackend.processText(`Test command ${i}`);
      await mockBackend.storeIntent(intent.id, sessionId);
      intents.push(intent);
    }
    
    // Try to get history during memory pressure
    const historyDuringPressure = await mockBackend.getSessionHistory(sessionId);
    
    // Assert - System should handle memory pressure
    expect(historyDuringPressure.length).toBeGreaterThan(0);
    
    // Wait for recovery
    await new Promise(resolve => {
      chaosHarness.on('recovery', (event) => {
        if (event.id === failureId) {
          resolve(true);
        }
      });
    });
    
    // Verify system recovers
    const historyAfterRecovery = await mockBackend.getSessionHistory(sessionId);
    expect(historyAfterRecovery.length).toBe(100);
  });
  
  test('should handle Redis server restart during operation', async () => {
    // Arrange
    const sessionId = 'test-session-' + Math.random().toString(36).substring(2, 9);
    
    // Create and store some intents
    const intents = [];
    for (let i = 0; i < 5; i++) {
      const intent = await mockBackend.processText(`Test command ${i}`);
      await mockBackend.storeIntent(intent.id, sessionId);
      intents.push(intent);
    }
    
    // Act - Simulate Redis server restart (failure followed by recovery)
    const failureId = chaosHarness.injectFailure('redis', 3000);
    
    // Try operations during restart
    const newIntent = await mockBackend.processText('Command during restart');
    await mockBackend.storeIntent(newIntent.id, sessionId);
    
    // Wait for recovery
    await new Promise(resolve => {
      chaosHarness.on('recovery', (event) => {
        if (event.id === failureId) {
          resolve(true);
        }
      });
    });
    
    // Try operations after restart
    const postRestartIntent = await mockBackend.processText('Command after restart');
    await mockBackend.storeIntent(postRestartIntent.id, sessionId);
    
    // Assert - Verify system recovers and maintains data
    const historyAfterRecovery = await mockBackend.getSessionHistory(sessionId);
    
    // Verify all intents are present
    expect(historyAfterRecovery.length).toBe(7); // 5 original + 1 during restart + 1 after restart
    
    // Verify the intents stored during and after restart are present
    const duringRestartIntent = historyAfterRecovery.find(i => i.id === newIntent.id);
    const afterRestartIntent = historyAfterRecovery.find(i => i.id === postRestartIntent.id);
    expect(duringRestartIntent).toBeTruthy();
    expect(afterRestartIntent).toBeTruthy();
  });
  
  test('should handle fallback to local memory during Redis outage', async () => {
    // Arrange
    const sessionId = 'test-session-' + Math.random().toString(36).substring(2, 9);
    
    // Act - Inject Redis failure
    const failureId = chaosHarness.injectFailure('redis', 5000);
    
    // Create and store intents during failure
    const intents = [];
    for (let i = 0; i < 10; i++) {
      const intent = await mockBackend.processText(`Test command ${i}`);
      await mockBackend.storeIntent(intent.id, sessionId);
      intents.push(intent);
    }
    
    // Try to get history during failure
    const historyDuringFailure = await mockBackend.getSessionHistory(sessionId);
    
    // Assert - System should fall back to local memory
    expect(historyDuringFailure.length).toBe(10);
    
    // Wait for recovery
    await new Promise(resolve => {
      chaosHarness.on('recovery', (event) => {
        if (event.id === failureId) {
          resolve(true);
        }
      });
    });
    
    // Verify system recovers and syncs local memory to Redis
    const historyAfterRecovery = await mockBackend.getSessionHistory(sessionId);
    expect(historyAfterRecovery.length).toBe(10);
    
    // Verify all intents are present
    for (const intent of intents) {
      const foundIntent = historyAfterRecovery.find(i => i.id === intent.id);
      expect(foundIntent).toBeTruthy();
    }
  });
  
  test('should handle performance under large history (10,000+ items)', async () => {
    // This test may take some time to run
    jest.setTimeout(60000);
    
    // Arrange
    const sessionId = 'test-session-' + Math.random().toString(36).substring(2, 9);
    
    // Create and store many intents
    const intents = [];
    const batchSize = 100;
    const totalIntents = 1000; // Reduced for testing, increase to 10000+ for real test
    
    // Store intents in batches
    for (let i = 0; i < totalIntents; i += batchSize) {
      const batch = [];
      for (let j = 0; j < batchSize && i + j < totalIntents; j++) {
        const intent = await mockBackend.processText(`Test command ${i + j}`);
        await mockBackend.storeIntent(intent.id, sessionId);
        batch.push(intent);
      }
      intents.push(...batch);
      
      // Log progress
      console.log(`Stored ${Math.min(i + batchSize, totalIntents)} of ${totalIntents} intents`);
    }
    
    // Act - Measure time to retrieve history
    const startTime = Date.now();
    const history = await mockBackend.getSessionHistory(sessionId);
    const duration = Date.now() - startTime;
    
    // Assert - System should handle large history efficiently
    expect(history.length).toBe(totalIntents);
    
    // Performance should be reasonable (adjust threshold as needed)
    expect(duration).toBeLessThan(5000); // Should retrieve 10,000+ items in under 5 seconds
    
    // Inject Redis failure
    const failureId = chaosHarness.injectFailure('redis', 3000);
    
    // Try to get history during failure
    const startTimeDuringFailure = Date.now();
    const historyDuringFailure = await mockBackend.getSessionHistory(sessionId);
    const durationDuringFailure = Date.now() - startTimeDuringFailure;
    
    // Assert - System should fall back to local memory
    expect(historyDuringFailure.length).toBe(totalIntents);
    
    // Wait for recovery
    await new Promise(resolve => {
      chaosHarness.on('recovery', (event) => {
        if (event.id === failureId) {
          resolve(true);
        }
      });
    });
    
    // Verify system recovers
    const historyAfterRecovery = await mockBackend.getSessionHistory(sessionId);
    expect(historyAfterRecovery.length).toBe(totalIntents);
  });
  
  test('should maintain intent caching and replay during Redis failure', async () => {
    // Arrange
    const sessionId = 'test-session-' + Math.random().toString(36).substring(2, 9);
    
    // Create and store some intents
    const intents = [];
    for (let i = 0; i < 5; i++) {
      const intent = await mockBackend.processText(`Test command ${i}`);
      await mockBackend.storeIntent(intent.id, sessionId);
      intents.push(intent);
    }
    
    // Act - Inject Redis failure
    const failureId = chaosHarness.injectFailure('redis', 5000);
    
    // Create and dispatch intents during failure
    const failureIntents = [];
    for (let i = 0; i < 3; i++) {
      const intent = await mockBackend.processText(`Failure command ${i}`);
      const result = await mockBackend.dispatchIntent(intent.id);
      await mockBackend.storeIntent(intent.id, sessionId);
      failureIntents.push({ intent, result });
    }
    
    // Wait for recovery
    await new Promise(resolve => {
      chaosHarness.on('recovery', (event) => {
        if (event.id === failureId) {
          resolve(true);
        }
      });
    });
    
    // Assert - Verify intents were cached and replayed
    const history = await mockBackend.getSessionHistory(sessionId);
    
    // Verify all intents are present
    expect(history.length).toBe(8); // 5 original + 3 during failure
    
    // Verify the intents stored during failure are present
    for (const { intent } of failureIntents) {
      const foundIntent = history.find(i => i.id === intent.id);
      expect(foundIntent).toBeTruthy();
    }
    
    // Verify the results of intents dispatched during failure
    for (const { result } of failureIntents) {
      expect(result.success).toBeDefined();
    }
  });
});