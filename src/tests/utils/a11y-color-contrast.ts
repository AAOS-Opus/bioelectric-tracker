/**
 * Color Contrast Testing Utilities
 * 
 * This module provides utilities for testing color contrast compliance
 * with WCAG 2.1 AA standards.
 */

/**
 * Color contrast ratio thresholds from WCAG 2.1 AA
 * - Normal text: 4.5:1
 * - Large text (18pt+, or 14pt+ bold): 3:1
 * - UI components and graphical objects: 3:1
 */
const CONTRAST_THRESHOLD_NORMAL = 4.5;
const CONTRAST_THRESHOLD_LARGE = 3;
const CONTRAST_THRESHOLD_UI = 3;

/**
 * Interface for color contrast test results
 */
export interface ColorContrastResult {
  element: HTMLElement;
  foregroundColor: string;
  backgroundColor: string;
  contrastRatio: number;
  required: number;
  passes: boolean;
  fontSize: number;
  isBold: boolean;
  isLargeText: boolean;
}

/**
 * Test color contrast on the page
 * @param rootElement Root element to test
 * @returns Array of contrast test results
 */
export const testColorContrast = (rootElement: HTMLElement): {
  allElementsPass: boolean;
  results: ColorContrastResult[];
} => {
  const textElements = getTextElements(rootElement);
  const uiElements = getUIElements(rootElement);
  const results: ColorContrastResult[] = [];
  
  // Test text elements
  textElements.forEach(element => {
    const result = checkElementContrast(element);
    if (result) {
      results.push(result);
    }
  });
  
  // Test UI elements
  uiElements.forEach(element => {
    const result = checkElementContrast(element, true);
    if (result) {
      results.push(result);
    }
  });
  
  // Check if all results pass
  const allElementsPass = results.every(result => result.passes);
  
  return {
    allElementsPass,
    results
  };
};

/**
 * Get all text elements from the page
 */
const getTextElements = (rootElement: HTMLElement): HTMLElement[] => {
  // Common text elements
  const textSelectors = [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'button', 'label', 'li', 'td', 'th',
    'span', 'div', 'input', 'textarea', 'select',
    'option', 'legend', 'figcaption', 'blockquote',
    'cite', 'code', 'pre', 'small', 'strong', 'em',
    'time', 'address', 'caption'
  ];
  
  // Get elements that actually have text
  const elements: HTMLElement[] = [];
  const allElements = rootElement.querySelectorAll(textSelectors.join(','));
  
  allElements.forEach(element => {
    // Only include elements that have visible text
    if (element.textContent?.trim() && isElementVisible(element as HTMLElement)) {
      elements.push(element as HTMLElement);
    }
  });
  
  return elements;
};

/**
 * Get UI elements from the page
 */
const getUIElements = (rootElement: HTMLElement): HTMLElement[] => {
  // Common UI elements that need 3:1 contrast
  const uiSelectors = [
    'button', 'input', 'select', 'textarea',
    '[role="button"]', '[role="checkbox"]', '[role="radio"]',
    '[role="tab"]', '[role="switch"]', '[role="slider"]',
    '.toggle', '.switch', '.checkbox', '.radio',
    'input[type="checkbox"]', 'input[type="radio"]'
  ];
  
  const elements: HTMLElement[] = [];
  const allElements = rootElement.querySelectorAll(uiSelectors.join(','));
  
  allElements.forEach(element => {
    if (isElementVisible(element as HTMLElement)) {
      elements.push(element as HTMLElement);
    }
  });
  
  return elements;
};

/**
 * Check if an element is visible
 */
const isElementVisible = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         element.offsetWidth > 0 && 
         element.offsetHeight > 0;
};

/**
 * Check color contrast for an element
 */
