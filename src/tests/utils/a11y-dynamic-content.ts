/**
 * Dynamic Content Accessibility Testing Utilities
 * 
 * This module provides utilities for testing the accessibility of dynamic content,
 * including ARIA live regions, modal dialogs, and tooltips.
 */

import { fireEvent, waitFor } from '@testing-library/react';

interface DynamicContentResult {
  element: HTMLElement;
  type: 'dialog' | 'tooltip' | 'popover' | 'dropdown' | 'alert' | 'notification' | 'loading';
  hasProperAriaAttributes: boolean;
  isKeyboardAccessible: boolean;
  escapeClosable: boolean | null; // null if not tested
  trapsFocus: boolean | null; // null if not tested
  missingAttributes: string[];
}

/**
 * Test dynamic content for accessibility
 * @param rootElement Root element to test
 * @returns Object with test results
 */
export const testDynamicContent = async (rootElement: HTMLElement): Promise<{
  hasDynamicContent: boolean;
  allDynamicContentAccessible: boolean;
  dynamicContentResults: DynamicContentResult[];
}> => {
  const results: DynamicContentResult[] = [];
  
  // Find potential dynamic content
  const dialogs = findDynamicElements(rootElement, 'dialog');
  const tooltips = findDynamicElements(rootElement, 'tooltip');
  const popovers = findDynamicElements(rootElement, 'popover');
  const dropdowns = findDynamicElements(rootElement, 'dropdown');
  const alerts = findDynamicElements(rootElement, 'alert');
  const notifications = findDynamicElements(rootElement, 'notification');
  const loadingIndicators = findDynamicElements(rootElement, 'loading');
  
  // Test each type of dynamic content
  results.push(...await Promise.all(dialogs.map(el => testDialogAccessibility(el))));
  results.push(...await Promise.all(tooltips.map(el => testTooltipAccessibility(el))));
  results.push(...await Promise.all(popovers.map(el => testPopoverAccessibility(el))));
  results.push(...await Promise.all(dropdowns.map(el => testDropdownAccessibility(el))));
  results.push(...await Promise.all(alerts.map(el => testAlertAccessibility(el))));
  results.push(...await Promise.all(notifications.map(el => testNotificationAccessibility(el))));
  results.push(...await Promise.all(loadingIndicators.map(el => testLoadingAccessibility(el))));
  
  const hasDynamicContent = results.length > 0;
  const allDynamicContentAccessible = results.every(r => 
    r.hasProperAriaAttributes && r.isKeyboardAccessible
  );
  
  return {
    hasDynamicContent,
    allDynamicContentAccessible,
    dynamicContentResults: results
  };
};

/**
 * Find dynamic elements in the DOM
 */
const findDynamicElements = (rootElement: HTMLElement, type: string): HTMLElement[] => {
  let selector: string;
  
  switch (type) {
    case 'dialog':
      selector = `
        dialog,
        [role="dialog"],
        [role="alertdialog"],
        .modal,
        .dialog,
        .overlay,
        [aria-modal="true"]
      `;
      break;
      
    case 'tooltip':
      selector = `
        [role="tooltip"],
        .tooltip,
        [data-tooltip],
        [aria-describedby]
      `;
      break;
      
    case 'popover':
      selector = `
        [role="menu"],
        [role="listbox"],
        .popover,
        .popup,
        [data-popover]
      `;
      break;
      
    case 'dropdown':
      selector = `
        select,
        [role="combobox"],
        .dropdown,
        .select,
        [aria-haspopup="true"]
      `;
      break;
      
    case 'alert':
      selector = `
        [role="alert"],
        .alert,
        .error,
        .warning,
        .success,
        .info,
        [aria-live="assertive"]
      `;
      break;
      
    case 'notification':
      selector = `
        [role="status"],
        [role="log"],
        .notification,
        .toast,
        .message,
        [aria-live="polite"]
      `;
      break;
      
    case 'loading':
      selector = `
        [role="progressbar"],
        progress,
        .spinner,
        .loader,
        .loading,
        .progress,
        [aria-busy="true"]
      `;
      break;
      
    default:
      return [];
  }
  
  // Get elements and filter out hidden ones
  const elements = Array.from(rootElement.querySelectorAll(selector))
    .filter(el => {
      const style = window.getComputedStyle(el as HTMLElement);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0';
    }) as HTMLElement[];
  
  return elements;
};

/**
 * Test dialog accessibility
 */
