/**
 * Performance, Orientation Changes, Input Methods, Edge Cases, and Accessibility Tests
 * 
 * This test suite implements steps 8-12 of the responsive design audit process
 * focusing on the final aspects of responsive design testing.
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithViewport, mockMatchMedia } from '../../tests/utils/responsive-render';
import { 
  viewports, 
  testResponsiveness, 
  setOrientation,
  setViewport
} from '../../tests/utils/viewport';
import * as layoutValidator from '../../tests/utils/layout-validator';

// Import components to test
import NotificationSettings from '@/components/preferences/NotificationSettings';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

// Performance metrics tracking
const performanceMetrics = {
  layoutShifts: [] as Array<{viewport: string, score: number}>,
  renderTimes: [] as Array<{viewport: string, time: number}>,
  accessibilityIssues: [] as Array<{viewport: string, issue: string}>
};

describe('Step 8: Performance Across Viewports', () => {
  beforeEach(() => {
    mockMatchMedia();
    jest.clearAllMocks();
    
    // Mock performance APIs if needed
    if (!window.performance) {
      window.performance = {} as Performance;
    }
    if (!window.performance.mark) {
      window.performance.mark = jest.fn();
    }
    if (!window.performance.measure) {
      window.performance.measure = jest.fn();
    }
  });

  test('should measure layout shifts when resizing viewport', async () => {
    // Initial render at desktop size
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.desktop
    });
    
    // Capture initial positions of key elements
    const elements = document.querySelectorAll('h1, h2, h3, button');
    const initialPositions = Array.from(elements).map(el => ({
      element: el,
      rect: el.getBoundingClientRect()
    }));
    
    // Resize to mobile viewport
    setViewport(viewports.mobileSmall.width, viewports.mobileSmall.height);
    
    // Force reflow
    document.body.offsetHeight;
    
    // Measure position changes
    initialPositions.forEach(({ element, rect: initialRect }) => {
      const newRect = element.getBoundingClientRect();
      
      // Calculate layout shift score (lower is better)
      const shiftScore = layoutValidator.calculateLayoutShiftScore(
        initialRect,
        newRect,
        window.innerHeight
      );
      
      performanceMetrics.layoutShifts.push({
        viewport: 'desktop-to-mobile',
        score: shiftScore
      });
      
      // Good responsive designs have controlled layout shifts
      expect(shiftScore).toBeLessThan(0.1);
    });
  });

  test('should optimize image loading based on viewport', async () => {
    await testResponsiveness(async (size, breakpointName) => {
      renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
        viewport: size 
      });
      
      // Find all images
      const images = document.querySelectorAll('img');
      
      if (images.length > 0) {
        images.forEach(img => {
          // Check for responsive image attributes
          const hasResponsiveAttributes = 
            img.hasAttribute('srcset') || 
            img.hasAttribute('sizes') ||
            img.getAttribute('loading') === 'lazy';
          
          // For modern web apps, responsive image features should be used
          // This is a "soft" expectation as not all images need these attributes
          if (!hasResponsiveAttributes) {
            console.warn(`Image without responsive attributes found in ${breakpointName} viewport`);
          }
          
          // Images should be appropriately sized for viewport
          const imgRect = img.getBoundingClientRect();
          if (img.naturalWidth > 0) {
            // Image shouldn't be much larger than displayed size (wasteful)
            const oversizeRatio = img.naturalWidth / imgRect.width;
            
            // Allow up to 2x for high DPI displays, but flag if much higher
            if (oversizeRatio > 3) {
              console.warn(`Potentially oversized image (${oversizeRatio.toFixed(1)}x natural size) in ${breakpointName} viewport`);
            }
          }
        });
      }
    });
  });
});

describe('Step 9: Orientation Changes', () => {
  beforeEach(() => {
    mockMatchMedia();
    jest.clearAllMocks();
  });

  test('should handle portrait to landscape transitions smoothly', async () => {
    // Start with mobile portrait
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.mobileLarge // 428x926
    });
    
    // Track key elements
    const title = screen.getByText('Notification Settings');
    const initialPosition = title.getBoundingClientRect();
    
    // Switch to landscape orientation
    setOrientation('landscape'); // This should swap dimensions to approximately 926x428
    
    // Wait for any animations or transitions
    await waitFor(() => {
      const finalPosition = title.getBoundingClientRect();
      
      // In landscape, the element position should change
      expect(finalPosition).not.toEqual(initialPosition);
      
      // Element should still be visible in viewport
      expect(finalPosition.top < window.innerHeight).toBe(true);
      expect(finalPosition.left < window.innerWidth).toBe(true);
    });
    
    // Verify all controls remain accessible
    const allControls = screen.getAllByRole('switch');
    allControls.forEach(control => {
      expect(control).toBeVisible();
    });
  });

  test('should preserve focus during rotation', async () => {
    // Start with portrait
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.tabletSmall
    });
    
    // Focus an element
    const toggle = screen.getByRole('switch', { name: /Enable notifications/i });
    toggle.focus();
    expect(document.activeElement).toBe(toggle);
    
    // Rotate to landscape
    setOrientation('landscape');
    
    // Focus should be preserved
    await waitFor(() => {
      expect(document.activeElement).toBe(toggle);
    });
  });
});

describe('Step 10: Input Method Flexibility', () => {
  beforeEach(() => {
    mockMatchMedia();
    jest.clearAllMocks();
  });

  test('should support touch gestures where relevant', async () => {
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.mobileLarge
    });
    
    // Test touch interactions on switches
    const switch1 = screen.getByRole('switch', { name: /Enable notifications/i });
    const initialState = switch1.getAttribute('aria-checked') === 'true';
    
    // Simulate touch event
    fireEvent.touchStart(switch1);
    fireEvent.touchEnd(switch1);
    
    // Switch should toggle
    const newState = switch1.getAttribute('aria-checked') === 'true';
    expect(newState).not.toBe(initialState);
    
    // Test sliders if present
    const sliders = document.querySelectorAll('[role="slider"]');
    sliders.forEach(slider => {
      if (slider instanceof HTMLElement) {
        // Test touch interaction on slider
        const initialValue = slider.getAttribute('aria-valuenow');
        
        // Simulate touch slide
        fireEvent.touchStart(slider);
        fireEvent.touchMove(slider);
        fireEvent.touchEnd(slider);
        
        // Value change may be implementation-specific
        // Just verify slider remains interactive
        expect(slider).toBeVisible();
      }
    });
  });

  test('should support keyboard navigation with logical tab order', async () => {
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.desktop
    });
    
    // Start from the beginning of the document
    const firstFocusableElement = document.querySelector('[tabindex="0"], button, [href], input, select, textarea, [role="button"]');
    if (firstFocusableElement instanceof HTMLElement) {
      firstFocusableElement.focus();
    }
    
    // Track tab order
    const tabOrder: Element[] = [];
    let maxTabs = 30; // Prevent infinite loops
    let currentElement = document.activeElement;
    
    while (currentElement && maxTabs > 0) {
      tabOrder.push(currentElement);
      
      // Simulate tab key
      fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
      
      // If we're back at the beginning or focus didn't change, stop
      if (document.activeElement === tabOrder[0] || document.activeElement === currentElement) {
        break;
      }
      
      currentElement = document.activeElement;
      maxTabs--;
    }
    
    // Verify we found interactive elements
    expect(tabOrder.length).toBeGreaterThan(1);
    
    // Verify elements are in logical order (top to bottom, left to right)
    for (let i = 1; i < tabOrder.length; i++) {
      const prevRect = tabOrder[i-1].getBoundingClientRect();
      const currRect = tabOrder[i].getBoundingClientRect();
      
      // Either the current element is below the previous one
      // or it's to the right on the same row
      const isBelow = currRect.top >= prevRect.top;
      const isRightward = currRect.top === prevRect.top && currRect.left >= prevRect.left;
      
      // Allow exceptions for modal content or floating elements
      const isLogical = isBelow || isRightward;
      if (!isLogical) {
        console.log('Potential tab order issue:', {
          prev: tabOrder[i-1],
          curr: tabOrder[i]
        });
      }
    }
  });
});

describe('Step 11: Edge Case Handling', () => {
  beforeEach(() => {
    mockMatchMedia();
    jest.clearAllMocks();
  });

  test('should handle extremely narrow screens', async () => {
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: { width: 280, height: 653 } // Smallest common mobile width
    });
    
    // Verify component renders
    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    
    // Elements should not overflow the narrow viewport
    const allElements = document.querySelectorAll('div, p, button, input');
    allElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      expect(rect.right).toBeLessThanOrEqual(window.innerWidth + 1); // +1 for rounding errors
      
      // Text should not be truncated
      if (el.textContent && el.textContent.length > 0 && window.getComputedStyle(el).overflow === 'hidden') {
        // Check if content likely fits
        const contentWidth = el.scrollWidth;
        const visibleWidth = rect.width;
        
        // Allow slight overflow for padding/margins
        const significantOverflow = contentWidth > visibleWidth * 1.2;
        if (significantOverflow) {
          console.warn('Potential content truncation:', el);
        }
      }
    });
  });

  test('should handle ultra-wide monitors appropriately', async () => {
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: { width: 3440, height: 1440 } // Ultra-wide monitor
    });
    
    // Content should not stretch excessively wide
    const container = screen.getByText('Notification Settings').closest('div');
    if (container) {
      const containerWidth = container.getBoundingClientRect().width;
      
      // Content shouldn't stretch to full ultra-wide width (should be constrained)
      expect(containerWidth).toBeLessThan(window.innerWidth * 0.9);
      
      // Very wide screens should have a reasonable max-width
      expect(containerWidth).toBeLessThan(1600);
    }
  });

  test('should adapt to unusual aspect ratios', async () => {
    // Test with an unusual aspect ratio (like a foldable phone)
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: { width: 717, height: 512 } // Foldable aspect ratio
    });
    
    // Content should still be accessible
    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    
    // All interactive elements should be usable
    const controls = screen.getAllByRole('switch');
    controls.forEach(control => {
      expect(control).toBeVisible();
      
      // Element should be fully visible in viewport
      const rect = control.getBoundingClientRect();
      expect(rect.top >= 0 && rect.bottom <= window.innerHeight).toBe(true);
      expect(rect.left >= 0 && rect.right <= window.innerWidth).toBe(true);
    });
  });
});

describe('Step 12: Accessibility in Responsive Layouts', () => {
  beforeEach(() => {
    mockMatchMedia();
    jest.clearAllMocks();
  });

  test('should maintain layout integrity when text is resized', async () => {
    // Start with normal font size
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.desktop
    });
    
    // Capture initial layout
    const initialElements = Array.from(document.querySelectorAll('div, p, h3, button')).map(el => ({
      id: el.id || el.classList.toString() || el.textContent,
      rect: el.getBoundingClientRect()
    }));
    
    // Simulate increased font size (200%)
    document.documentElement.style.fontSize = '200%';
    
    // Force reflow
    document.body.offsetHeight;
    
    // Verify elements remain visible
    initialElements.forEach(({ id, rect: initialRect }) => {
      // Try to find the element again
      const selector = id ? `[id="${id}"]` : '';
      if (selector) {
        const el = document.querySelector(selector);
        if (el) {
          const newRect = el.getBoundingClientRect();
          
          // Element should still be visible in the document
          expect(newRect.width).toBeGreaterThan(0);
          expect(newRect.height).toBeGreaterThan(0);
          
          // Element should still be at least partially visible
          const isPartiallyVisible = 
            newRect.top < window.innerHeight &&
            newRect.left < window.innerWidth &&
            newRect.right > 0 &&
            newRect.bottom > 0;
          
          expect(isPartiallyVisible).toBe(true);
        }
      }
    });
    
    // Reset font size
    document.documentElement.style.fontSize = '';
  });

  test('should ensure logical focus order when layout changes', async () => {
    // Test focus order in desktop layout
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.desktop
    });
    
    // Collect focusable elements
    const desktopFocusableElements = Array.from(
      document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    );
    
    // Switch to mobile layout
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.mobileSmall
    });
    
    // Collect focusable elements in mobile
    const mobileFocusableElements = Array.from(
      document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    );
    
    // Should have same number of interactive elements
    expect(mobileFocusableElements.length).toBe(desktopFocusableElements.length);
    
    // Simulate tabbing through all elements
    if (mobileFocusableElements.length > 0) {
      let prevTop = -1;
      let currentElement = mobileFocusableElements[0];
      
      for (let i = 0; i < mobileFocusableElements.length; i++) {
        currentElement = mobileFocusableElements[i];
        const rect = currentElement.getBoundingClientRect();
        
        // Focus should generally move from top to bottom
        // (but allow for some flexibility in complex layouts)
        if (i > 0 && rect.top < prevTop - 50) {
          console.warn('Possible focus order issue in mobile layout at element:', currentElement);
        }
        
        prevTop = rect.top;
      }
    }
  });

  test('should verify high contrast settings remain effective', async () => {
    // Mock high contrast mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(forced-colors: active)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }))
    });
    
    // Render in high contrast mode
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.desktop
    });
    
    // All interactive elements should be identifiable without color
    const controls = screen.getAllByRole('switch');
    controls.forEach(control => {
      // Elements should have sufficient borders, outlines, or other non-color indicators
      const style = window.getComputedStyle(control);
      
      const hasNonColorIndicator = 
        style.outline !== 'none' ||
        style.border !== 'none' ||
        style.boxShadow !== 'none' ||
        control.getAttribute('aria-checked') !== null;
      
      expect(hasNonColorIndicator).toBe(true);
    });
  });

  test('should prevent horizontal scrolling when zoomed', async () => {
    // Render at normal zoom
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.mobileSmall
    });
    
    // Simulate zooming (by making viewport appear smaller)
    setViewport(viewports.mobileSmall.width * 0.5, viewports.mobileSmall.height * 0.5);
    
    // Check for horizontal overflow
    const hasHorizontalScroll = 
      document.documentElement.scrollWidth > document.documentElement.clientWidth;
    
    // There should be no horizontal scrollbar
    expect(hasHorizontalScroll).toBe(false);
    
    // All interactive elements should remain accessible when zoomed
    const mainControls = screen.getAllByRole('switch');
    mainControls.forEach(control => {
      const rect = control.getBoundingClientRect();
      
      // Element should be available in the viewport or by scrolling vertically
      const isAccessible = 
        (rect.left >= 0 && rect.right <= window.innerWidth) || 
        (rect.top >= 0 && rect.bottom <= document.documentElement.scrollHeight);
      
      expect(isAccessible).toBe(true);
    });
  });
});
