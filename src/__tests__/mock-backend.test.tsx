/**
 * Mock Backend Tests
 * 
 * This test suite validates the mock backend functionality:
 * - Proper export structure
 * - Basic functionality of key methods
 * - Federation-compatible interface
 */

import { mockBackend, enableMockBackend, DispatchResult } from '../mocks/mock-backend';

// Add console logs to help diagnose issues
console.log('DIAGNOSIS: mockBackend type:', typeof mockBackend);
console.log('DIAGNOSIS: mockBackend methods:', Object.keys(mockBackend || {}));
console.log('DIAGNOSIS: dispatchIntent exists:', typeof mockBackend?.dispatchIntent);
console.log('DIAGNOSIS: setCustomScenario exists:', typeof mockBackend?.setCustomScenario);

describe('Mock Backend Federation Interface', () => {
  beforeAll(() => {
    // Enable the mock backend
    enableMockBackend();
    console.log('DIAGNOSIS: Mock backend enabled');
  });

  beforeEach(async () => {
    // Initialize the mock backend
    await mockBackend.initialize();
    console.log('DIAGNOSIS: Mock backend initialized');
  });

  afterEach(() => {
    // Reset the mock backend
    mockBackend.reset();
    console.log('DIAGNOSIS: Mock backend reset');
  });

  test('should have all required methods', () => {
    // Verify the mock backend has all required methods
    expect(mockBackend).toBeDefined();
    expect(typeof mockBackend.dispatchIntent).toBe('function');
    expect(typeof mockBackend.setCustomScenario).toBe('function');
    expect(typeof mockBackend.processText).toBe('function');
    expect(typeof mockBackend.storeIntent).toBe('function');
    expect(typeof mockBackend.getSessionHistory).toBe('function');
  });

  test('should process text and return an intent', async () => {
    // Process text to create an intent
    const intent = await mockBackend.processText('Test command');
    
    console.log('DIAGNOSIS: Processed intent:', intent);
    
    // Verify the intent has the expected properties
    expect(intent).toBeDefined();
    expect(intent.id).toBeDefined();
    expect(intent.text).toBe('Test command');
  });

  test('should dispatch an intent', async () => {
    // Process text to create an intent
    const intent = await mockBackend.processText('Test command');
    
    // Dispatch the intent
    const result = await mockBackend.dispatchIntent(intent.id);
    
    console.log('DIAGNOSIS: Dispatch result:', result);
    
    // Verify the result has the expected properties
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
  });

  test('should set custom scenario', () => {
    // Set a custom scenario
    const scenario = {
      failureRate: 0.5,
      latency: 1000
    };
    
    mockBackend.setCustomScenario(scenario);
    
    // No assertion needed, just verifying it doesn't throw
  });

  test('should store and retrieve session history', async () => {
    // Create a session ID
    const sessionId = 'test-session-' + Math.random().toString(36).substring(2, 9);
    
    // Process text to create an intent
    const intent = await mockBackend.processText('Test command');
    
    // Store the intent in the session
    await mockBackend.storeIntent(intent.id, sessionId);
    
    // Get the session history
    const history = await mockBackend.getSessionHistory(sessionId);
    
    console.log('DIAGNOSIS: Session history:', history);
    
    // Verify the history contains the intent
    expect(history).toBeDefined();
    expect(history.length).toBe(1);
    expect(history[0]).toBe(intent.id);
  });
});