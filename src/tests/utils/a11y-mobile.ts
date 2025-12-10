/**
 * Mobile and Zoom/Resize Accessibility Testing Utilities
 * 
 * This module provides utilities for testing mobile accessibility and zoom/resize compatibility,
 * ensuring that content remains accessible at different viewport sizes and zoom levels.
 */

/**
 * Viewport sizes for testing
 */
export const viewportSizes = {
  mobile: { width: 375, height: 667 }, // iPhone 8/SE
  tablet: { width: 768, height: 1024 }, // iPad
  desktop: { width: 1280, height: 800 },
  large: { width: 1920, height: 1080 }
};

/**
 * Interface for touch target results
 */
interface TouchTargetResult {
  element: HTMLElement;
  targetType: string; // 'button', 'link', etc.
  rect: DOMRect;
  width: number;
  height: number;
  isLargeEnough: boolean;
  nearbyElements: HTMLElement[];
  hasSufficientSpacing: boolean;
}

/**
 * Interface for viewport test results
 */
export interface ViewportTestResult {
  viewportWidth: number;
  viewportHeight: number;
  contentOverflowsViewport: boolean;
  horizontalScrolling: boolean;
  fixedElementsVisible: boolean;
  overflowingElements: HTMLElement[];
  hiddenContent: HTMLElement[];
  overlappingElements: HTMLElement[];
  smallTextElements: HTMLElement[];
  touchTargetResults: TouchTargetResult[];
  zoomable: boolean;
  resizeIssues: string[];
}

/**
 * Simulate viewport size to test mobile accessibility
 * @param width Viewport width
 * @param height Viewport height
 * @param testFn Function to run at this viewport size
 * @returns Promise that resolves after the test
 */
export const withViewportSize = async <T>(
  width: number,
  height: number,
  testFn: () => Promise<T> | T
): Promise<T> => {
  // Save original viewport size
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;
  
  try {
    // Update viewport meta tag if it exists
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 
        'width=device-width, initial-scale=1, shrink-to-fit=no');
    }
    
    // Mock viewport size
    Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
    
    // Dispatch resize event
    window.dispatchEvent(new Event('resize'));
    
    // Wait for any resize handlers to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Run the test function
    return await testFn();
  } finally {
    // Restore original viewport size
    Object.defineProperty(window, 'innerWidth', { value: originalWidth, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: originalHeight, writable: true });
    
    // Dispatch resize event
    window.dispatchEvent(new Event('resize'));
  }
};

/**
 * Test for mobile accessibility issues
 * @param rootElement Root element to test
 * @param viewportWidth Viewport width to test
 * @param viewportHeight Viewport height to test
 * @returns Test results
 */
export const testMobileAccessibility = (
  rootElement: HTMLElement,
  viewportWidth: number,
  viewportHeight: number
): ViewportTestResult => {
  const result: ViewportTestResult = {
    viewportWidth,
    viewportHeight,
    contentOverflowsViewport: false,
    horizontalScrolling: false,
    fixedElementsVisible: true,
    overflowingElements: [],
    hiddenContent: [],
    overlappingElements: [],
    smallTextElements: [],
    touchTargetResults: [],
    zoomable: true,
    resizeIssues: []
  };
  
  // Check if content overflows viewport
  const bodyRect = document.body.getBoundingClientRect();
  result.contentOverflowsViewport = bodyRect.width > viewportWidth || bodyRect.height > viewportHeight;
  
  // Check for horizontal scrolling
  const htmlEl = document.documentElement;
  result.horizontalScrolling = htmlEl.scrollWidth > htmlEl.clientWidth;
  
  // Find elements that might be causing overflow
  const allElements = Array.from(rootElement.querySelectorAll('*')) as HTMLElement[];
  
  for (const element of allElements) {
    const rect = element.getBoundingClientRect();
    
    // Skip elements with zero dimensions (hidden elements)
    if (rect.width === 0 || rect.height === 0) continue;
    
    // Check for elements that overflow the viewport
    if (rect.right > viewportWidth || rect.bottom > viewportHeight) {
      result.overflowingElements.push(element);
    }
    
    // Check for hidden content (visible in DOM but off-screen)
    if (rect.top < 0 || rect.left < 0 || rect.right > viewportWidth || rect.bottom > viewportHeight) {
      const style = window.getComputedStyle(element);
      const isFixed = style.position === 'fixed';
      
      if (isFixed) {
        // Check if fixed elements are visible
        const isVisible = !(rect.bottom < 0 || 
                          rect.right < 0 || 
                          rect.top > viewportHeight || 
                          rect.left > viewportWidth);
        
        if (!isVisible) {
          result.fixedElementsVisible = false;
          result.hiddenContent.push(element);
        }
      }
    }
    
    // Check for overlapping elements
    for (const otherElement of allElements) {
      if (element === otherElement) continue;
      
      const otherRect = otherElement.getBoundingClientRect();
      
      // Skip elements with zero dimensions
      if (otherRect.width === 0 || otherRect.height === 0) continue;
      
      // Check if elements overlap
      if (rectsOverlap(rect, otherRect)) {
        // Check if the text may be unreadable due to overlap
        const style = window.getComputedStyle(element);
        const otherStyle = window.getComputedStyle(otherElement);
        
        if (style.display !== 'none' && 
            otherStyle.display !== 'none' &&
            element.textContent?.trim() &&
            otherElement.textContent?.trim()) {
          result.overlappingElements.push(element);
          break; // Only add each element once
        }
      }
    }
    
    // Check for small text
    const style = window.getComputedStyle(element);
    const fontSize = parseInt(style.fontSize, 10);
    
    if (element.textContent?.trim() && fontSize < 12) {
      result.smallTextElements.push(element);
    }
  }
  
  // Check touch target sizes
  result.touchTargetResults = checkTouchTargets(rootElement);
  
  // Check zoom compatibility
  result.zoomable = checkZoomCompatibility(rootElement);
  
  // Check for orientation-specific issues
  const orientationIssues = checkOrientationIssues(rootElement);
  if (orientationIssues.length > 0) {
    result.resizeIssues.push(...orientationIssues);
  }
  
  return result;
};

