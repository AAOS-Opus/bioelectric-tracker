/**
 * Performance and Accessibility Testing Utilities
 * Specialized for the Bioelectric Regeneration Tracker Phase Settings module
 */

import { act } from 'react-dom/test-utils';
import { waitFor } from '@testing-library/react';

/**
 * Measures render performance of a component
 * @param renderFn Function that renders the component
 * @param setupFn Optional setup function to run before measurement
 * @returns Promise with render time in milliseconds
 */
export const measureRenderTime = async (
  renderFn: () => void,
  setupFn?: () => Promise<void>
): Promise<number> => {
  // Run any setup if provided
  if (setupFn) {
    await setupFn();
  }

  // Measure render time
  const startTime = performance.now();
  await act(async () => {
    renderFn();
  });
  const endTime = performance.now();
  
  return endTime - startTime;
};

/**
 * Measures interaction response time
 * @param interactionFn Function that performs the interaction
 * @param waitForFn Function that returns a promise which resolves when interaction is complete
 * @returns Promise with interaction time in milliseconds
 */
export const measureInteractionTime = async (
  interactionFn: () => void,
  waitForFn: () => Promise<void>
): Promise<number> => {
  const startTime = performance.now();
  
  await act(async () => {
    interactionFn();
  });
  
  await waitForFn();
  
  const endTime = performance.now();
  return endTime - startTime;
};

/**
 * Simulates network latency for more realistic performance testing
 * @param ms Milliseconds of latency to simulate
 */
export const simulateNetworkLatency = (ms: number): void => {
  jest.spyOn(global, 'fetch').mockImplementation(
    (input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise((resolve) => {
        const originalFetch = jest.requireActual('node-fetch');
        setTimeout(() => {
          resolve(originalFetch(input, init));
        }, ms);
      });
    }
  );
};

/**
 * Validates that a component meets performance budgets
 * @param measurements Object containing measured times
 * @param budgets Object containing budget thresholds
 * @returns Object with validation results
 */
export const validatePerformanceBudgets = (
  measurements: Record<string, number>,
  budgets: Record<string, number>
): { 
  passed: boolean; 
  results: Record<string, { 
    actual: number; 
    budget: number; 
    passed: boolean; 
  }> 
} => {
  const results: Record<string, { actual: number; budget: number; passed: boolean }> = {};
  let allPassed = true;
  
  for (const [key, budget] of Object.entries(budgets)) {
    const actual = measurements[key] || 0;
    const passed = actual <= budget;
    
    results[key] = {
      actual,
      budget,
      passed
    };
    
    if (!passed) {
      allPassed = false;
    }
  }
  
  return {
    passed: allPassed,
    results
  };
};

/**
 * Tracks keyboard navigation through a component
 * @param container DOM container with the rendered component
 * @param maxTabs Maximum number of Tab key presses to simulate
 * @returns Array of elements focused during navigation
 */
export const trackKeyboardNavigation = async (
  container: HTMLElement,
  maxTabs: number = 20
): Promise<Element[]> => {
  const focusedElements: Element[] = [];
  let tabCount = 0;
  
  // Start with no focus
  if (document.activeElement !== container.ownerDocument.body) {
    (document.activeElement as HTMLElement)?.blur();
  }
  
  while (tabCount < maxTabs) {
    // Simulate Tab key press
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      bubbles: true
    });
    document.dispatchEvent(event);
    
    // Wait for focus to update
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Track focused element
    if (document.activeElement) {
      focusedElements.push(document.activeElement);
      
      // Check if we've cycled through all focusable elements
      if (
        tabCount > 0 &&
        document.activeElement === focusedElements[0]
      ) {
        break;
      }
    }
    
    tabCount++;
  }
  
  return focusedElements;
};

/**
 * Simulates different device viewports
 * @param viewport 'mobile', 'tablet', or 'desktop'
 */
export const simulateViewport = (
  viewport: 'mobile' | 'tablet' | 'desktop'
): void => {
  const viewportSizes = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1440, height: 900 }
  };
  
  const size = viewportSizes[viewport];
  
  // Update viewport size
  Object.defineProperty(window, 'innerWidth', { value: size.width });
  Object.defineProperty(window, 'innerHeight', { value: size.height });
  
  // Dispatch resize event
  window.dispatchEvent(new Event('resize'));
};

/**
 * Generates performance report for phase settings operations
 * @param measurements Performance measurements
 * @returns Formatted performance report
 */
export const generatePerformanceReport = (
  measurements: Record<string, number>
): string => {
  const budgets = {
    'phase-settings-render': 400,
    'timeline-interaction': 100,
    'phase-transition': 500
  };
  
  const validation = validatePerformanceBudgets(measurements, budgets);
  
  let report = '## Phase Settings Performance Report\n\n';
  report += '| Operation | Actual Time (ms) | Budget (ms) | Status |\n';
  report += '|-----------|------------------|-------------|--------|\n';
  
  for (const [key, result] of Object.entries(validation.results)) {
    report += `| ${key} | ${result.actual.toFixed(2)} | ${result.budget} | ${
      result.passed ? '✅ Pass' : '❌ Fail'
    } |\n`;
  }
  
  report += '\n### Summary\n\n';
  report += validation.passed
    ? '✅ All performance budgets met.'
    : '❌ Some performance budgets not met.';
  
  return report;
};