const testDialogAccessibility = async (element: HTMLElement): Promise<DynamicContentResult> => {
  const missingAttributes: string[] = [];
  
  // Check ARIA attributes
  if (!element.hasAttribute('role') && 
      element.tagName.toLowerCase() !== 'dialog') {
    missingAttributes.push('role="dialog" or role="alertdialog"');
  }
  
  if (!element.hasAttribute('aria-modal')) {
    missingAttributes.push('aria-modal="true"');
  }
  
  if (!element.hasAttribute('aria-labelledby') && 
      !element.hasAttribute('aria-label')) {
    missingAttributes.push('aria-labelledby or aria-label');
  }
  
  // Check for focus trap
  const trapsFocus = await testFocusTrap(element);
  
  // Check if ESC key closes the dialog
  const escapeClosable = await testEscapeKey(element);
  
  // Check keyboard accessibility
  const focusableElements = getFocusableElements(element);
  const isKeyboardAccessible = focusableElements.length > 0;
  
  if (!isKeyboardAccessible) {
    missingAttributes.push('focusable elements inside dialog');
  }
  
  return {
    element,
    type: 'dialog',
    hasProperAriaAttributes: missingAttributes.length === 0,
    isKeyboardAccessible,
    escapeClosable,
    trapsFocus,
    missingAttributes
  };
};

/**
 * Test tooltip accessibility
 */
const testTooltipAccessibility = async (element: HTMLElement): Promise<DynamicContentResult> => {
  const missingAttributes: string[] = [];
  
  // Check ARIA attributes
  if (!element.hasAttribute('role') || element.getAttribute('role') !== 'tooltip') {
    missingAttributes.push('role="tooltip"');
  }
  
  // Check if tooltip is associated with an element
  const isAssociated = isElementAssociated(element);
  if (!isAssociated) {
    missingAttributes.push('associated element via aria-describedby');
  }
  
  return {
    element,
    type: 'tooltip',
    hasProperAriaAttributes: missingAttributes.length === 0,
    isKeyboardAccessible: isAssociated, // If associated with an element, it's keyboard accessible
    escapeClosable: null, // Usually not relevant for tooltips
    trapsFocus: null, // Not relevant for tooltips
    missingAttributes
  };
};

/**
 * Test popover accessibility
 */
const testPopoverAccessibility = async (element: HTMLElement): Promise<DynamicContentResult> => {
  const missingAttributes: string[] = [];
  
  // Check ARIA attributes based on type (menu, listbox, etc.)
  const role = element.getAttribute('role');
  if (!role) {
    missingAttributes.push('appropriate role (menu, listbox, etc.)');
  }
  
  // Check that it's associated with a trigger
  const isAssociated = isElementAssociated(element);
  if (!isAssociated) {
    missingAttributes.push('associated trigger element');
  }
  
  // Check keyboard accessibility
  const focusableElements = getFocusableElements(element);
  const isKeyboardAccessible = focusableElements.length > 0;
  
  if (!isKeyboardAccessible) {
    missingAttributes.push('focusable elements inside popover');
  }
  
  // Check if ESC key closes the popover
  const escapeClosable = await testEscapeKey(element);
  
  return {
    element,
    type: 'popover',
    hasProperAriaAttributes: missingAttributes.length === 0,
    isKeyboardAccessible,
    escapeClosable,
    trapsFocus: null, // Not typically needed for popovers
    missingAttributes
  };
};

/**
 * Test dropdown accessibility
 */
const testDropdownAccessibility = async (element: HTMLElement): Promise<DynamicContentResult> => {
  const missingAttributes: string[] = [];
  
  // Check if it's a native select or custom dropdown
  const isNativeSelect = element.tagName.toLowerCase() === 'select';
  
  if (!isNativeSelect) {
    // For custom dropdowns, check ARIA attributes
    if (!element.hasAttribute('role')) {
      missingAttributes.push('role="combobox" or appropriate role');
    }
    
    if (!element.hasAttribute('aria-expanded')) {
      missingAttributes.push('aria-expanded');
    }
    
    // Check that it has a visible label
    if (!hasAccessibleLabel(element)) {
      missingAttributes.push('accessible label');
    }
    
    // Check keyboard accessibility
    const focusableElements = getFocusableElements(element);
    const isKeyboardAccessible = focusableElements.length > 0;
    
    if (!isKeyboardAccessible) {
      missingAttributes.push('keyboard navigable options');
    }
    
    return {
      element,
      type: 'dropdown',
      hasProperAriaAttributes: missingAttributes.length === 0,
      isKeyboardAccessible,
      escapeClosable: await testEscapeKey(element),
      trapsFocus: null, // Not typically needed for dropdowns
      missingAttributes
    };
  } else {
    // Native selects are naturally accessible
    return {
      element,
      type: 'dropdown',
      hasProperAriaAttributes: true,
      isKeyboardAccessible: true,
      escapeClosable: null, // Native controls handle this
      trapsFocus: null, // Not relevant
      missingAttributes: []
    };
  }
};