/**
 * Check if two rectangles overlap
 */
const rectsOverlap = (rect1: DOMRect, rect2: DOMRect): boolean => {
  return !(rect1.right < rect2.left || 
           rect1.left > rect2.right || 
           rect1.bottom < rect2.top || 
           rect1.top > rect2.bottom);
};

/**
 * Check touch target sizes
 * WCAG 2.5.5 requires touch targets to be at least 44px × 44px
 */
const checkTouchTargets = (rootElement: HTMLElement): TouchTargetResult[] => {
  const results: TouchTargetResult[] = [];
  
  // Elements that should be tappable
  const touchableSelectors = [
    'a[href]',
    'button',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    '[role="button"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="tab"]',
    '[role="menuitem"]',
    '[role="option"]'
  ];
  
  const touchableElements = Array.from(
    rootElement.querySelectorAll(touchableSelectors.join(','))
  ) as HTMLElement[];
  
  // Minimum size for touch targets
  const MIN_TARGET_SIZE = 44; // 44 × 44 pixels
  const MIN_TARGET_SPACING = 8; // Minimum space between targets
  
  for (const element of touchableElements) {
    const rect = element.getBoundingClientRect();
    
    // Skip elements with zero dimensions or hidden elements
    if (rect.width === 0 || rect.height === 0) continue;
    
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    
    // Determine the element type
    let targetType = element.tagName.toLowerCase();
    if (element.hasAttribute('role')) {
      targetType = element.getAttribute('role') || targetType;
    }
    
    // Check if the target is large enough
    const isLargeEnough = rect.width >= MIN_TARGET_SIZE && rect.height >= MIN_TARGET_SIZE;
    
    // Find nearby elements
    const nearbyElements: HTMLElement[] = [];
    
    for (const otherElement of touchableElements) {
      if (element === otherElement) continue;
      
      const otherRect = otherElement.getBoundingClientRect();
      
      // Skip elements with zero dimensions or hidden elements
      if (otherRect.width === 0 || otherRect.height === 0) continue;
      
      const otherStyle = window.getComputedStyle(otherElement);
      if (otherStyle.display === 'none' || otherStyle.visibility === 'hidden') continue;
      
      // Check if elements are too close to each other
      const horizontalSpacing = Math.min(
        Math.abs(rect.left - otherRect.right),
        Math.abs(otherRect.left - rect.right)
      );
      
      const verticalSpacing = Math.min(
        Math.abs(rect.top - otherRect.bottom),
        Math.abs(otherRect.top - rect.bottom)
      );
      
      if (horizontalSpacing < MIN_TARGET_SPACING && verticalSpacing < MIN_TARGET_SPACING) {
        nearbyElements.push(otherElement);
      }
    }
    
    // Check spacing between targets
    const hasSufficientSpacing = nearbyElements.length === 0;
    
    results.push({
      element,
      targetType,
      rect,
      width: rect.width,
      height: rect.height,
      isLargeEnough,
      nearbyElements,
      hasSufficientSpacing
    });
  }
  
  return results;
};

/**
 * Check if the page is compatible with zooming
 */
const checkZoomCompatibility = (rootElement: HTMLElement): boolean => {
  // Check viewport meta tag
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  
  if (viewportMeta) {
    const content = viewportMeta.getAttribute('content') || '';
    
    // Check for user-scalable=no or maximum-scale=1
    if (content.includes('user-scalable=no') || 
        content.includes('maximum-scale=1') ||
        content.includes('maximum-scale=1.0')) {
      return false;
    }
  }
  
  // Check for CSS that might prevent zooming
  const styleSheets = document.styleSheets;
  
  try {
    for (let i = 0; i < styleSheets.length; i++) {
      const rules = styleSheets[i].cssRules || styleSheets[i].rules;
      
      if (!rules) continue; // Skip if we can't access rules (CORS)
      
      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j] as CSSStyleRule;
        
        if (rule.style && rule.style.zoom === 'reset') {
          return false;
        }
        
        // Check for CSS touch-action manipulation that prevents pinch zoom
        if (rule.style && rule.style.touchAction === 'none') {
          return false;
        }
      }
    }
  } catch (error) {
    // CORS errors when accessing cross-origin stylesheets
    console.error('Error checking stylesheets:', error);
  }
  
  return true;
};

