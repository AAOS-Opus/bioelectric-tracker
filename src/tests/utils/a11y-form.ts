/**
 * Form Accessibility Testing Utilities
 * 
 * This module provides utilities for testing form accessibility,
 * including input labeling, error handling, and focus management.
 */

/**
 * Test form accessibility
 * @param rootElement Root element to test
 * @returns Object with test results
 */
export const testFormAccessibility = (rootElement: HTMLElement): {
  allInputsLabeled: boolean;
  hasErrorHandling: boolean;
  inputsWithoutLabels: string[];
  formIssues: string[];
} => {
  const result = {
    allInputsLabeled: true,
    hasErrorHandling: false,
    inputsWithoutLabels: [] as string[],
    formIssues: [] as string[]
  };

  // Get all forms
  const forms = rootElement.querySelectorAll('form');
  
  if (forms.length === 0) {
    // If no forms, check for inputs outside forms (common in React)
    const standaloneInputs = rootElement.querySelectorAll(
      'input:not([type="hidden"]), select, textarea'
    );
    
    if (standaloneInputs.length > 0) {
      checkInputLabeling(standaloneInputs, result);
      checkErrorHandling(rootElement, result);
    }
  } else {
    // Check each form
    forms.forEach(form => {
      const inputs = form.querySelectorAll(
        'input:not([type="hidden"]), select, textarea'
      );
      
      checkInputLabeling(inputs, result);
      checkErrorHandling(form, result);
      
      // Additional form checks
      if (!form.hasAttribute('novalidate') && !form.querySelector('[aria-required="true"], [required]')) {
        result.formIssues.push(
          `Form ${getFormDescription(form)} doesn't have any required fields marked`
        );
      }
      
      // Check submit buttons
      const submitButton = form.querySelector(
        'button[type="submit"], input[type="submit"]'
      );
      
      if (!submitButton) {
        result.formIssues.push(
          `Form ${getFormDescription(form)} doesn't have a submit button`
        );
      }
    });
  }

  return result;
};

/**
 * Check if inputs have proper labeling
 */
const checkInputLabeling = (
  inputs: NodeListOf<Element>,
  result: {
    allInputsLabeled: boolean;
    inputsWithoutLabels: string[];
  }
) => {
  inputs.forEach(input => {
    const hasLabel = hasAccessibleLabel(input as HTMLElement);
    
    if (!hasLabel) {
      result.allInputsLabeled = false;
      result.inputsWithoutLabels.push(getElementDescription(input));
    }
  });
};

/**
 * Check if element has an accessible label
 */
const hasAccessibleLabel = (element: HTMLElement): boolean => {
  // Check aria-labelledby
  if (element.hasAttribute('aria-labelledby')) {
    const labelledby = element.getAttribute('aria-labelledby');
    if (labelledby) {
      const ids = labelledby.split(/\s+/);
      for (const id of ids) {
        const labelElement = document.getElementById(id);
        if (labelElement && labelElement.textContent?.trim()) {
          return true;
        }
      }
    }
  }
  
  // Check aria-label
  if (element.hasAttribute('aria-label')) {
    return !!element.getAttribute('aria-label')?.trim();
  }
  
  // Check explicit <label> with for attribute
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label && label.textContent?.trim()) {
      return true;
    }
  }
  
  // Check implicit <label> (input inside label)
  const parentLabel = element.closest('label');
  if (parentLabel && parentLabel.textContent?.trim()) {
    return true;
  }
  
  // Special cases for specific input types
  if (element instanceof HTMLInputElement) {
    // Buttons have their value or text as their label
    if (element.type === 'button' || element.type === 'submit' || element.type === 'reset') {
      return !!element.value?.trim();
    }
    
    // Image inputs should have alt text
    if (element.type === 'image') {
      return !!element.alt?.trim();
    }
    
    // Checkboxes and radios might have sibling text
    if (element.type === 'checkbox' || element.type === 'radio') {
      // Check next sibling for text
      let sibling = element.nextSibling;
      while (sibling) {
        if (sibling.nodeType === Node.TEXT_NODE && sibling.textContent?.trim()) {
          return true;
        }
        if (sibling.nodeType === Node.ELEMENT_NODE && 
            (sibling as HTMLElement).textContent?.trim()) {
          return true;
        }
        sibling = sibling.nextSibling;
      }
    }
  }
  
  // Check for placeholder (not recommended as the only label, but better than nothing)
  if (element.hasAttribute('placeholder')) {
    return !!element.getAttribute('placeholder')?.trim();
  }
  
  return false;
};

/**
 * Check form error handling
 */