/**
 * Test alert accessibility
 */
const testAlertAccessibility = async (element: HTMLElement): Promise<DynamicContentResult> => {
  const missingAttributes: string[] = [];
  
  // Check ARIA attributes
  if (!element.hasAttribute('role') && element.getAttribute('role') !== 'alert') {
    missingAttributes.push('role="alert"');
  }
  
  if (!element.hasAttribute('aria-live') && element.getAttribute('role') !== 'alert') {
    missingAttributes.push('aria-live="assertive"');
  }
  
  if (!element.hasAttribute('aria-atomic')) {
    missingAttributes.push('aria-atomic="true"');
  }
  
  return {
    element,
    type: 'alert',
    hasProperAriaAttributes: missingAttributes.length === 0,
    isKeyboardAccessible: true, // Alerts don't need keyboard interaction
    escapeClosable: null, // Not typically relevant for alerts
    trapsFocus: null, // Not relevant for alerts
    missingAttributes
  };
};

/**
 * Test notification accessibility
 */
const testNotificationAccessibility = async (element: HTMLElement): Promise<DynamicContentResult> => {
  const missingAttributes: string[] = [];
  
  // Check ARIA attributes
  const role = element.getAttribute('role');
  
  if (!element.hasAttribute('role') && !['status', 'log'].includes(role || '')) {
    missingAttributes.push('role="status" or role="log"');
  }
  
  if (!element.hasAttribute('aria-live') && !['status', 'log'].includes(role || '')) {
    missingAttributes.push('aria-live="polite"');
  }
  
  if (!element.hasAttribute('aria-atomic')) {
    missingAttributes.push('aria-atomic="true"');
  }
  
  return {
    element,
    type: 'notification',
    hasProperAriaAttributes: missingAttributes.length === 0,
    isKeyboardAccessible: true, // Notifications don't need keyboard interaction
    escapeClosable: null, // Not typically relevant for notifications
    trapsFocus: null, // Not relevant for notifications
    missingAttributes
  };
};

/**
 * Test loading indicator accessibility
 */
const testLoadingAccessibility = async (element: HTMLElement): Promise<DynamicContentResult> => {
  const missingAttributes: string[] = [];
  
  // Check ARIA attributes
  if (element.tagName.toLowerCase() !== 'progress' && 
      !element.hasAttribute('role') && 
      element.getAttribute('role') !== 'progressbar') {
    missingAttributes.push('role="progressbar"');
  }
  
  if (!element.hasAttribute('aria-busy')) {
    missingAttributes.push('aria-busy="true"');
  }
  
  // If it's a determinate progress bar, check for value attributes
  if (element.tagName.toLowerCase() === 'progress' || 
      element.getAttribute('role') === 'progressbar') {
    
    if (!element.hasAttribute('aria-valuemin') && 
        element.tagName.toLowerCase() !== 'progress') {
      missingAttributes.push('aria-valuemin');
    }
    
    if (!element.hasAttribute('aria-valuemax') && 
        element.tagName.toLowerCase() !== 'progress') {
      missingAttributes.push('aria-valuemax');
    }
    
    if (!element.hasAttribute('aria-valuenow') && 
        !element.hasAttribute('aria-valuetext') && 
        element.tagName.toLowerCase() !== 'progress') {
      missingAttributes.push('aria-valuenow or aria-valuetext');
    }
  }
  
  // Check for accessible label
  if (!hasAccessibleLabel(element)) {
    missingAttributes.push('accessible label');
  }
  
  return {
    element,
    type: 'loading',
    hasProperAriaAttributes: missingAttributes.length === 0,
    isKeyboardAccessible: true, // Loading indicators don't need keyboard interaction
    escapeClosable: null, // Not relevant for loading indicators
    trapsFocus: null, // Not relevant for loading indicators
    missingAttributes
  };
};

