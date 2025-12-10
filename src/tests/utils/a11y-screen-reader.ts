/**
 * Screen Reader Compatibility Testing Utilities
 * 
 * This module provides utilities for testing screen reader compatibility,
 * including image alt text, ARIA attributes, and live regions.
 */

import { getByRole, queryByRole, getByText, queryByText } from '@testing-library/react';

/**
 * Test image accessibility
 * @param rootElement Root element to test
 * @returns Object with test results
 */
export const testImageAccessibility = (rootElement: HTMLElement): {
  allImagesHaveAlt: boolean;
  decorativeImagesMarkedProperly: boolean;
  imagesWithoutAlt: string[];
  decorativeImagesNotMarked: string[];
} => {
  const result = {
    allImagesHaveAlt: true,
    decorativeImagesMarkedProperly: true,
    imagesWithoutAlt: [] as string[],
    decorativeImagesNotMarked: [] as string[]
  };

  // Get all images
  const images = rootElement.querySelectorAll('img');
  
  Array.from(images).forEach(img => {
    // Check if image has alt attribute
    if (!img.hasAttribute('alt')) {
      result.allImagesHaveAlt = false;
      result.imagesWithoutAlt.push(getImageDescription(img));
    }
    
    // Check if decorative images are properly marked
    const isLikelyDecorative = 
      img.width < 25 || // Small icons
      img.height < 25 || // Small icons
      img.classList.contains('decorative') ||
      img.classList.contains('icon') ||
      img.src.includes('icon') ||
      img.parentElement?.tagName === 'BUTTON'; // Icons in buttons
    
    if (isLikelyDecorative && img.getAttribute('alt') !== '') {
      result.decorativeImagesMarkedProperly = false;
      result.decorativeImagesNotMarked.push(getImageDescription(img));
    }
  });

  return result;
};

/**
 * Test ARIA attributes and roles
 * @param rootElement Root element to test
 * @returns Object with test results
 */
export const testAriaAttributes = (rootElement: HTMLElement): {
  ariaAttributesValid: boolean;
  ariaRolesValid: boolean;
  invalidAriaAttributes: string[];
  invalidAriaRoles: string[];
} => {
  const result = {
    ariaAttributesValid: true,
    ariaRolesValid: true,
    invalidAriaAttributes: [] as string[],
    invalidAriaRoles: [] as string[]
  };

  // Valid ARIA roles
  const validRoles = [
    'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
    'cell', 'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo',
    'definition', 'dialog', 'directory', 'document', 'feed', 'figure', 'form',
    'grid', 'gridcell', 'group', 'heading', 'img', 'link', 'list', 'listbox',
    'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem',
    'menuitemcheckbox', 'menuitemradio', 'navigation', 'none', 'note', 'option',
    'presentation', 'progressbar', 'radio', 'radiogroup', 'region', 'row',
    'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
    'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist',
    'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree',
    'treegrid', 'treeitem'
  ];

  // Valid ARIA attributes (partial list of commonly used ones)
  const validAriaAttributes = [
    'aria-activedescendant', 'aria-atomic', 'aria-autocomplete', 'aria-busy',
    'aria-checked', 'aria-colcount', 'aria-colindex', 'aria-colspan',
    'aria-controls', 'aria-current', 'aria-describedby', 'aria-details',
    'aria-disabled', 'aria-errormessage', 'aria-expanded', 'aria-flowto',
    'aria-haspopup', 'aria-hidden', 'aria-invalid', 'aria-keyshortcuts',
    'aria-label', 'aria-labelledby', 'aria-level', 'aria-live',
    'aria-modal', 'aria-multiline', 'aria-multiselectable', 'aria-orientation',
    'aria-owns', 'aria-placeholder', 'aria-posinset', 'aria-pressed',
    'aria-readonly', 'aria-relevant', 'aria-required', 'aria-roledescription',
    'aria-rowcount', 'aria-rowindex', 'aria-rowspan', 'aria-selected',
    'aria-setsize', 'aria-sort', 'aria-valuemax', 'aria-valuemin',
    'aria-valuenow', 'aria-valuetext'
  ];

  // Check elements with role attributes
  const elementsWithRole = rootElement.querySelectorAll('[role]');
  Array.from(elementsWithRole).forEach(element => {
    const role = element.getAttribute('role');
    if (role && !validRoles.includes(role)) {
      result.ariaRolesValid = false;
      result.invalidAriaRoles.push(`${getElementDescription(element)} has invalid role "${role}"`);
    }
  });

  // Check elements with ARIA attributes
  const elementsWithAria = rootElement.querySelectorAll('[aria-*]');
  Array.from(elementsWithAria).forEach(element => {
    const attributes = element.getAttributeNames();
    attributes.forEach(attr => {
      if (attr.startsWith('aria-') && !validAriaAttributes.includes(attr)) {
        result.ariaAttributesValid = false;
        result.invalidAriaAttributes.push(
          `${getElementDescription(element)} has potentially invalid attribute "${attr}"`
        );
      }
    });
  });

  return result;
};

/**
 * Test live regions for screen readers
 * @param rootElement Root element to test
 * @returns Object with test results
 */