const checkElementContrast = (
  element: HTMLElement, 
  isUIElement: boolean = false
): ColorContrastResult | null => {
  const styles = window.getComputedStyle(element);
  const foregroundColor = styles.color;
  
  // Skip transparent text
  if (isTransparentColor(foregroundColor)) {
    return null;
  }
  
  // Get the most accurate background color (considering overlapping elements)
  const backgroundColor = getBackgroundColor(element);
  
  // Skip if we couldn't determine a background color
  if (!backgroundColor || isTransparentColor(backgroundColor)) {
    return null;
  }
  
  // Calculate contrast ratio
  const contrastRatio = calculateContrastRatio(
    colorToRGB(foregroundColor),
    colorToRGB(backgroundColor)
  );
  
  const fontSize = parseInt(styles.fontSize, 10);
  const fontWeight = styles.fontWeight;
  const isBold = parseInt(fontWeight, 10) >= 700 || fontWeight === 'bold';
  const isLargeText = (fontSize >= 18) || (fontSize >= 14 && isBold);
  
  // Determine required contrast threshold
  let required = CONTRAST_THRESHOLD_NORMAL;
  if (isUIElement) {
    required = CONTRAST_THRESHOLD_UI;
  } else if (isLargeText) {
    required = CONTRAST_THRESHOLD_LARGE;
  }
  
  return {
    element,
    foregroundColor,
    backgroundColor,
    contrastRatio,
    required,
    passes: contrastRatio >= required,
    fontSize,
    isBold,
    isLargeText
  };
};

/**
 * Get background color considering overlapping elements
 */
const getBackgroundColor = (element: HTMLElement): string | null => {
  let current = element;
  let bgColor: string | null = null;
  
  // Traverse up the DOM until we find an opaque background
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    
    if (style.backgroundColor && !isTransparentColor(style.backgroundColor)) {
      bgColor = style.backgroundColor;
      break;
    }
    
    // If we hit an element with a background image, we can't reliably calculate contrast
    if (style.backgroundImage !== 'none') {
      return null;
    }
    
    current = current.parentElement as HTMLElement;
  }
  
  // If we reached the body without finding a background, use the body's background
  if (!bgColor) {
    const bodyStyle = window.getComputedStyle(document.body);
    bgColor = bodyStyle.backgroundColor;
  }
  
  return bgColor;
};

/**
 * Check if a color is transparent
 */
const isTransparentColor = (color: string): boolean => {
  // Check for 'transparent' keyword
  if (color === 'transparent') return true;
  
  // Check for rgba with 0 alpha
  if (color.startsWith('rgba')) {
    const rgba = color.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d*(?:\.\d+)?)\s*\)/);
    if (rgba && rgba[4] === '0') return true;
  }
  
  return false;
};

/**
 * Convert a CSS color to RGB
 */
const colorToRGB = (color: string): [number, number, number] => {
  if (!color) return [0, 0, 0];
  
  // Handle hex
  if (color.startsWith('#')) {
    return hexToRGB(color);
  }
  
  // Handle rgb/rgba
  if (color.startsWith('rgb')) {
    const rgbValues = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*\d*(?:\.\d+)?)?\s*\)/);
    if (rgbValues) {
      return [
        parseInt(rgbValues[1], 10),
        parseInt(rgbValues[2], 10),
        parseInt(rgbValues[3], 10)
      ];
    }
  }
  
  // Handle named colors (simplified for common ones)
  const namedColors: Record<string, [number, number, number]> = {
    'black': [0, 0, 0],
    'white': [255, 255, 255],
    'red': [255, 0, 0],
    'green': [0, 128, 0],
    'blue': [0, 0, 255],
    'gray': [128, 128, 128],
    'grey': [128, 128, 128]
  };
  
  if (namedColors[color]) {
    return namedColors[color];
  }
  
  // Default to black if color parsing fails
  return [0, 0, 0];
};

/**
 * Convert hex color to RGB
 */
const hexToRGB = (hex: string): [number, number, number] => {
  // Remove the hash at the start if it exists
  hex = hex.replace('#', '');

  // Handle shorthand hex (#RGB)
  if (hex.length === 3) {
    return [
      parseInt(hex[0] + hex[0], 16),
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16)
    ];
  }
  
  // Handle full hex (#RRGGBB)
  return [
    parseInt(hex.substr(0, 2), 16),
    parseInt(hex.substr(2, 2), 16),
    parseInt(hex.substr(4, 2), 16)
  ];
};

/**
 * Calculate relative luminance of an RGB color
 * Formula from: https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
const calculateLuminance = ([r, g, b]: [number, number, number]): number => {
  // Normalize RGB values to 0-1
  const sR = r / 255;
  const sG = g / 255;
  const sB = b / 255;
  
  // Calculate linear RGB values
  const R = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
  const G = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
  const B = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

/**
 * Calculate contrast ratio between two colors
 * Formula from: https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
const calculateContrastRatio = (
  color1: [number, number, number], 
  color2: [number, number, number]
): number => {
  const luminance1 = calculateLuminance(color1);
  const luminance2 = calculateLuminance(color2);
  
  // Ensure the lighter color is first for the formula
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
};
