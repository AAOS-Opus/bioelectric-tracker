/**
 * Layout validation utilities for responsive design testing
 */

/**
 * Validates that an element doesn't overflow its container horizontally
 * @param element The element to check
 * @param container The container element (defaults to element's parent)
 * @returns boolean indicating if the element fits within its container
 */
export const validateNoHorizontalOverflow = (
  element: Element, 
  container: Element = element.parentElement!
): boolean => {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  // Check if element exceeds container bounds
  return (
    elementRect.left >= containerRect.left &&
    elementRect.right <= containerRect.right
  );
};

/**
 * Validates minimum tap target size for interactive elements
 * @param element The element to check
 * @param minSize Minimum size in pixels (default: 44px - WCAG recommendation)
 * @returns boolean indicating if the element meets minimum touch target size
 */
export const validateMinimumTapTargetSize = (
  element: Element,
  minSize: number = 44
): boolean => {
  const rect = element.getBoundingClientRect();
  return rect.width >= minSize && rect.height >= minSize;
};

/**
 * Checks if text is readable (minimum font size)
 * @param element Text element to check
 * @param minSize Minimum font size in pixels (default: 12px)
 * @returns boolean indicating if the text meets minimum size requirements
 */
export const validateMinimumTextSize = (
  element: Element,
  minSize: number = 12
): boolean => {
  const computedStyle = window.getComputedStyle(element);
  const fontSize = parseFloat(computedStyle.fontSize);
  return fontSize >= minSize;
};

/**
 * Validates responsive image behavior
 * @param imgElement The image element to check
 * @returns Object with validation results
 */
export const validateResponsiveImage = (imgElement: HTMLImageElement): {
  hasProperAttributes: boolean;
  maintainsAspectRatio: boolean;
  fitsContainer: boolean;
} => {
  const hasProperAttributes = 
    imgElement.hasAttribute('srcset') || 
    imgElement.style.maxWidth === '100%' ||
    imgElement.style.width === '100%';
  
  // Check if image maintains aspect ratio
  const computedStyle = window.getComputedStyle(imgElement);
  const maintainsAspectRatio = 
    computedStyle.objectFit !== 'fill' && 
    computedStyle.objectFit !== 'none';
  
  // Check if image fits in container
  const container = imgElement.parentElement!;
  const fitsContainer = validateNoHorizontalOverflow(imgElement, container);
  
  return {
    hasProperAttributes,
    maintainsAspectRatio,
    fitsContainer
  };
};

/**
 * Checks if a flex container properly wraps items on small screens
 * @param container The flex container element
 * @returns boolean indicating if flex wrapping is properly implemented
 */
export const validateFlexWrapping = (container: Element): boolean => {
  const computedStyle = window.getComputedStyle(container);
  return (
    computedStyle.display === 'flex' && 
    (computedStyle.flexWrap === 'wrap' || computedStyle.flexWrap === 'wrap-reverse')
  );
};

/**
 * Validates grid layout responsiveness
 * @param container The grid container element
 * @returns boolean indicating if the grid layout is responsive
 */
export const validateResponsiveGrid = (container: Element): boolean => {
  const computedStyle = window.getComputedStyle(container);
  
  // Check if it's a grid
  if (computedStyle.display !== 'grid') return false;
  
  // Check for responsive grid properties
  const usesAutoFit = 
    computedStyle.gridTemplateColumns.includes('repeat(auto-fit') ||
    computedStyle.gridTemplateColumns.includes('repeat(auto-fill');
  
  const usesMinMax = computedStyle.gridTemplateColumns.includes('minmax(');
  const usesFractionalUnits = computedStyle.gridTemplateColumns.includes('fr');
  
  return usesAutoFit || usesMinMax || usesFractionalUnits;
};

/**
 * Checks if an element is using relative CSS units
 * @param element Element to check
 * @param properties CSS properties to check (default: width, height, padding, margin)
 * @returns boolean indicating if the element uses relative units
 */
export const validateRelativeUnits = (
  element: Element,
  properties: string[] = ['width', 'height', 'padding', 'margin']
): boolean => {
  const computedStyle = window.getComputedStyle(element);
  
  // Check if any of the properties use relative units
  return properties.some(prop => {
    const value = computedStyle.getPropertyValue(prop);
    return (
      value.includes('%') ||
      value.includes('em') ||
      value.includes('rem') ||
      value.includes('vh') ||
      value.includes('vw') ||
      value.includes('vmin') ||
      value.includes('vmax')
    );
  });
};

/**
 * Validates container max-width for readable line lengths
 * @param container Content container element
 * @param maxWidthPx Maximum recommended width for readability (default: 1200px)
 * @returns boolean indicating if the container respects readable max-width
 */
export const validateReadableMaxWidth = (
  container: Element,
  maxWidthPx: number = 1200
): boolean => {
  const computedStyle = window.getComputedStyle(container);
  const hasMaxWidth = computedStyle.maxWidth !== 'none';
  
  if (!hasMaxWidth) return false;
  
  // If max-width is set in relative units, we'll check the actual computed width
  const actualWidth = container.getBoundingClientRect().width;
  return actualWidth <= maxWidthPx;
};

/**
 * Checks for z-index stacking issues in responsive layouts
 * @param element Element to check
 * @param modalElements Array of elements that should be on top (modals, dropdowns)
 * @returns boolean indicating if z-index hierarchy is correct
 */
export const validateZIndexHierarchy = (
  element: Element,
  modalElements: Element[]
): boolean => {
  const elementZIndex = parseInt(window.getComputedStyle(element).zIndex) || 0;
  
  // Element should have lower z-index than any modal elements
  return modalElements.every(modalEl => {
    const modalZIndex = parseInt(window.getComputedStyle(modalEl).zIndex) || 0;
    return elementZIndex < modalZIndex;
  });
};

/**
 * Validates responsive layout shift metrics (similar to CLS)
 * @param beforeRect Element's bounding rect before resize
 * @param afterRect Element's bounding rect after resize
 * @param viewportHeight Viewport height for normalization
 * @returns Normalized layout shift score (lower is better)
 */
export const calculateLayoutShiftScore = (
  beforeRect: DOMRect,
  afterRect: DOMRect,
  viewportHeight: number
): number => {
  // Calculate impact fraction (how much of the viewport is affected)
  const impactArea = Math.abs(
    (afterRect.width * afterRect.height) - (beforeRect.width * beforeRect.height)
  );
  const viewportArea = window.innerWidth * viewportHeight;
  const impactFraction = impactArea / viewportArea;
  
  // Calculate distance fraction (how far elements moved)
  const moveDistance = Math.sqrt(
    Math.pow(afterRect.left - beforeRect.left, 2) +
    Math.pow(afterRect.top - beforeRect.top, 2)
  );
  const maxDimension = Math.max(window.innerWidth, viewportHeight);
  const distanceFraction = moveDistance / maxDimension;
  
  // Final layout shift score (similar to CLS calculation)
  return impactFraction * distanceFraction;
};
