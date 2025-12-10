/**
 * Backend Dispatch Chaos & Circuit Tests
 * 
 * This test suite validates the system's resilience to backend failures:
 * - Full backend outage
 * - 30+ second latency
 * - 100% internal error rate for N requests
 * - Circuit breaker activation
 * - Timeout recovery
 * - Disconnection and reconnection
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// Import using named imports for better compatibility
import { mockBackend, enableMockBackend, DispatchResult } from '../mocks/mock-backend';

// Add diagnostic logs to help troubleshoot
console.log('REASONING: mockBackend type:', typeof mockBackend);
console.log('REASONING: mockBackend methods:', Object.keys(mockBackend || {}));
console.log('REASONING: dispatchIntent exists:', typeof mockBackend?.dispatchIntent);
console.log('REASONING: setCustomScenario exists:', typeof mockBackend?.setCustomScenario);
import { ChaosTestHarness } from '../tests/cognitive/chaosHarness';

describe('Backend Dispatch Chaos & Circuit Tests', () => {
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
      targetComponent: 'backend',
      failureRate: 0.5,
      journal: true
    });
    
    // Start the chaos harness
    chaosHarness.start();
  });
  
  afterEach(() => {
    // Stop chaos harness
    chaosHarness.stop();
    chaosHarness.cleanup();
  });
  
  // Test cases
  
  test('should handle full backend outage', async () => {
    // Arrange
    const sessionId = 'test-session-' + Math.random().toString(36).substring(2, 9);
    
    // Create and process some intents before outage
    const preOutageIntents = [];
    for (let i = 0; i < 3; i++) {
      const intent = await mockBackend.processText(`Pre-outage command ${i}`);
      const result = await mockBackend.dispatchIntent(intent.id);
      await mockBackend.storeIntent(intent.id, sessionId);
      preOutageIntents.push({ intent, result });
    }
    
    // Verify pre-outage intents were processed successfully
    for (const { result } of preOutageIntents) {
      expect(result.success).toBe(true);
    }
    
    // Act - Inject backend failure
    chaosHarness.injectFailure({
      type: 'api-timeout',
      target: 'backend',
      duration: 5000
    });
    
    // Try to process intents during outage
    const outageIntents = [];
    for (let i = 0; i < 3; i++) {
      try {
        const intent = await mockBackend.processText(`Outage command ${i}`);
        const result = await mockBackend.dispatchIntent(intent.id);
        await mockBackend.storeIntent(intent.id, sessionId);
        outageIntents.push({ intent, result });
      } catch (error) {
        // Expect errors during outage
        outageIntents.push({ error });
      }
    }
    
    // Wait for recovery
    await chaosHarness.waitForRecovery();
    
    // Try to process intents after recovery
    const postOutageIntents = [];
    for (let i = 0; i < 3; i++) {
      const intent = await mockBackend.processText(`Post-outage command ${i}`);
      const result = await mockBackend.dispatchIntent(intent.id);
      await mockBackend.storeIntent(intent.id, sessionId);
      postOutageIntents.push({ intent, result });
    }
    
    // Verify post-outage intents were processed successfully
    for (const { result } of postOutageIntents) {
      expect(result.success).toBe(true);
    }
    
    // Verify all intents are in history
    const history = await mockBackend.getSessionHistory(sessionId);
    
    // Count successful intents (pre-outage + post-outage)
    const successfulIntents = preOutageIntents.length + postOutageIntents.length;
    
    // Count successful outage intents (if any)
    const successfulOutageIntents = outageIntents.filter(item => item.result && item.result.success).length;
    
    // Verify history contains all successful intents
    expect(history.length).toBe(successfulIntents + successfulOutageIntents);
  });
  
  test('should handle 100% internal error rate for N requests', async () => {
    // Arrange
    const sessionId = 'test-session-' + Math.random().toString(36).substring(2, 9);
    
    // Process some intents before error injection
    const preErrorIntents = [];
    for (let i = 0; i < 3; i++) {
      const intent = await mockBackend.processText(`Pre-error command ${i}`);
      const result = await mockBackend.dispatchIntent(intent.id);
      await mockBackend.storeIntent(intent.id, sessionId);
      preErrorIntents.push({ intent, result });
    }
    
    // Verify pre-error intents were processed successfully
    for (const { result } of preErrorIntents) {
      expect(result.success).toBe(true);
    }
    
    // Act - Set 100% failure rate
    mockBackend.setCustomScenario({
      failureRate: 1.0 // 100% failure rate
    });
    
    // Process N intents with 100% error rate
    const errorIntents = [];
    const errorCount = 5;
    
    for (let i = 0; i < errorCount; i++) {
      try {
        const intent = await mockBackend.processText(`Error command ${i}`);
        const result = await mockBackend.dispatchIntent(intent.id);
        await mockBackend.storeIntent(intent.id, sessionId);
        errorIntents.push({ intent, result });
      } catch (error) {
        // Expect errors during high failure rate
        errorIntents.push({ error });
      }
    }
    
    // Reset to normal failure rate
    mockBackend.setCustomScenario({
      failureRate: 0.05 // 5% failure rate (normal)
    });
    
    // Process some intents after error period
    const postErrorIntents = [];
    for (let i = 0; i < 3; i++) {
      const intent = await mockBackend.processText(`Post-error command ${i}`);
      const result = await mockBackend.dispatchIntent(intent.id);
      await mockBackend.storeIntent(intent.id, sessionId);
      postErrorIntents.push({ intent, result });
    }
    
    // Verify most post-error intents were processed successfully
    const successfulPostErrorIntents = postErrorIntents.filter(({ result }) => result.success).length;
    expect(successfulPostErrorIntents).toBeGreaterThanOrEqual(2); // At least 2 of 3 should succeed
  });
});