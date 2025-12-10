/**
 * Dashboard, Widgets, and Media Responsive Tests
 * 
 * This test suite implements steps 6 and 7 of the responsive design audit process
 * focusing on dashboard widgets and media/visualization responsiveness.
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithViewport, mockMatchMedia } from '../../tests/utils/responsive-render';
import { viewports, testResponsiveness, setViewport } from '../../tests/utils/viewport';
import * as layoutValidator from '../../tests/utils/layout-validator';

// Import NotificationCenter which contains dashboard-like elements
// Note: Replace with actual component path if different
import NotificationSettings from '@/components/preferences/NotificationSettings';

describe('Step 6: Dashboard and Widgets Responsiveness', () => {
  beforeEach(() => {
    mockMatchMedia();
    jest.clearAllMocks();
  });

  test('should verify dashboard widgets reflow to prioritize key metrics', async () => {
    // Test how notification widgets reflow at different sizes
    await testResponsiveness(async (size, breakpointName) => {
      renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
        viewport: size 
      });
      
      // Find card/widget elements
      const widgets = document.querySelectorAll('[class*="card"], [class*="widget"]');
      
      widgets.forEach(widget => {
        // Widgets should be contained within viewport width
        expect(layoutValidator.validateNoHorizontalOverflow(widget)).toBe(true);
        
        // Get widget's children to check their visibility
        const controls = widget.querySelectorAll('input, button, [role="switch"]');
        controls.forEach(control => {
          // All controls should remain accessible
          expect(control).toBeVisible();
        });
      });
      
      // On smaller screens, widgets should stack vertically
      if (size.width < 768) {
        // Check if widgets stack properly
        if (widgets.length > 1) {
          const firstWidget = widgets[0];
          const secondWidget = widgets[1];
          
          const firstRect = firstWidget.getBoundingClientRect();
          const secondRect = secondWidget.getBoundingClientRect();
          
          // In vertical stacking, second widget should be below first
          expect(secondRect.top).toBeGreaterThanOrEqual(firstRect.bottom);
        }
      }
    });
  });

  test('should ensure widgets resize while preserving functionality', async () => {
    // Test different sized widgets on desktop vs mobile
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.desktop
    });
    
    // Capture desktop state
    const desktopElements = document.querySelectorAll('[class*="section"], [class*="card"]');
    const desktopMetrics = Array.from(desktopElements).map(el => ({
      id: el.id || el.className,
      width: el.getBoundingClientRect().width,
      height: el.getBoundingClientRect().height
    }));
    
    // Switch to mobile viewport
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.mobileSmall
    });
    
    // Capture mobile state
    const mobileElements = document.querySelectorAll('[class*="section"], [class*="card"]');
    const mobileMetrics = Array.from(mobileElements).map(el => ({
      id: el.id || el.className,
      width: el.getBoundingClientRect().width,
      height: el.getBoundingClientRect().height
    }));
    
    // Verify proportional resizing
    expect(mobileElements.length).toBe(desktopElements.length);
    
    // Mobile elements should have smaller or equal width
    const mobileMaxWidth = Math.max(...mobileMetrics.map(m => m.width));
    const desktopMaxWidth = Math.max(...desktopMetrics.map(m => m.width));
    expect(mobileMaxWidth).toBeLessThanOrEqual(desktopMaxWidth);
    
    // Verify critical toggles remain functional
    const mobileToggle = screen.getByRole('switch', { name: /Enable notifications/i });
    expect(mobileToggle).toBeInTheDocument();
    
    // Toggle should be functional
    fireEvent.click(mobileToggle);
    expect(mobileToggle).toBeChecked();
  });
});

describe('Step 7: Media and Data Visualizations', () => {
  beforeEach(() => {
    mockMatchMedia();
    jest.clearAllMocks();
  });

  test('should validate responsive behavior of images and media', async () => {
    await testResponsiveness(async (size) => {
      renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
        viewport: size 
      });
      
      // Find all images
      const images = document.querySelectorAll('img');
      
      images.forEach(img => {
        // Test responsive image properties
        const imageValidation = layoutValidator.validateResponsiveImage(img);
        
        // Images should maintain aspect ratio
        expect(imageValidation.maintainsAspectRatio).toBe(true);
        
        // Images should fit within container
        expect(imageValidation.fitsContainer).toBe(true);
      });
      
      // Check for responsive handling of icons
      const icons = document.querySelectorAll('svg, [class*="icon"]');
      icons.forEach(icon => {
        const rect = icon.getBoundingClientRect();
        
        // Icons should be reasonably sized
        expect(rect.width).toBeGreaterThan(0);
        expect(rect.height).toBeGreaterThan(0);
        
        // Icons should not overflow their containers
        expect(layoutValidator.validateNoHorizontalOverflow(icon)).toBe(true);
      });
    });
  });

  test('should handle data visualizations responsively', async () => {
    await testResponsiveness(async (size) => {
      renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
        viewport: size 
      });
      
      // Find chart/graph elements
      const charts = document.querySelectorAll('[class*="chart"], [class*="graph"], canvas');
      
      charts.forEach(chart => {
        // Charts should adapt to container width
        expect(layoutValidator.validateNoHorizontalOverflow(chart)).toBe(true);
        
        // Chart containers should use relative sizing
        expect(layoutValidator.validateRelativeUnits(chart)).toBe(true);
      });
      
      // Verify any progress indicators resize appropriately
      const progressElements = document.querySelectorAll('[role="progressbar"], [class*="progress"]');
      progressElements.forEach(progress => {
        // Progress bars should resize with container
        const container = progress.parentElement;
        if (container) {
          const progressRect = progress.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          // Progress bar width should be proportional to container
          expect(progressRect.width / containerRect.width).toBeLessThan(1.05);
        }
      });
    });
  });

  test('should provide simplified visualizations for small screens', async () => {
    // Compare visualization complexity between desktop and mobile
    
    // First check desktop view
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.desktop
    });
    
    // Capture desktop visualization details
    const desktopVisuals = document.querySelectorAll('[class*="chart"], [class*="graph"], canvas, [class*="visualization"]');
    const desktopDetailLevel = Array.from(desktopVisuals).map(el => ({
      id: el.id || el.className,
      childCount: el.childElementCount
    }));
    
    // Switch to mobile view
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.mobileSmall
    });
    
    // Capture mobile visualization details
    const mobileVisuals = document.querySelectorAll('[class*="chart"], [class*="graph"], canvas, [class*="visualization"]');
    const mobileDetailLevel = Array.from(mobileVisuals).map(el => ({
      id: el.id || el.className,
      childCount: el.childElementCount
    }));
    
    // Check if visualizations are simplified or unchanged
    // This test may be skipped if no visualizations are found
    if (desktopVisuals.length > 0 && mobileVisuals.length > 0) {
      // Generally, mobile visualizations should have fewer or equal elements
      const desktopTotalElements = desktopDetailLevel.reduce((sum, item) => sum + item.childCount, 0);
      const mobileTotalElements = mobileDetailLevel.reduce((sum, item) => sum + item.childCount, 0);
      
      // Mobile should have same or fewer visualization elements
      expect(mobileTotalElements).toBeLessThanOrEqual(desktopTotalElements);
    } else {
      console.log('No visualizations found to test simplification');
    }
  });
});
