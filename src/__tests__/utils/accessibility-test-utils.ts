/**
 * Accessibility Testing Utilities
 * Specialized for the Bioelectric Regeneration Tracker Phase Settings module
 */

import { act } from 'react-dom/test-utils';
import { AxeResults } from 'jest-axe';
import * as axe from 'axe-core';

/**
 * Performs comprehensive accessibility test on a component
 * @param container DOM container with the rendered component
 * @param options Optional axe options to customize the test
 * @returns Promise with axe results
 */
export const testAccessibility = async (
  container: Element | null,
  options?: axe.RunOptions
): Promise<AxeResults> => {
  if (!container) {
    throw new Error('Container element is null');
  }
  
  // Run axe with default options focused on WCAG AA+ compliance
  const axeOptions: axe.RunOptions = {
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-nav': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-required-children': { enabled: true },
      'aria-required-parent': { enabled: true },
      'aria-roles': { enabled: true },
      'document-title': { enabled: true },
      'duplicate-id': { enabled: true },
      'html-has-lang': { enabled: true },
      'landmark-one-main': { enabled: true },
      'region': { enabled: true },
      'page-has-heading-one': { enabled: true },
      'scrollable-region-focusable': { enabled: true },
      ...options?.rules
    }
  };
  
  const results = await axe.run(container, axeOptions);
  return results;
};

/**
 * Generates an accessibility compliance report from axe results
 * @param results Axe test results
 * @returns Formatted accessibility report
 */
export const generateA11yReport = (results: AxeResults): string => {
  const totalViolations = results.violations.length;
  const impactCounts = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0
  };
  
  // Count violations by impact
  results.violations.forEach((violation: any) => {
    if (violation.impact === 'critical') impactCounts.critical++;
    if (violation.impact === 'serious') impactCounts.serious++;
    if (violation.impact === 'moderate') impactCounts.moderate++;
    if (violation.impact === 'minor') impactCounts.minor++;
  });
  
  let report = '## Accessibility Compliance Report\n\n';
  
  if (totalViolations === 0) {
    report += '✅ **PASS**: No accessibility violations found\n\n';
  } else {
    report += `❌ **FAIL**: ${totalViolations} accessibility violations found\n\n`;
    report += '### Violations by Impact:\n\n';
    report += `- Critical: ${impactCounts.critical}\n`;
    report += `- Serious: ${impactCounts.serious}\n`;
    report += `- Moderate: ${impactCounts.moderate}\n`;
    report += `- Minor: ${impactCounts.minor}\n\n`;
    
    report += '### Detailed Violations:\n\n';
    
    results.violations.forEach((violation: any, index: number) => {
      report += `#### ${index + 1}. ${violation.id} (${violation.impact} impact)\n\n`;
      report += `**Description**: ${violation.description}\n\n`;
      report += `**Help**: ${violation.help}\n\n`;
      report += `**Help URL**: ${violation.helpUrl}\n\n`;
      
      report += '**Affected Elements**:\n\n';
      violation.nodes.forEach((node: any, nodeIndex: number) => {
        report += `${nodeIndex + 1}. \`${node.html}\`\n`;
        if (node.failureSummary) {
          report += `   - ${node.failureSummary.replace(/\n/g, '\n   - ')}\n`;
        }
      });
      
      report += '\n';
    });
  }
  
  report += '### Passes:\n\n';
  report += `- ${results.passes.length} accessibility checks passed\n\n`;
  
  return report;
};

/**
 * Tests keyboard navigation coverage of interactive elements
 * @param container DOM container with the rendered component
 * @param interactiveSelectors Selectors for interactive elements to verify
 * @returns Object with keyboard navigation test results
 */
export const testKeyboardNavigation = async (
  container: HTMLElement,
  interactiveSelectors: string[]
): Promise<{
  passed: boolean;
  coverage: number;
  unreachableElements: HTMLElement[];
}> => {
  // Find all expected interactive elements
  const expectedInteractiveElements = interactiveSelectors.flatMap(selector => 
    Array.from(container.querySelectorAll(selector))
  ) as HTMLElement[];
  
  // Simulate keyboard navigation
  const focusedElements: HTMLElement[] = [];
  let currentElement: HTMLElement | null = null;
  
  // First focus on the container to start tab sequence
  container.focus();
  
  // Simulate tabbing through the container
  for (let i = 0; i < expectedInteractiveElements.length * 2; i++) {
    // Simulate Tab key
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
      shiftKey: false
    });
    
    await act(async () => {
      document.activeElement?.dispatchEvent(event);
      // Give the DOM time to update focus
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    currentElement = document.activeElement as HTMLElement;
    
    // Skip if we're not in the container anymore
    if (!container.contains(currentElement)) {
      break;
    }
    
    // Skip if we've already seen this element (cycled through all focusable elements)
    if (focusedElements.includes(currentElement)) {
      break;
    }
    
    // Add to our focused elements list
    focusedElements.push(currentElement);
  }
  
  // Check which expected interactive elements were not reached
  const unreachableElements = expectedInteractiveElements.filter(element => 
    !focusedElements.includes(element)
  );
  
  // Calculate coverage
  const coverage = expectedInteractiveElements.length === 0 ? 1 : 
    (expectedInteractiveElements.length - unreachableElements.length) / 
    expectedInteractiveElements.length;
  
  return {
    passed: unreachableElements.length === 0,
    coverage,
    unreachableElements
  };
};