const checkErrorHandling = (
  container: Element | ParentNode,
  result: {
    hasErrorHandling: boolean;
    formIssues: string[];
  }
) => {
  // Look for common error patterns
  const errorElements = container.querySelectorAll(
    '.error, .invalid, [aria-invalid="true"], [aria-errormessage], ' +
    '[role="alert"], .alert-danger, .text-danger, .has-error'
  );
  
  if (errorElements.length > 0) {
    result.hasErrorHandling = true;
    
    // Check for proper aria attributes
    errorElements.forEach(element => {
      // If the element is likely showing an error
      if (
        element.classList.contains('error') || 
        element.classList.contains('invalid') ||
        element.classList.contains('alert-danger') ||
        element.classList.contains('text-danger')
      ) {
        // Check if it has proper ARIA attributes
        if (
          !element.hasAttribute('role') && 
          !element.hasAttribute('aria-live') &&
          !element.closest('[role="alert"]') &&
          !element.closest('[aria-live]')
        ) {
          result.formIssues.push(
            `Error element ${getElementDescription(element)} should use ARIA attributes for screen readers`
          );
        }
      }
      
      // Check if aria-invalid is used but no explanation is provided
      if (
        element.hasAttribute('aria-invalid') && 
        element.getAttribute('aria-invalid') === 'true'
      ) {
        if (
          !element.hasAttribute('aria-errormessage') && 
          !element.hasAttribute('aria-describedby')
        ) {
          result.formIssues.push(
            `Element ${getElementDescription(element)} has aria-invalid="true" but no aria-errormessage or aria-describedby`
          );
        }
      }
    });
  } else {
    // Look for required inputs, which should have error handling
    const requiredInputs = container.querySelectorAll('[required], [aria-required="true"]');
    
    if (requiredInputs.length > 0) {
      result.formIssues.push(
        'Form has required fields but no visible error handling mechanisms'
      );
    }
  }
};

/**
 * Test form submission keyboard accessibility
 * @param form Form element to test
 * @returns Whether the form is keyboard accessible
 */
export const testFormKeyboardAccessibility = (form: HTMLFormElement): boolean => {
  // Check if enter key works on inputs
  const inputs = form.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="reset"])');
  
  // There should be a submit button
  const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
  
  // If there's no submit button, the form can't be submitted via keyboard
  if (!submitButton) {
    return false;
  }
  
  return true;
};

/**
 * Test field group associations
 * @param rootElement Root element to test
 * @returns Object with test results
 */
export const testFieldGroups = (rootElement: HTMLElement): {
  hasProperFieldGroups: boolean;
  fieldGroupIssues: string[];
} => {
  const result = {
    hasProperFieldGroups: true,
    fieldGroupIssues: [] as string[]
  };

  // Check fieldsets and legends
  const fieldsets = rootElement.querySelectorAll('fieldset');
  
  if (fieldsets.length > 0) {
    fieldsets.forEach(fieldset => {
      const legend = fieldset.querySelector('legend');
      
      if (!legend || !legend.textContent?.trim()) {
        result.hasProperFieldGroups = false;
        result.fieldGroupIssues.push(
          `Fieldset ${getElementDescription(fieldset)} is missing a legend or has an empty legend`
        );
      }
    });
  }
  
  // Check for potential field groups without proper grouping
  const radios = rootElement.querySelectorAll('input[type="radio"]');
  const radioGroups = new Map<string, HTMLInputElement[]>();
  
  // Group radios by name
  radios.forEach(radio => {
    const name = radio.getAttribute('name');
    if (name) {
      if (!radioGroups.has(name)) {
        radioGroups.set(name, []);
      }
      radioGroups.get(name)?.push(radio as HTMLInputElement);
    }
  });
  
  // Check each radio group
  radioGroups.forEach((radios, name) => {
    // Skip single radio buttons
    if (radios.length <= 1) return;
    
    // Check if the group is inside a fieldset with a legend
    const inFieldset = radios.some(radio => radio.closest('fieldset')?.querySelector('legend'));
    
    // Check if the group has an ARIA grouping
    const hasAriaGroup = radios.some(radio => {
      const container = radio.closest('[role="radiogroup"], [role="group"]');
      return container && !!container.getAttribute('aria-labelledby');
    });
    
    if (!inFieldset && !hasAriaGroup) {
      result.hasProperFieldGroups = false;
      result.fieldGroupIssues.push(
        `Radio group "${name}" is not properly grouped with fieldset+legend or aria attributes`
      );
    }
  });

  return result;
};

/**
 * Get a descriptive string for an element
 */
const getElementDescription = (element: Element): string => {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const classNames = Array.from(element.classList).map(c => `.${c}`).join('');
  const nameAttr = element.getAttribute('name') ? `[name="${element.getAttribute('name')}"]` : '';
  const type = element.getAttribute('type') ? `[type="${element.getAttribute('type')}"]` : '';
  
  const text = element.textContent?.trim().substring(0, 20);
  const textPreview = text ? ` "${text}${text.length > 20 ? '...' : ''}"` : '';
  
  return `${tag}${id}${classNames}${nameAttr}${type}${textPreview}`;
};

/**
 * Get a descriptive string for a form
 */
const getFormDescription = (form: Element): string => {
  const id = form.id ? `#${form.id}` : '';
  const classNames = Array.from(form.classList).map(c => `.${c}`).join('');
  const action = form.getAttribute('action') ? `[action="${form.getAttribute('action')}"]` : '';
  
  return `form${id}${classNames}${action}`;
};
