/**
 * Viewport testing utilities for responsive design testing
 */

// Common device viewport sizes
export const viewports = {
  // Mobile devices
  mobileSmall: { width: 320, height: 568 }, // iPhone SE
  mobileMedium: { width: 375, height: 667 }, // iPhone 8
  mobileLarge: { width: 428, height: 926 }, // iPhone 12 Pro Max
  
  // Tablets
  tabletSmall: { width: 768, height: 1024 }, // iPad Mini/iPad
  tabletLarge: { width: 1024, height: 1366 }, // iPad Pro
  
  // Desktops
  laptopSmall: { width: 1280, height: 800 },
  laptopLarge: { width: 1440, height: 900 },
  desktop: { width: 1920, height: 1080 },
  ultrawide: { width: 2560, height: 1440 },
};

// Common breakpoints for responsive design
export const breakpoints = {
  xs: 480, // Extra small screens (mobile phones)
  sm: 768, // Small screens (tablets)
  md: 1024, // Medium screens (small laptops)
  lg: 1280, // Large screens (desktops)
  xl: 1440, // Extra large screens (large desktops)
  xxl: 1920, // Ultra-wide screens
};

/**
 * Sets the viewport size for the current test
 * @param width Viewport width in pixels
 * @param height Viewport height in pixels
 */
export const setViewport = (width: number, height: number): void => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
  
  // Trigger window resize event
  window.dispatchEvent(new Event('resize'));
};

/**
 * Tests a component at different viewport sizes
 * @param callback Function to run tests at each viewport
 * @param options Optional configuration for which viewports to test
 */
export const testResponsiveness = async (
  callback: (size: { width: number; height: number }, breakpointName: string) => Promise<void> | void,
  options?: { 
    only?: ('mobile' | 'tablet' | 'desktop' | 'ultrawide')[],
    custom?: Array<{ name: string, width: number, height: number }> 
  }
): Promise<void> => {
  // Determine which viewport sizes to test
  const sizes: Array<[string, { width: number; height: number }]> = [];
  
  if (!options || !options.only || options.only.includes('mobile')) {
    sizes.push(['mobileSmall', viewports.mobileSmall]);
    sizes.push(['mobileLarge', viewports.mobileLarge]);
  }
  
  if (!options || !options.only || options.only.includes('tablet')) {
    sizes.push(['tabletSmall', viewports.tabletSmall]);
    sizes.push(['tabletLarge', viewports.tabletLarge]);
  }
  
  if (!options || !options.only || options.only.includes('desktop')) {
    sizes.push(['laptopSmall', viewports.laptopSmall]);
    sizes.push(['desktop', viewports.desktop]);
  }
  
  if (!options || !options.only || options.only.includes('ultrawide')) {
    sizes.push(['ultrawide', viewports.ultrawide]);
  }
  
  // Add any custom viewport sizes
  if (options?.custom) {
    options.custom.forEach(custom => {
      sizes.push([custom.name, { width: custom.width, height: custom.height }]);
    });
  }
  
  // Run the tests for each viewport size
  for (const [name, size] of sizes) {
    setViewport(size.width, size.height);
    await callback(size, name);
  }
};

/**
 * Matches media query for the current test
 * @param query Media query string
 * @returns Boolean indicating if the media query matches
 */
export const matchMedia = (query: string): boolean => {
  return window.matchMedia(query).matches;
};

/**
 * Get the current active breakpoint based on viewport width
 * @returns The name of the active breakpoint
 */
export const getActiveBreakpoint = (): string => {
  const width = window.innerWidth;
  
  if (width < breakpoints.xs) return 'xxs';
  if (width < breakpoints.sm) return 'xs';
  if (width < breakpoints.md) return 'sm';
  if (width < breakpoints.lg) return 'md';
  if (width < breakpoints.xl) return 'lg';
  if (width < breakpoints.xxl) return 'xl';
  return 'xxl';
};

/**
 * Simulates a device orientation change
 * @param orientation 'portrait' or 'landscape'
 */
export const setOrientation = (orientation: 'portrait' | 'landscape'): void => {
  const isPortrait = orientation === 'portrait';
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  if ((isPortrait && width > height) || (!isPortrait && height > width)) {
    // Swap dimensions to simulate rotation
    setViewport(height, width);
  }
  
  // Update orientation type
  Object.defineProperty(window.screen, 'orientation', {
    writable: true,
    configurable: true,
    value: {
      type: isPortrait ? 'portrait-primary' : 'landscape-primary',
      angle: isPortrait ? 0 : 90
    }
  });
  
  // Dispatch orientation change event
  window.dispatchEvent(new Event('orientationchange'));
};