/**
 * Validates ARIA attributes on elements
 * @param container DOM container with the rendered component
 * @param elementChecks Array of element selectors and expected ARIA attributes
 * @returns Validation results
 */
export const validateAriaAttributes = (
  container: HTMLElement,
  elementChecks: Array<{
    selector: string;
    expectedAttributes: Record<string, string | boolean | null>;
  }>
): {
  passed: boolean;
  results: Array<{
    selector: string;
    element: HTMLElement | null;
    attributes: Record<string, {
      expected: string | boolean | null;
      actual: string | null;
      passed: boolean;
    }>;
    passed: boolean;
  }>;
} => {
  const results = elementChecks.map(check => {
    const element = container.querySelector(check.selector) as HTMLElement | null;
    const attributes: Record<string, {
      expected: string | boolean | null;
      actual: string | null;
      passed: boolean;
    }> = {};
    
    let allPassed = true;
    
    if (element) {
      for (const [attr, expected] of Object.entries(check.expectedAttributes)) {
        const actual = element.getAttribute(attr);
        const passed = expected === actual || 
          (expected === true && actual !== null) ||
          (expected === false && actual === null);
        
        attributes[attr] = {
          expected,
          actual,
          passed
        };
        
        if (!passed) {
          allPassed = false;
        }
      }
    } else {
      // Element not found
      allPassed = false;
    }
    
    return {
      selector: check.selector,
      element,
      attributes,
      passed: allPassed && element !== null
    };
  });
  
  const passed = results.every(result => result.passed);
  
  return {
    passed,
    results
  };
};

/**
 * Generates a screen reader announcement verification test
 * @param container DOM container with the rendered component
 * @param triggerFn Function that triggers the live region update
 * @param expectedAnnouncement Expected screen reader announcement
 * @returns Promise that resolves with test result
 */
export const testScreenReaderAnnouncement = async (
  container: HTMLElement,
  triggerFn: () => void,
  expectedAnnouncement: string
): Promise<{
  passed: boolean;
  announcement: string | null;
}> => {
  // Find aria-live regions
  const liveRegions = container.querySelectorAll('[aria-live]');
  
  // Store initial content of live regions
  const initialContent = Array.from(liveRegions).map(region => region.textContent);
  
  // Trigger the action
  await act(async () => {
    triggerFn();
    // Wait for announcement to be made
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  
  // Check for content changes in live regions
  let announcement: string | null = null;
  
  Array.from(liveRegions).forEach((region, index) => {
    if (region.textContent !== initialContent[index]) {
      announcement = region.textContent;
    }
  });
  
  const passed = announcement !== null && 
    (announcement.includes(expectedAnnouncement) || 
     expectedAnnouncement.includes(announcement || ""));
  
  return {
    passed,
    announcement
  };
};

/**
 * Checks if focus is properly managed in modal dialogs
 * @param container DOM container with the rendered component
 * @param openModalFn Function that opens the modal
 * @param closeModalFn Function that closes the modal
 * @returns Promise that resolves with test result
 */
export const testModalFocusManagement = async (
  container: HTMLElement,
  openModalFn: () => void,
  closeModalFn: () => void
): Promise<{
  focusTrapped: boolean;
  focusReturned: boolean;
}> => {
  // Store the element that has focus before opening modal
  const elementBeforeModal = document.activeElement as HTMLElement;
  
  // Open the modal
  await act(async () => {
    openModalFn();
    // Wait for modal to open and focus to move
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  
  // Find the modal
  const modal = container.querySelector('[role="dialog"]') as HTMLElement | null;
  
  if (!modal) {
    return {
      focusTrapped: false,
      focusReturned: false
    };
  }
  
  // Check if focus moved into the modal
  const focusInModal = modal.contains(document.activeElement);
  
  // Test focus trapping by attempting to tab outside the modal
  for (let i = 0; i < 10; i++) {
    // Simulate Tab key
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
      shiftKey: false
    });
    
    await act(async () => {
      document.activeElement?.dispatchEvent(event);
      // Give the DOM time to update focus
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  }
  
  // Check if focus is still in the modal after tabbing
  const focusTrappedInModal = modal.contains(document.activeElement);
  
  // Close the modal
  await act(async () => {
    closeModalFn();
    // Wait for modal to close and focus to return
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  
  // Check if focus returned to the element that had focus before the modal
  const focusReturned = document.activeElement === elementBeforeModal;
  
  return {
    focusTrapped: focusTrappedInModal,
    focusReturned
  };
};