export const testLiveRegions = (rootElement: HTMLElement): {
  hasLiveRegions: boolean;
  hasProperAriaLive: boolean;
  liveRegionIssues: string[];
} => {
  const result = {
    hasLiveRegions: false,
    hasProperAriaLive: true,
    liveRegionIssues: [] as string[]
  };

  // Potential live region selectors
  const potentialLiveRegions = [
    // Explicit live regions
    '[aria-live]',
    '[role="alert"]',
    '[role="status"]',
    '[role="log"]',
    // Common dynamic content containers
    '.notifications',
    '.toast',
    '.alert',
    '.message',
    '.status',
    '.progress',
    '.loading',
    // Loading indicators
    '.spinner',
    '.loader',
  ];

  // Find potential live regions
  const liveRegionElements = rootElement.querySelectorAll(potentialLiveRegions.join(','));
  
  if (liveRegionElements.length > 0) {
    result.hasLiveRegions = true;
    
    // Check proper aria-live usage
    Array.from(liveRegionElements).forEach(element => {
      const ariaLive = element.getAttribute('aria-live');
      const role = element.getAttribute('role');
      
      // Elements with role="alert" should not have aria-live
      if (role === 'alert' && ariaLive) {
        result.hasProperAriaLive = false;
        result.liveRegionIssues.push(
          `${getElementDescription(element)} has redundant aria-live with role="alert"`
        );
      }
      
      // Check for potentially incorrect aria-live values
      if (ariaLive && !['off', 'polite', 'assertive'].includes(ariaLive)) {
        result.hasProperAriaLive = false;
        result.liveRegionIssues.push(
          `${getElementDescription(element)} has invalid aria-live value "${ariaLive}"`
        );
      }
      
      // Check for aria-atomic attribute on live regions
      if ((ariaLive || ['alert', 'status', 'log'].includes(role || '')) && 
          !element.hasAttribute('aria-atomic')) {
        result.liveRegionIssues.push(
          `${getElementDescription(element)} should consider adding aria-atomic attribute`
        );
      }
    });
  } else {
    // Does the page have content that's likely to update?
    const potentialDynamicContent = rootElement.querySelectorAll(
      '.notification, .alert, progress, .progress-bar, .loading, .spinner'
    );
    
    if (potentialDynamicContent.length > 0) {
      result.liveRegionIssues.push('Page has potentially dynamic content but no live regions');
    }
  }

  return result;
};

/**
 * Test if focusable elements have accessible names
 * @param rootElement Root element to test
 * @returns Object with test results
 */
export const testAccessibleNames = (rootElement: HTMLElement): {
  allElementsHaveAccessibleNames: boolean;
  elementsWithoutAccessibleNames: string[];
} => {
  const result = {
    allElementsHaveAccessibleNames: true,
    elementsWithoutAccessibleNames: [] as string[]
  };

  // Elements that require accessible names
  const requiredNameElements = rootElement.querySelectorAll(
    'a, button, [role="button"], [role="link"], [role="tab"], input:not([type="hidden"]), ' +
    'select, textarea, [aria-pressed], [role="checkbox"], [role="radio"], [role="combobox"], ' +
    'iframe, [role="img"]'
  );
  
  Array.from(requiredNameElements).forEach(element => {
    // Calculate accessible name
    const accessibleName = getAccessibleName(element);
    
    if (!accessibleName) {
      result.allElementsHaveAccessibleNames = false;
      result.elementsWithoutAccessibleNames.push(getElementDescription(element));
    }
  });

  return result;
};

/**
 * Get an element's accessible name (simplified version)
 * This is a simplified algorithm - full accessible name calculation is complex
 * @param element The element to check
 * @returns The accessible name or empty string
 */
const getAccessibleName = (element: Element): string => {
  // Check aria-labelledby (highest priority)
  const labelledby = element.getAttribute('aria-labelledby');
  if (labelledby) {
    const ids = labelledby.split(/\s+/);
    const labels = ids.map(id => {
      const labelElement = document.getElementById(id);
      return labelElement ? labelElement.textContent : '';
    });
    const name = labels.join(' ').trim();
    if (name) return name;
  }
  
  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel?.trim()) return ariaLabel.trim();
  
  // Check for associated label
  if (element instanceof HTMLInputElement || 
      element instanceof HTMLTextAreaElement || 
      element instanceof HTMLSelectElement) {
      
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label && label.textContent?.trim()) {
        return label.textContent.trim();
      }
    }
    
    // Check for wrapping label
    const parentLabel = element.closest('label');
    if (parentLabel && parentLabel.textContent?.trim()) {
      // Remove the element's value from the label text if needed
      let labelText = parentLabel.textContent.trim();
      if (element.value) {
        labelText = labelText.replace(element.value, '').trim();
      }
      if (labelText) return labelText;
    }
  }
  
  // Alt text for images
  if (element instanceof HTMLImageElement) {
    return element.alt || '';
  }
  
  // Value for inputs like buttons
  if (element instanceof HTMLInputElement) {
    if (element.type === 'button' || element.type === 'submit' || element.type === 'reset') {
      return element.value || '';
    }
  }
  
  // Text content for other elements
  return element.textContent?.trim() || '';
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

/**
 * Get a descriptive string for an image
 */
const getImageDescription = (img: HTMLImageElement): string => {
  const id = img.id ? `#${img.id}` : '';
  const classNames = Array.from(img.classList).map(c => `.${c}`).join('');
  const src = img.src.split('/').pop() || '';
  const alt = img.alt ? ` alt="${img.alt}"` : ' [no alt]';
  
  return `img${id}${classNames} src=".../${src}"${alt}`;
};