/**
 * Check for orientation-specific issues
 */
const checkOrientationIssues = (rootElement: HTMLElement): string[] => {
  const issues: string[] = [];
  
  // Check for orientation-specific styles
  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      const rules = document.styleSheets[i].cssRules || document.styleSheets[i].rules;
      
      if (!rules) continue; // Skip if we can't access rules (CORS)
      
      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j];
        
        // Check for orientation media queries
        if (rule instanceof CSSMediaRule) {
          const mediaText = rule.media.mediaText.toLowerCase();
          
          if (mediaText.includes('orientation: portrait') || 
              mediaText.includes('orientation: landscape')) {
            
            // Check for display: none in orientation media queries
            for (let k = 0; k < rule.cssRules.length; k++) {
              const styleRule = rule.cssRules[k] as CSSStyleRule;
              
              if (styleRule.style && styleRule.style.display === 'none') {
                issues.push(`Content may be hidden in certain orientations (${mediaText})`);
                break;
              }
            }
          }
        }
      }
    }
  } catch (error) {
    // CORS errors when accessing cross-origin stylesheets
    console.error('Error checking stylesheets:', error);
  }
  
  // Check for locked orientation with JavaScript
  const bodyHTML = document.body.innerHTML;
  if (bodyHTML.includes('screen.orientation.lock') ||
      bodyHTML.includes('lockOrientation') ||
      bodyHTML.includes('orientation.lock')) {
    issues.push('Page may lock orientation, which restricts user choice');
  }
  
  return issues;
};

/**
 * Test how text resizing affects the page
 * @param rootElement Root element to test
 * @param scaleFactor Amount to scale text (1.5 = 150%, 2 = 200%)
 * @returns Issues found during text resizing
 */
export const testTextResizing = (
  rootElement: HTMLElement,
  scaleFactor: number = 2
): string[] => {
  const issues: string[] = [];
  
  // Save original font sizes
  const elements = Array.from(rootElement.querySelectorAll('*')) as HTMLElement[];
  const originalSizes = new Map<HTMLElement, string>();
  
  elements.forEach(element => {
    const style = window.getComputedStyle(element);
    originalSizes.set(element, style.fontSize);
  });
  
  try {
    // Increase text size
    const html = document.documentElement;
    const originalHtmlSize = window.getComputedStyle(html).fontSize;
    
    // Set font size on HTML to scale everything if using rem units
    html.style.fontSize = `${parseFloat(originalHtmlSize) * scaleFactor}px`;
    
    // Force layout recalculation
    rootElement.getBoundingClientRect();
    
    // Check for layout issues
    let textOverflow = false;
    let contentClipped = false;
    
    elements.forEach(element => {
      if (!element.textContent?.trim()) return;
      
      const beforeStyle = window.getComputedStyle(element);
      
      // Skip elements that aren't visible
      if (beforeStyle.display === 'none' || beforeStyle.visibility === 'hidden') return;
      
      // Set larger font size
      const originalSize = originalSizes.get(element) || beforeStyle.fontSize;
      element.style.fontSize = `${parseFloat(originalSize) * scaleFactor}px`;
      
      // Force layout recalculation
      element.getBoundingClientRect();
      
      // Check for overflow and clipping
      const afterStyle = window.getComputedStyle(element);
      
      if (afterStyle.overflow === 'hidden' || 
          afterStyle.textOverflow === 'ellipsis' ||
          afterStyle.whiteSpace === 'nowrap') {
        const rect = element.getBoundingClientRect();
        
        if (element.scrollWidth > rect.width || element.scrollHeight > rect.height) {
          textOverflow = true;
          issues.push(`Text may be clipped when enlarged in element: ${getElementDescription(element)}`);
        }
      }
      
      // Check for clipping in parent containers
      let parent = element.parentElement;
      while (parent && parent !== rootElement) {
        const parentStyle = window.getComputedStyle(parent);
        
        if (parentStyle.overflow === 'hidden') {
          const parentRect = parent.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          
          if (elementRect.bottom > parentRect.bottom || 
              elementRect.right > parentRect.right) {
            contentClipped = true;
            issues.push(`Content may be clipped by parent container when text is enlarged: ${getElementDescription(parent)}`);
            break;
          }
        }
        
        parent = parent.parentElement;
      }
    });
    
    // Record overall issues
    if (textOverflow) {
      issues.push('Text overflow detected when font size is increased');
    }
    
    if (contentClipped) {
      issues.push('Content clipping detected when font size is increased');
    }
  } finally {
    // Restore original styles
    document.documentElement.style.fontSize = '';
    
    elements.forEach(element => {
      element.style.fontSize = '';
    });
  }
  
  return issues;
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
