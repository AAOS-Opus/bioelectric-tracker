/**
 * Accessibility Testing Utilities
 * 
 * This module provides utilities for testing accessibility compliance with WCAG 2.1 AA standards.
 * It includes functions for checking semantic structure, keyboard navigation, screen reader compatibility,
 * color contrast, form accessibility, dynamic content, and more.
 */

import { axe, toHaveNoViolations } from 'jest-axe';
import { screen, within, fireEvent, waitFor } from '@testing-library/react';
import { tabbable } from 'tabbable';
import { act } from 'react-dom/test-utils';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * Types for accessibility test results
 */
export interface A11yViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  helpUrl: string;
  nodes: string[];
  remediation?: string;
}

export interface A11yTestResult {
  component: string;
  passed: boolean;
  violations: A11yViolation[];
  incompleteTests?: string[];
  warnings?: string[];
}

/**
 * Run axe-core accessibility test on the current document
 * @param componentName Name of the component being tested
 * @param options Optional axe-core configuration
 * @returns Test result object
 */
export const runA11yAudit = async (
  componentName: string,
  options?: any
): Promise<A11yTestResult> => {
  // Run axe on the document
  const results = await axe(document.body, {
    rules: {
      // Ensure these rules are enabled (they sometimes default to off)
      'color-contrast': { enabled: true },
      'document-title': { enabled: true },
      'html-has-lang': { enabled: true },
      'landmark-one-main': { enabled: true },
      'region': { enabled: true },
      ...options?.rules
    }
  });

  // Format violations for easier reading
  const violations: A11yViolation[] = results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact as 'minor' | 'moderate' | 'serious' | 'critical',
    description: violation.description,
    helpUrl: violation.helpUrl,
    nodes: violation.nodes.map(node => node.html),
    remediation: getRemediation(violation.id)
  }));

  return {
    component: componentName,
    passed: violations.length === 0,
    violations,
  };
};

/**
 * Get suggested remediation for common accessibility issues
 */
const getRemediation = (violationId: string): string => {
  const remediations: Record<string, string> = {
    'aria-roles': 'Ensure ARIA roles are valid and appropriate for the element.',
    'aria-valid-attr': 'Verify all ARIA attributes are valid.',
    'aria-required-parent': 'ARIA roles must be contained by specific parent elements.',
    'button-name': 'Provide text content or aria-label for all buttons.',
    'document-title': 'Add a descriptive page title.',
    'duplicate-id': 'IDs must be unique across the entire document.',
    'form-field-multiple-labels': 'Form fields should have only one label.',
    'image-alt': 'Add alt text to images. Use empty alt="" for decorative images.',
    'label': 'Associate labels with form controls using the for attribute or nesting.',
    'link-name': 'Provide text content or aria-label for all links.',
    'list': 'Use proper list markup with <ul>, <ol>, and <li> elements.',
    'listitem': 'List items (<li>) must be contained in a <ul> or <ol>.',
    'landmark-one-main': 'Page should have exactly one main landmark.',
    'region': 'All content should be contained in landmarks.',
    'color-contrast': 'Increase contrast ratio between text and background to at least 4.5:1 (3:1 for large text).',
    'heading-order': 'Headings should increase by only one level at a time.',
    'html-has-lang': 'Add a lang attribute to the html element.',
    'html-lang-valid': 'Use a valid language code in the lang attribute.',
  };

  return remediations[violationId] || 'Review WCAG guidelines for this issue.';
};

/**
 * Test semantic structure and page navigation
 * @param rootElement Root element to test
 * @returns Object with test results
 */
