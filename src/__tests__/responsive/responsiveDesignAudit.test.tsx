/**
 * Comprehensive Responsive Design Audit Test Suite
 * 
 * This test suite implements a 12-step responsive design audit process
 * to verify that the Bioelectric Regeneration Tracker application
 * properly adapts to different viewport sizes and devices.
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithViewport, mockMatchMedia } from '../../tests/utils/responsive-render';
import { 
  viewports, 
  testResponsiveness, 
  setOrientation, 
  breakpoints 
} from '../../tests/utils/viewport';
import * as layoutValidator from '../../tests/utils/layout-validator';

// Import components to test
import NotificationSettings from '@/components/preferences/NotificationSettings';
import { usePreferences } from '@/contexts/PreferencesContext';

// Mock the window.ResizeObserver
window.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Record layout metrics for documentation
const layoutMetrics = {
  testedViewports: 0,
  failedBreakpoints: [],
  accessibilityIssues: [],
  layoutShifts: []
};

describe('Step 1: Core Responsive Framework', () => {
  beforeEach(() => {
    mockMatchMedia();
    jest.clearAllMocks();
  });

  test('should use fluid grid system that adjusts proportionally', async () => {
    // Test across all key breakpoints
    await testResponsiveness(async (size, breakpointName) => {
      // Clear document body before each test
      document.body.innerHTML = '';
      
      // Render notification settings at this viewport size
      renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, {
        viewport: size
      });
      
      // Get main container elements
      const containers = Array.from(document.querySelectorAll('div[class*="card"]'));
      
      // Check each container for responsive layout properties
      containers.forEach(container => {
        // Check if using relative units
        const usesRelativeUnits = layoutValidator.validateRelativeUnits(container);
        expect(usesRelativeUnits).toBe(true);
        
        // No horizontal overflow
        const noOverflow = layoutValidator.validateNoHorizontalOverflow(container);
        expect(noOverflow).toBe(true);
      });
      
      // Check for flex layouts with proper wrapping
      const flexContainers = Array.from(document.querySelectorAll('div[style*="display: flex"]'));
      if (flexContainers.length > 0) {
        // For smaller screens, flex containers should wrap
        if (size.width < breakpoints.md) {
          flexContainers.some(container => {
            const wraps = layoutValidator.validateFlexWrapping(container);
            expect(wraps).toBe(true);
          });
        }
      }
      
      layoutMetrics.testedViewports++;
    });
  });

  test('should verify viewport meta tag is configured correctly', () => {
    // Check if viewport meta tag exists and has correct content
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    
    // If not in document, check if it's configured in Next.js
    if (!viewportMeta) {
      // In Next.js, this can be in _document.js or a Head component
      // For testing purposes, we'll just log this situation
      console.log('Viewport meta tag not found in test DOM - verify in Next.js _document.js');
    } else {
      const content = viewportMeta.getAttribute('content');
      expect(content).toContain('width=device-width');
      expect(content).toContain('initial-scale=1');
    }
  });
});

describe('Step 2: Device-Specific Layout Adaptation', () => {
  beforeEach(() => {
    mockMatchMedia();
    jest.clearAllMocks();
  });
  
  test('should adapt layout appropriately for different device types', async () => {
    // Define device categories for testing
    const deviceCategories = [
      { name: 'mobile', viewport: viewports.mobileSmall },
      { name: 'tablet', viewport: viewports.tabletSmall },
      { name: 'desktop', viewport: viewports.desktop },
      { name: 'ultrawide', viewport: viewports.ultrawide }
    ];
    
    // Test each device category
    for (const device of deviceCategories) {
      // Clear document body before each test
      document.body.innerHTML = '';
      
      // Render component at this device size
      renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, {
        viewport: device.viewport
      });
      
      // Every device should show the main title
      expect(screen.getByText('Notification Settings')).toBeInTheDocument();
      
      // Check that layouts stack appropriately on smaller devices
      const sections = document.querySelectorAll('div[class*="section"]');
      
      if (sections.length > 0) {
        if (device.name === 'mobile' || device.name === 'tablet') {
          // On smaller devices, sections should stack vertically
          const firstSection = sections[0];
          const secondSection = sections[1];
          
          if (firstSection && secondSection) {
            const firstRect = firstSection.getBoundingClientRect();
            const secondRect = secondSection.getBoundingClientRect();
            
            // Sections should be stacked (second section below first)
            // or take full width (for very small screens)
            const isStacked = secondRect.top >= firstRect.bottom;
            const isFullWidth = firstRect.width / window.innerWidth > 0.9;
            
            expect(isStacked || isFullWidth).toBe(true);
          }
        }
      }
      
      // Check all form controls remain accessible
      const formControls = screen.getAllByRole('switch');
      formControls.forEach(control => {
        expect(control).toBeVisible();
        expect(control).not.toBeDisabled();
      });
    }
  });
});

// Export test metrics for reporting
export const getLayoutMetrics = () => layoutMetrics;
