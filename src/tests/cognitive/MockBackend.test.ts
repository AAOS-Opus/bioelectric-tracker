/**
 * Mock Backend Tests
 * 
 * This test suite validates the functionality of the mock backend service,
 * including intent processing, dispatch, and storage.
 */

import mockBackend, { Intent, DispatchResult, enableMockBackend } from '../../mocks/mock-backend';

describe('Mock Backend Service', () => {
  // Setup and teardown
  beforeAll(() => {
    // Enable mock backend
    enableMockBackend();
  });
  
  beforeEach(async () => {
    // Reset mock backend before each test
    mockBackend.reset();
    
    // Re-initialize mock backend
    await mockBackend.initialize();
  });
  
  // Test cases
  
  test('should initialize successfully', async () => {
    // Act
    await mockBackend.initialize();
    
    // Assert
    const telemetry = await mockBackend.getTelemetryData();
    expect(telemetry).toBeDefined();
    expect(telemetry.totalIntents).toBe(0);
    expect(telemetry.successRate).toBeCloseTo(0.95);
  });
  
  test('should process text and extract intent', async () => {
    // Arrange
    const testText = 'Create a new report';
    
    // Act
    const intent = await mockBackend.processText(testText);
    
    // Assert
    expect(intent).toBeDefined();
    expect(intent.id).toBeDefined();
    expect(intent.type).toBe('create');
    expect(intent.text).toBe(testText);
    expect(intent.confidence).toBeGreaterThan(0.7);
    expect(intent.confidence).toBeLessThan(0.96);
    expect(intent.status).toBe('pending');
    
    // Verify telemetry was updated
    const telemetry = await mockBackend.getTelemetryData();
    expect(telemetry.totalIntents).toBe(1);
    expect(telemetry.intentTypes.create).toBe(1);
  });
  
  test('should process compound intent', async () => {
    // Arrange
    const testText = 'Create a report and email it to the team';
    
    // Act
    const intent = await mockBackend.processCompoundIntent(testText);
    
    // Assert
    expect(intent).toBeDefined();
    expect(intent.id).toBeDefined();
    expect(intent.type).toBe('compound');
    expect(intent.text).toBe(testText);
    expect(intent.childIds).toBeDefined();
    expect(intent.childIds?.length).toBeGreaterThan(0);
    
    // Verify telemetry was updated
    const telemetry = await mockBackend.getTelemetryData();
    expect(telemetry.totalIntents).toBeGreaterThan(1); // Compound + child intents
    expect(telemetry.intentTypes.compound).toBe(1);
  });
  
  test('should dispatch intent successfully', async () => {
    // Arrange
    const testText = 'Create a new report';
    const intent = await mockBackend.processText(testText);
    
    // Configure for 100% success rate
    mockBackend.setCustomScenario({
      failureRate: 0
    });
    
    // Act
    const result = await mockBackend.dispatchIntent(intent.id);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.intentId).toBe(intent.id);
    expect(result.success).toBe(true);
    expect(result.status).toBe('completed');
    expect(result.executionTime).toBeGreaterThan(0);
    
    // Verify intent status was updated
    const history = await mockBackend.getSessionHistory();
    const storedIntent = history.find(i => i.id === intent.id);
    expect(storedIntent?.status).toBe('completed');
    
    // Verify telemetry was updated
    const telemetry = await mockBackend.getTelemetryData();
    expect(telemetry.statusCounts.completed).toBe(1);
    expect(telemetry.statusCounts.pending).toBe(0);
    expect(telemetry.statusCounts.processing).toBe(0);
  });
  
  test('should handle intent dispatch failure', async () => {
    // Arrange
    const testText = 'Create a new report';
    const intent = await mockBackend.processText(testText);
    
    // Configure for 100% failure rate
    mockBackend.setCustomScenario({
      failureRate: 1.0
    });
    
    // Act
    const result = await mockBackend.dispatchIntent(intent.id);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.intentId).toBe(intent.id);
    expect(result.success).toBe(false);
    expect(result.status).toBe('failed');
    
    // Verify telemetry was updated
    const telemetry = await mockBackend.getTelemetryData();
    expect(telemetry.statusCounts.failed).toBe(1);
    expect(telemetry.successRate).toBeLessThan(1);
  });
  
  test('should store and retrieve intents from session history', async () => {
    // Arrange
    const testText = 'Create a new report';
    const intent = await mockBackend.processText(testText);
    await mockBackend.dispatchIntent(intent.id);
    
    // Act
    const success = await mockBackend.storeIntent(intent.id, 'test-session');
    const history = await mockBackend.getSessionHistory('test-session');
    
    // Assert
    expect(success).toBe(true);
    expect(history).toBeDefined();
    expect(history.length).toBeGreaterThan(0);
    
    // Find our intent in the history
    const storedIntent = history.find(i => i.id === intent.id);
    expect(storedIntent).toBeDefined();
    expect(storedIntent?.text).toBe(testText);
  });
  
  test('should search intents by text', async () => {
    // Arrange
    const intents = [
      'Create a new report',
      'Schedule a meeting for tomorrow',
      'What is the status of project Alpha?',
      'Remind me to call Sarah in 30 minutes'
    ];
    
    // Process all intents
    for (const text of intents) {
      await mockBackend.processText(text);
    }
    
    // Act
    const results = await mockBackend.searchIntents('report');
    
    // Assert
    expect(results).toBeDefined();
    expect(results.length).toBe(1);
    expect(results[0].text).toBe('Create a new report');
  });
  
  test('should extract entities from text', async () => {
    // Arrange
    const testText = 'Schedule a meeting with John tomorrow at 2pm in the conference room';
    
    // Act
    const intent = await mockBackend.processText(testText);
    
    // Assert
    expect(intent.entities).toBeDefined();
    expect(intent.entities?.person).toBe('John');
    expect(intent.entities?.date).toBe('tomorrow');
    expect(intent.entities?.time).toBe('2pm');
    expect(intent.entities?.location).toBe('conference room');
  });
  
  test('should handle custom scenarios', async () => {
    // Arrange
    mockBackend.setCustomScenario({
      latency: 50, // 50ms latency
      failureRate: 0.5 // 50% failure rate
    });
    
    // Process multiple intents to get a statistical sample
    const results: DispatchResult[] = [];
    for (let i = 0; i < 10; i++) {
      const intent = await mockBackend.processText(`Test intent ${i}`);
      const result = await mockBackend.dispatchIntent(intent.id);
      results.push(result);
    }
    
    // Assert
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    // With a 50% failure rate, we expect roughly half to succeed and half to fail
    // But since it's random, we allow some variance
    expect(successCount).toBeGreaterThanOrEqual(2);
    expect(failureCount).toBeGreaterThanOrEqual(2);
    
    // Verify telemetry reflects the results
    const telemetry = await mockBackend.getTelemetryData();
    expect(telemetry.statusCounts.completed).toBe(successCount);
    expect(telemetry.statusCounts.failed).toBe(failureCount);
  });
  
  test('should get telemetry data', async () => {
    // Arrange
    // Process and dispatch multiple intents
    for (let i = 0; i < 5; i++) {
      const intent = await mockBackend.processText(`Test intent ${i}`);
      await mockBackend.dispatchIntent(intent.id);
    }
    
    // Act
    const telemetry = await mockBackend.getTelemetryData();
    
    // Assert
    expect(telemetry).toBeDefined();
    expect(telemetry.totalIntents).toBe(5);
    expect(telemetry.avgDispatchTime).toBeGreaterThan(0);
    expect(Object.keys(telemetry.intentTypes).length).toBeGreaterThan(0);
    expect(Object.keys(telemetry.statusCounts).length).toBe(4); // pending, processing, completed, failed
  });
});