export const testSemanticStructure = (rootElement: HTMLElement): {
  hasProperHeadingStructure: boolean;
  hasProperLandmarks: boolean;
  missingLandmarks: string[];
  headingIssues: string[];
} => {
  const result = {
    hasProperHeadingStructure: true,
    hasProperLandmarks: true,
    missingLandmarks: [] as string[],
    headingIssues: [] as string[]
  };

  // Test heading structure
  const headings = rootElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let prevLevel = 0;

  if (headings.length > 0) {
    Array.from(headings).forEach((heading) => {
      const level = parseInt(heading.tagName[1]);
      
      // First heading should be h1
      if (prevLevel === 0 && level !== 1) {
        result.hasProperHeadingStructure = false;
        result.headingIssues.push(`First heading is ${heading.tagName} instead of H1`);
      }
      
      // Check for skipped levels
      if (prevLevel > 0 && level > prevLevel + 1) {
        result.hasProperHeadingStructure = false;
        result.headingIssues.push(`Heading level skipped from ${prevLevel} to ${level}`);
      }
      
      prevLevel = level;
    });
  } else {
    result.hasProperHeadingStructure = false;
    result.headingIssues.push('No headings found');
  }

  // Test landmarks
  const landmarks = {
    header: rootElement.querySelector('header'),
    nav: rootElement.querySelector('nav'),
    main: rootElement.querySelector('main'),
    footer: rootElement.querySelector('footer'),
    // ARIA landmarks
    banner: rootElement.querySelector('[role="banner"]'),
    navigation: rootElement.querySelector('[role="navigation"]'),
    contentinfo: rootElement.querySelector('[role="contentinfo"]'),
    complementary: rootElement.querySelector('[role="complementary"]'),
    search: rootElement.querySelector('[role="search"]'),
  };

  // Check for missing essential landmarks
  if (!landmarks.main && !rootElement.querySelector('[role="main"]')) {
    result.hasProperLandmarks = false;
    result.missingLandmarks.push('main');
  }

  if (!landmarks.nav && !landmarks.navigation) {
    result.hasProperLandmarks = false;
    result.missingLandmarks.push('navigation');
  }

  return result;
};

/**
 * Test keyboard navigation
 * @param rootElement Root element to test
 * @returns Object with test results
 */
export const testKeyboardNavigation = async (rootElement: HTMLElement): Promise<{
  allElementsReachable: boolean;
  focusVisibleOnAll: boolean;
  unnavigableElements: string[];
  noVisibleFocusElements: string[];
}> => {
  const result = {
    allElementsReachable: true,
    focusVisibleOnAll: true,
    unnavigableElements: [] as string[],
    noVisibleFocusElements: [] as string[]
  };

  // Get all interactive elements
  const interactiveSelectors = [
    'a', 'button', 'input', 'select', 'textarea', 
    '[tabindex]:not([tabindex="-1"])', '[role="button"]', 
    '[role="link"]', '[role="checkbox"]', '[role="radio"]',
    '[role="tab"]', '[role="menuitem"]', '[role="combobox"]'
  ];
  
  const interactiveElements = rootElement.querySelectorAll(interactiveSelectors.join(','));
  
  // Get all tabbable elements (elements reachable via tab key)
  const tabbableElements = tabbable(rootElement);
  
  // Check if all interactive elements are keyboard navigable
  Array.from(interactiveElements).forEach(element => {
    if (!tabbableElements.includes(element as HTMLElement)) {
      result.allElementsReachable = false;
      result.unnavigableElements.push(getElementDescription(element));
    }
  });

  // Check focus visibility
  for (const element of tabbableElements) {
    // Focus the element
    element.focus();
    await act(async () => {
      // Wait a tick for any focus styles to apply
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Get computed styles
    const styles = window.getComputedStyle(element);
    const hasFocusStyles = 
      styles.outlineColor !== 'transparent' ||
      styles.boxShadow !== 'none' ||
      element.classList.contains('focus') ||
      element.classList.contains('focus-visible');
    
    if (!hasFocusStyles) {
      result.focusVisibleOnAll = false;
      result.noVisibleFocusElements.push(getElementDescription(element));
    }
  }

  return result;
};

/**
 * Get a descriptive string for an element
 */
const getElementDescription = (element: Element): string => {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const classNames = Array.from(element.classList).map(c => `.${c}`).join('');
  const text = element.textContent?.trim().substring(0, 20);
  const textPreview = text ? ` "${text}${text.length > 20 ? '...' : ''}"` : '';
  
  return `${tag}${id}${classNames}${textPreview}`;
};
