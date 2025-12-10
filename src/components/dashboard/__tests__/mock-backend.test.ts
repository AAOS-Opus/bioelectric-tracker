/**
 * Mock Backend Tests
 * 
 * This test suite validates the mock backend functionality:
 * - Proper export structure
 * - Basic functionality of key methods
 */

import { mockBackend, enableMockBackend } from '../../../mocks/mock-backend';

// Add console logs to help diagnose issues
console.log('DIAGNOSIS: mockBackend type:', typeof mockBackend);
console.log('DIAGNOSIS: mockBackend methods:', Object.keys(mockBackend || {}));
console.log('DIAGNOSIS: dispatchIntent exists:', typeof mockBackend?.dispatchIntent);
console.log('DIAGNOSIS: setCustomScenario exists:', typeof mockBackend?.setCustomScenario);

describe('Mock Backend Basic Tests', () => {
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
});