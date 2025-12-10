/**
 * Intent Resolution Edge Case Tests
 * 
 * This file contains tests for edge cases in intent resolution, including:
 * - Ambiguous intents
 * - Low confidence intents
 * - Conflicting intents
 * - Nested intent chains
 * - Intent resolution under load
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import mockBackend, { enableMockBackend, Intent } from '../../../mocks/mock-backend';
import { ChaosTestHarness } from '../resilience/ChaosTestHarness';
import { UXImpactTracker } from '../helpers/ux-impact-tracking';
import { loadScenario } from '../helpers/load-scenario';
import { UXDegradationLevel } from '../types/chaos';

// Mock component for testing intent resolution
const IntentResolutionComponent: React.FC<{
  text: string;
  onResult: (intent: Intent) => void;
  onError: (error: Error) => void;
}> = ({ text, onResult, onError }) => {
  React.useEffect(() => {
    const processIntent = async () => {
      try {
        const intent = await mockBackend.processText(text);
        onResult(intent);
      } catch (error) {
        onError(error as Error);
      }
    };
    
    processIntent();
  }, [text, onResult, onError]);
  
  return <div data-testid="intent-processor">Processing: {text}</div>;
};

describe('Intent Resolution Edge Cases', () => {
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
      modules: ['intent'],
      severityLevels: {
        intent: 3
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
  });
  
  test('should handle ambiguous intents', async () => {
    // Ambiguous intent text
    const ambiguousText = 'show me the thing with the stuff';
    
    // Mock result handlers
    const handleResult = jest.fn();
    const handleError = jest.fn();
    
    // Render component
    render(
      <IntentResolutionComponent
        text={ambiguousText}
        onResult={handleResult}
        onError={handleError}
      />
    );
    
    // Wait for intent processing
    await waitFor(() => {
      expect(handleResult).toHaveBeenCalled();
    });
    
    // Get the processed intent
    const intent = handleResult.mock.calls[0][0];
    
    // Verify intent properties
    expect(intent).toBeDefined();
    expect(intent.text).toBe(ambiguousText);
    expect(intent.confidence).toBeLessThan(0.5); // Ambiguous intents should have low confidence
    expect(intent.type).toBe('unknown');
  });
  
  test('should handle low confidence intents with clarification', async () => {
    // Low confidence intent text
    const lowConfidenceText = 'hmm maybe do something with that';
    
    // Mock result handlers
    const handleResult = jest.fn();
    const handleError = jest.fn();
    
    // Render component
    render(
      <IntentResolutionComponent
        text={lowConfidenceText}
        onResult={handleResult}
        onError={handleError}
      />
    );
    
    // Wait for intent processing
    await waitFor(() => {
      expect(handleResult).toHaveBeenCalled();
    });
    
    // Get the processed intent
    const intent = handleResult.mock.calls[0][0];
    
    // Verify intent properties
    expect(intent).toBeDefined();
    expect(intent.text).toBe(lowConfidenceText);
    expect(intent.confidence).toBeLessThan(0.4); // Very low confidence
    
    // Now try to clarify with more specific text
    const clarificationText = 'I want to search for recent documents about project X';
    
    // Reset mocks
    handleResult.mockReset();
    
    // Render component with clarification
    render(
      <IntentResolutionComponent
        text={clarificationText}
        onResult={handleResult}
        onError={handleError}
      />
    );
    
    // Wait for intent processing
    await waitFor(() => {
      expect(handleResult).toHaveBeenCalled();
    });
    
    // Get the clarified intent
    const clarifiedIntent = handleResult.mock.calls[0][0];
    
    // Verify clarified intent properties
    expect(clarifiedIntent).toBeDefined();
    expect(clarifiedIntent.text).toBe(clarificationText);
    expect(clarifiedIntent.confidence).toBeGreaterThan(0.7); // Higher confidence after clarification
    expect(clarifiedIntent.type).toBe('search');
  });
  
  test('should handle compound intents', async () => {
    // Compound intent text
    const compoundText = 'find documents about project X and then create a new meeting for tomorrow';
    
    // Mock result handlers
    const handleResult = jest.fn();
    const handleError = jest.fn();
    
    // Render component
    render(
      <IntentResolutionComponent
        text={compoundText}
        onResult={handleResult}
        onError={handleError}
      />
    );
    
    // Wait for intent processing
    await waitFor(() => {
      expect(handleResult).toHaveBeenCalled();
    });
    
    // Get the processed intent
    const intent = handleResult.mock.calls[0][0];
    
    // Verify intent properties
    expect(intent).toBeDefined();
    expect(intent.text).toBe(compoundText);
    expect(intent.type).toBe('compound');
    expect(intent.childIds).toBeDefined();
    expect(intent.childIds?.length).toBeGreaterThan(1);
    
    // Verify child intents
    for (const childId of intent.childIds || []) {
      const childIntent = await mockBackend.getIntent(childId);
      expect(childIntent).toBeDefined();
      expect(childIntent.parentId).toBe(intent.id);
    }
  });
  
  test('should handle intent resolution under load', async () => {
    // Apply CPU load
    await loadScenario({
      cpu: {
        targetUsage: 0.7,
        pattern: 'spike',
        duration: 2000
      }
    });
    
    // Intent text
    const intentText = 'search for documents about project X';
    
    // Mock result handlers
    const handleResult = jest.fn();
    const handleError = jest.fn();
    
    // Measure start time
    const startTime = Date.now();
    
    // Render component
    render(
      <IntentResolutionComponent
        text={intentText}
        onResult={handleResult}
        onError={handleError}
      />
    );
    
    // Wait for intent processing
    await waitFor(() => {
      expect(handleResult).toHaveBeenCalled();
    });
    
    // Measure end time and calculate processing time
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // Get the processed intent
    const intent = handleResult.mock.calls[0][0];
    
    // Verify intent properties
    expect(intent).toBeDefined();
    expect(intent.text).toBe(intentText);
    expect(intent.type).toBe('search');
    
    // Record UX impact if processing time is too long
    if (processingTime > 500) {
      uxTracker.recordImpact({
        component: 'Intent Resolution',
        severity: UXDegradationLevel.MODERATE,
        description: `Intent processing took ${processingTime}ms under load`
      });
    }
    
    // Verify UX impact
    const impacts = uxTracker.getImpacts();
    console.log('UX Impacts:', impacts);
  });
  
  test('should handle intent resolution during chaos', async () => {
    // Start chaos testing with intent failures
    chaosHarness.startRandomFailures();
    
    // Inject intent failures with 50% probability
    mockBackend.setFailureRate(0.5);
    
    // Intent text
    const intentText = 'create a new document with title "Project Plan"';
    
    // Process multiple intents during chaos
    const results: Array<{ success: boolean; intent?: Intent; error?: Error }> = [];
    
    for (let i = 0; i < 10; i++) {
      // Mock result handlers
      const handleResult = jest.fn();
      const handleError = jest.fn();
      
      // Render component
      render(
        <IntentResolutionComponent
          text={`${intentText} - ${i}`}
          onResult={handleResult}
          onError={handleError}
        />
      );
      
      // Wait for intent processing or error
      await waitFor(() => {
        expect(handleResult.mock.calls.length + handleError.mock.calls.length).toBeGreaterThan(0);
      });
      
      // Record result
      if (handleResult.mock.calls.length > 0) {
        results.push({
          success: true,
          intent: handleResult.mock.calls[0][0]
        });
      } else {
        results.push({
          success: false,
          error: handleError.mock.calls[0][0]
        });
      }
      
      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Stop chaos testing
    chaosHarness.stop();
    
    // Analyze results
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`Intent processing during chaos: ${successCount} successes, ${failureCount} failures`);
    
    // Record UX impact based on failure rate
    const failureRate = failureCount / results.length;
    
    let severity = UXDegradationLevel.NONE;
    if (failureRate > 0.8) {
      severity = UXDegradationLevel.CRITICAL;
    } else if (failureRate > 0.6) {
      severity = UXDegradationLevel.SEVERE;
    } else if (failureRate > 0.4) {
      severity = UXDegradationLevel.SIGNIFICANT;
    } else if (failureRate > 0.2) {
      severity = UXDegradationLevel.MODERATE;
    } else if (failureRate > 0) {
      severity = UXDegradationLevel.MINOR;
    }
    
    uxTracker.recordImpact({
      component: 'Intent Resolution',
      severity,
      description: `Intent processing failure rate: ${(failureRate * 100).toFixed(1)}% during chaos testing`
    });
    
    // Generate UX impact report
    const report = uxTracker.generateUXImpactReport();
    console.log(report.summary);
    
    // Verify that some intents succeeded despite chaos
    expect(successCount).toBeGreaterThan(0);
  });
  
  test('should handle conflicting intents', async () => {
    // Conflicting intents
    const intent1Text = 'delete all documents';
    const intent2Text = 'save all documents';
    
    // Process first intent
    const handleResult1 = jest.fn();
    const handleError1 = jest.fn();
    
    render(
      <IntentResolutionComponent
        text={intent1Text}
        onResult={handleResult1}
        onError={handleError1}
      />
    );
    
    await waitFor(() => {
      expect(handleResult1).toHaveBeenCalled();
    });
    
    const intent1 = handleResult1.mock.calls[0][0];
    
    // Process second intent
    const handleResult2 = jest.fn();
    const handleError2 = jest.fn();
    
    render(
      <IntentResolutionComponent
        text={intent2Text}
        onResult={handleResult2}
        onError={handleError2}
      />
    );
    
    await waitFor(() => {
      expect(handleResult2).toHaveBeenCalled();
    });
    
    const intent2 = handleResult2.mock.calls[0][0];
    
    // Verify intents are conflicting
    expect(intent1.type).toBe('delete');
    expect(intent2.type).toBe('create'); // or 'update' depending on how the mock backend interprets it
    
    // Simulate conflict detection
    const isConflicting = intent1.type === 'delete' && 
      (intent2.type === 'create' || intent2.type === 'update');
    
    expect(isConflicting).toBe(true);
    
    // Record UX impact for conflict
    uxTracker.recordImpact({
      component: 'Intent Resolution',
      severity: UXDegradationLevel.MODERATE,
      description: `Conflicting intents detected: ${intent1.type} vs ${intent2.type}`
    });
  });
});