/**
 * Test if an element traps focus (for modals, dialogs)
 */
const testFocusTrap = async (element: HTMLElement): Promise<boolean> => {
  // This is a simplified test - in a real app, we'd do more extensive testing
  
  // Get all focusable elements in the document
  const allFocusable = getFocusableElements(document.body);
  
  // Get all focusable elements in the container
  const containerFocusable = getFocusableElements(element);
  
  // If there are no focusable elements in the container, it can't trap focus
  if (containerFocusable.length === 0) {
    return false;
  }
  
  // Check if there's a script handling focus trapping
  const hasFocusTrapScript = window.document.querySelector(
    'script[src*="focus-trap"], script[src*="focus"], script:not([src])'
  );
  
  // Check for common focus-trap libraries in the HTML
  const pageHtml = document.documentElement.outerHTML;
  const hasFocusTrapLib = 
    pageHtml.includes('createFocusTrap') || 
    pageHtml.includes('focus-trap') || 
    pageHtml.includes('focusTrap') ||
    pageHtml.includes('inert');
  
  // Check if elements outside the container have inert attribute
  const outsideElementsInert = Array.from(document.body.children)
    .filter(el => el !== element && el.hasAttribute('inert'));
  
  // Look for other indicators of focus trapping
  const hasAriaModal = element.getAttribute('aria-modal') === 'true';
  const isHTMLDialog = element.tagName.toLowerCase() === 'dialog';
  
  // For a comprehensive test, we'd need to actually test tabbing,
  // but that requires more complex setup with user event simulation
  
  return hasAriaModal || isHTMLDialog || hasFocusTrapLib || 
         hasFocusTrapScript !== null || outsideElementsInert.length > 0;
};

/**
 * Test if pressing ESC closes an element
 */
const testEscapeKey = async (element: HTMLElement): Promise<boolean | null> => {
  // This is a simplified test - real implementation would need to actually test
  // if the element closes on ESC key
  
  // Check for common patterns that suggest ESC handling
  const isHTMLDialog = element.tagName.toLowerCase() === 'dialog';
  const hasAriaModal = element.getAttribute('aria-modal') === 'true';
  const hasKeydownListener = element.hasAttribute('onkeydown') || 
                           element.hasAttribute('onkeyup') ||
                           element.hasAttribute('onkeypress');
  
  // For modal dialogs, ESC should typically close them
  if (isHTMLDialog || hasAriaModal) {
    return hasKeydownListener || isHTMLDialog; // HTML dialogs handle ESC by default
  }
  
  // For other elements, we can't reliably determine without testing
  return null;
};

/**
 * Check if an element is associated with another element
 */
const isElementAssociated = (element: HTMLElement): boolean => {
  // Check common ways elements are associated
  
  // 1. aria-describedby points to this element
  const id = element.id;
  if (id) {
    const associatedElement = document.querySelector(`[aria-describedby~="${id}"]`);
    if (associatedElement) return true;
  }
  
  // 2. aria-controls points to this element
  if (id) {
    const associatedElement = document.querySelector(`[aria-controls~="${id}"]`);
    if (associatedElement) return true;
  }
  
  // 3. aria-owns points to this element
  if (id) {
    const associatedElement = document.querySelector(`[aria-owns~="${id}"]`);
    if (associatedElement) return true;
  }
  
  // 4. For tooltips, the element might be a child of the trigger
  const possibleTrigger = element.parentElement;
  if (possibleTrigger) {
    if (possibleTrigger.getAttribute('data-tooltip') || 
        possibleTrigger.classList.contains('tooltip-trigger') ||
        possibleTrigger.hasAttribute('title')) {
      return true;
    }
  }
  
  return false;
};

/**
 * Check if an element has an accessible label
 */
const hasAccessibleLabel = (element: HTMLElement): boolean => {
  // Check for accessible name from various sources
  return !!(
    element.hasAttribute('aria-label') || 
    element.hasAttribute('aria-labelledby') ||
    element.hasAttribute('title') ||
    element.hasAttribute('alt') ||
    (element.tagName.toLowerCase() === 'input' && element.hasAttribute('placeholder'))
  );
};

/**
 * Get all focusable elements within a container
 */
const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    'details > summary'
  ];
  
  return Array.from(
    container.querySelectorAll(focusableSelectors.join(','))
  ) as HTMLElement[];
};
