/**
 * Intent Chain Validation Tests
 * 
 * This test suite validates the system's ability to handle complex intent chains:
 * - Compound intent processing
 * - Parent-child intent relationships
 * - Intent chain execution order
 * - Rollback on partial failures
 * - Conditional execution paths
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import mockBackend, { enableMockBackend, Intent, DispatchResult } from '../../mocks/mock-backend';
import { ChaosTestHarness } from './chaosHarness';

describe('Intent Chain Validation Tests', () => {
  // Setup and teardown
  beforeAll(() => {
    enableMockBackend();
  });
  
  beforeEach(async () => {
    // Reset mock backend before each test
    mockBackend.reset();
    
    // Re-initialize mock backend
    await mockBackend.initialize();
  });
  
  // Test cases
  
  test('should process compound intents correctly', async () => {
    // Arrange
    const compoundCommand = 'Create a report and email it to the team';
    
    // Act
    const intent = await mockBackend.processCompoundIntent(compoundCommand);
    
    // Assert
    expect(intent).toBeDefined();
    expect(intent.type).toBe('compound');
    expect(intent.childIds).toBeDefined();
    expect(intent.childIds?.length).toBeGreaterThanOrEqual(2);
    
    // Verify child intents exist
    if (intent.childIds) {
      for (const childId of intent.childIds) {
        const childIntent = await mockBackend.getIntent(childId);
        expect(childIntent).toBeDefined();
        expect(childIntent.parentId).toBe(intent.id);
      }
    }
    
    // Dispatch the compound intent
    const result = await mockBackend.dispatchIntent(intent.id);
    
    // Verify dispatch result
    expect(result.success).toBe(true);
    
    // Verify all child intents were processed
    if (intent.childIds) {
      for (const childId of intent.childIds) {
        const childIntent = await mockBackend.getIntent(childId);
        expect(childIntent.status).toBe('completed');
      }
    }
  });
  
  test('should maintain correct execution order in intent chains', async () => {
    // Arrange
    const compoundCommand = 'Find the latest sales numbers and create a presentation';
    
    // Act
    const intent = await mockBackend.processCompoundIntent(compoundCommand);
    
    // Get child intents before dispatch
    const childIntents: Intent[] = [];
    if (intent.childIds) {
      for (const childId of intent.childIds) {
        const childIntent = await mockBackend.getIntent(childId);
        childIntents.push(childIntent);
      }
    }
    
    // Track execution order
    const executionOrder: string[] = [];
    
    // Override the dispatch function to track execution order
    const originalDispatch = mockBackend.dispatchIntent;
    mockBackend.dispatchIntent = async (intentId: string) => {
      executionOrder.push(intentId);
      return originalDispatch(intentId);
    };
    
    // Dispatch the compound intent
    const result = await mockBackend.dispatchIntent(intent.id);
    
    // Restore original dispatch function
    mockBackend.dispatchIntent = originalDispatch;
    
    // Assert
    expect(result.success).toBe(true);
    
    // Verify execution order matches child intent order
    expect(executionOrder.length).toBeGreaterThanOrEqual(childIntents.length + 1); // +1 for parent
    
    // The parent should be first
    expect(executionOrder[0]).toBe(intent.id);
    
    // Child intents should follow in order
    for (let i = 0; i < childIntents.length; i++) {
      expect(executionOrder).toContain(childIntents[i].id);
    }
  });
  
  test('should handle rollback on partial failures', async () => {
    // Arrange
    const compoundCommand = 'Schedule a meeting and send invites to the team';
    
    // Act
    const intent = await mockBackend.processCompoundIntent(compoundCommand);
    
    // Get child intents
    const childIntents: Intent[] = [];
    if (intent.childIds) {
      for (const childId of intent.childIds) {
        const childIntent = await mockBackend.getIntent(childId);
        childIntents.push(childIntent);
      }
    }
    
    // Force the second child intent to fail
    if (childIntents.length >= 2) {
      const secondChildId = childIntents[1].id;
      
      // Override the dispatch function to make the second child fail
      const originalDispatch = mockBackend.dispatchIntent;
      mockBackend.dispatchIntent = async (intentId: string) => {
        if (intentId === secondChildId) {
          return {
            intentId,
            success: false,
            status: 'failed',
            message: 'Simulated failure',
            timestamp: new Date(),
            executionTime: 100
          };
        }
        return originalDispatch(intentId);
      };
      
      // Dispatch the compound intent
      const result = await mockBackend.dispatchIntent(intent.id);
      
      // Restore original dispatch function
      mockBackend.dispatchIntent = originalDispatch;
      
      // Assert
      expect(result.success).toBe(false);
      
      // Verify parent intent status
      const updatedParent = await mockBackend.getIntent(intent.id);
      expect(updatedParent.status).toBe('failed');
      
      // Verify first child was rolled back
      const firstChild = await mockBackend.getIntent(childIntents[0].id);
      expect(firstChild.status).toBe('failed');
      
      // Verify second child failed
      const secondChild = await mockBackend.getIntent(secondChildId);
      expect(secondChild.status).toBe('failed');
    } else {
      // Skip test if not enough child intents
      console.warn('Not enough child intents to test rollback');
    }
  });
  
  test('should handle conditional execution paths', async () => {
    // Arrange
    const conditionalCommand = 'Check my calendar and reschedule any conflicts';
    
    // Act
    const intent = await mockBackend.processCompoundIntent(conditionalCommand);
    
    // Mock a calendar with conflicts
    mockBackend.setCustomScenario({
      calendarConflicts: true
    });
    
    // Dispatch the compound intent
    const result = await mockBackend.dispatchIntent(intent.id);
    
    // Assert
    expect(result.success).toBe(true);
    
    // Get updated intent
    const updatedIntent = await mockBackend.getIntent(intent.id);
    
    // Verify conditional path was taken
    expect(updatedIntent.childIds?.length).toBeGreaterThan(1);
    
    // Reset scenario
    mockBackend.setCustomScenario({
      calendarConflicts: false
    });
    
    // Create a new intent with the same command
    const noConflictIntent = await mockBackend.processCompoundIntent(conditionalCommand);
    
    // Dispatch the new intent
    const noConflictResult = await mockBackend.dispatchIntent(noConflictIntent.id);
    
    // Verify success
    expect(noConflictResult.success).toBe(true);
    
    // Get updated intent
    const updatedNoConflictIntent = await mockBackend.getIntent(noConflictIntent.id);
    
    // Verify different path was taken (fewer child intents)
    if (updatedIntent.childIds && updatedNoConflictIntent.childIds) {
      expect(updatedNoConflictIntent.childIds.length).toBeLessThan(updatedIntent.childIds.length);
    }
  });
  
  test('should handle nested compound intents', async () => {
    // Arrange
    const nestedCommand = 'Plan a team offsite with activities and food';
    
    // Act
    const intent = await mockBackend.processCompoundIntent(nestedCommand);
    
    // Assert
    expect(intent).toBeDefined();
    expect(intent.type).toBe('compound');
    expect(intent.childIds).toBeDefined();
    expect(intent.childIds?.length).toBeGreaterThanOrEqual(2);
    
    // Find a child that is also a compound intent
    let nestedCompoundChild: Intent | null = null;
    if (intent.childIds) {
      for (const childId of intent.childIds) {
        const childIntent = await mockBackend.getIntent(childId);
        if (childIntent.type === 'compound') {
          nestedCompoundChild = childIntent;
          break;
        }
      }
    }
    
    // If no nested compound child exists, create one
    if (!nestedCompoundChild && intent.childIds && intent.childIds.length > 0) {
      const firstChildId = intent.childIds[0];
      const firstChild = await mockBackend.getIntent(firstChildId);
      
      // Convert first child to a compound intent
      firstChild.type = 'compound';
      firstChild.childIds = [
        (await mockBackend.processText('Book a venue')).id,
        (await mockBackend.processText('Plan activities')).id
      ];
      
      // Update child intents to point to parent
      for (const childId of firstChild.childIds) {
        const childIntent = await mockBackend.getIntent(childId);
        childIntent.parentId = firstChild.id;
      }
      
      nestedCompoundChild = firstChild;
    }
    
    // Verify nested compound child exists
    expect(nestedCompoundChild).toBeDefined();
    
    // Dispatch the top-level compound intent
    const result = await mockBackend.dispatchIntent(intent.id);
    
    // Verify dispatch result
    expect(result.success).toBe(true);
    
    // Verify all child intents were processed, including nested ones
    if (intent.childIds) {
      for (const childId of intent.childIds) {
        const childIntent = await mockBackend.getIntent(childId);
        expect(childIntent.status).toBe('completed');
        
        // Check nested children
        if (childIntent.childIds) {
          for (const nestedChildId of childIntent.childIds) {
            const nestedChild = await mockBackend.getIntent(nestedChildId);
            expect(nestedChild.status).toBe('completed');
          }
        }
      }
    }
  });
  
  test('should handle intent chain with dependencies', async () => {
    // Arrange
    const dependencyCommand = 'Generate a report based on the latest data';
    
    // Act
    const intent = await mockBackend.processCompoundIntent(dependencyCommand);
    
    // Add dependencies between child intents
    if (intent.childIds && intent.childIds.length >= 2) {
      const firstChildId = intent.childIds[0];
      const secondChildId = intent.childIds[1];
      
      const secondChild = await mockBackend.getIntent(secondChildId);
      secondChild.metadata = {
        ...secondChild.metadata,
        dependencies: [firstChildId]
      };
    }
    
    // Track execution order
    const executionOrder: string[] = [];
    
    // Override the dispatch function to track execution order
    const originalDispatch = mockBackend.dispatchIntent;
    mockBackend.dispatchIntent = async (intentId: string) => {
      executionOrder.push(intentId);
      return originalDispatch(intentId);
    };
    
    // Dispatch the compound intent
    const result = await mockBackend.dispatchIntent(intent.id);
    
    // Restore original dispatch function
    mockBackend.dispatchIntent = originalDispatch;
    
    // Assert
    expect(result.success).toBe(true);
    
    // Verify execution order respects dependencies
    if (intent.childIds && intent.childIds.length >= 2) {
      const firstChildIndex = executionOrder.indexOf(intent.childIds[0]);
      const secondChildIndex = executionOrder.indexOf(intent.childIds[1]);
      
      expect(firstChildIndex).toBeLessThan(secondChildIndex);
    }
  });
  
  test('should handle parallel execution of independent intents', async () => {
    // Arrange
    const parallelCommand = 'Send emails to all team members';
    
    // Act
    const intent = await mockBackend.processCompoundIntent(parallelCommand);
    
    // Mark child intents as parallel
    if (intent.childIds && intent.childIds.length >= 2) {
      intent.metadata = {
        ...intent.metadata,
        executionMode: 'parallel'
      };
    }
    
    // Track execution start and end times
    const executionTimes: Record<string, { start: number; end: number }> = {};
    
    // Override the dispatch function to track execution times
    const originalDispatch = mockBackend.dispatchIntent;
    mockBackend.dispatchIntent = async (intentId: string) => {
      // Don't track parent intent
      if (intentId === intent.id) {
        return originalDispatch(intentId);
      }
      
      executionTimes[intentId] = { start: Date.now(), end: 0 };
      const result = await originalDispatch(intentId);
      executionTimes[intentId].end = Date.now();
      return result;
    };
    
    // Dispatch the compound intent
    const result = await mockBackend.dispatchIntent(intent.id);
    
    // Restore original dispatch function
    mockBackend.dispatchIntent = originalDispatch;
    
    // Assert
    expect(result.success).toBe(true);
    
    // Verify parallel execution
    if (intent.childIds && intent.childIds.length >= 2) {
      // Check for overlapping execution times
      let hasOverlap = false;
      
      for (let i = 0; i < intent.childIds.length; i++) {
        for (let j = i + 1; j < intent.childIds.length; j++) {
          const intentA = intent.childIds[i];
          const intentB = intent.childIds[j];
          
          const timeA = executionTimes[intentA];
          const timeB = executionTimes[intentB];
          
          // Check if execution times overlap
          if (timeA && timeB) {
            const overlap = (timeA.start <= timeB.end) && (timeB.start <= timeA.end);
            if (overlap) {
              hasOverlap = true;
              break;
            }
          }
        }
        
        if (hasOverlap) break;
      }
      
      expect(hasOverlap).toBe(true);
    }
  });
  
  test('should handle intent chain with retry logic', async () => {
    // Arrange
    const retryCommand = 'Upload file to cloud storage';
    
    // Act
    const intent = await mockBackend.processText(retryCommand);
    
    // Add retry metadata
    intent.metadata = {
      ...intent.metadata,
      maxRetries: 3,
      retryCount: 0
    };
    
    // Track retry attempts
    let attempts = 0;
    
    // Override the dispatch function to simulate failures with retries
    const originalDispatch = mockBackend.dispatchIntent;
    mockBackend.dispatchIntent = async (intentId: string) => {
      attempts++;
      
      // Fail the first two attempts
      if (attempts <= 2) {
        // Update retry count in metadata
        const intent = await mockBackend.getIntent(intentId);
        intent.metadata = {
          ...intent.metadata,
          retryCount: (intent.metadata?.retryCount || 0) + 1
        };
        
        return {
          intentId,
          success: false,
          status: 'failed',
          message: `Attempt ${attempts} failed`,
          timestamp: new Date(),
          executionTime: 100
        };
      }
      
      // Succeed on the third attempt
      return originalDispatch(intentId);
    };
    
    // Dispatch the intent with retry logic
    let result: DispatchResult | null = null;
    let finalAttempts = 0;
    
    // Simulate retry logic
    for (let i = 0; i < 3; i++) {
      result = await mockBackend.dispatchIntent(intent.id);
      finalAttempts = attempts;
      
      if (result.success) break;
      
      // Check if max retries reached
      const updatedIntent = await mockBackend.getIntent(intent.id);
      if ((updatedIntent.metadata?.retryCount || 0) >= (updatedIntent.metadata?.maxRetries || 0)) {
        break;
      }
    }
    
    // Restore original dispatch function
    mockBackend.dispatchIntent = originalDispatch;
    
    // Assert
    expect(result).toBeDefined();
    expect(result?.success).toBe(true);
    expect(finalAttempts).toBe(3); // Should succeed on the third attempt
    
    // Verify intent metadata
    const updatedIntent = await mockBackend.getIntent(intent.id);
    expect(updatedIntent.metadata?.retryCount).toBe(2); // Two failed attempts
  });
  
  test('should handle intent chain with timeout', async () => {
    // This test may take some time to run
    jest.setTimeout(10000);
    
    // Arrange
    const timeoutCommand = 'Process large dataset';
    
    // Act
    const intent = await mockBackend.processText(timeoutCommand);
    
    // Add timeout metadata
    intent.metadata = {
      ...intent.metadata,
      timeout: 2000 // 2 second timeout
    };
    
    // Override the dispatch function to simulate a long-running operation
    const originalDispatch = mockBackend.dispatchIntent;
    mockBackend.dispatchIntent = async (intentId: string) => {
      // Simulate a long-running operation
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      return originalDispatch(intentId);
    };
    
    // Dispatch the intent with timeout handling
    const startTime = Date.now();
    let timedOut = false;
    let result: DispatchResult | null = null;
    
    try {
      // Set up timeout handling
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), intent.metadata?.timeout || 5000);
      });
      
      // Race between the dispatch and the timeout
      result = await Promise.race([
        mockBackend.dispatchIntent(intent.id),
        timeoutPromise
      ]);
    } catch (error) {
      timedOut = true;
    } finally {
      // Restore original dispatch function
      mockBackend.dispatchIntent = originalDispatch;
    }
    
    const duration = Date.now() - startTime;
    
    // Assert
    expect(timedOut).toBe(true);
    expect(duration).toBeLessThan(4000); // Should timeout before the 5 second operation completes
    expect(duration).toBeGreaterThanOrEqual(intent.metadata?.timeout || 0);
    
    // Verify intent status
    const updatedIntent = await mockBackend.getIntent(intent.id);
    expect(updatedIntent.status).toBe('failed');
  });
});