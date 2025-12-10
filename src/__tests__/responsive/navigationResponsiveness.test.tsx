/**
 * Navigation and Interactive Elements Responsive Tests
 * 
 * This test suite implements steps 3, 4, and 5 of the responsive design audit process
 * focusing on navigation adaptability, content prioritization, and interactive elements.
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithViewport, mockMatchMedia } from '../../tests/utils/responsive-render';
import { viewports, testResponsiveness, setViewport } from '../../tests/utils/viewport';
import * as layoutValidator from '../../tests/utils/layout-validator';

// Import components to test
import NotificationSettings from '@/components/preferences/NotificationSettings';

describe('Step 3: Navigation Responsiveness', () => {
  beforeEach(() => {
    mockMatchMedia();
    jest.clearAllMocks();
  });

  test('should adapt navigation based on viewport size', async () => {
    // Test the main layout's navigation adaptation
    await testResponsiveness(async (size, breakpointName) => {
      // In a full app test, we would render the app's main layout here
      // For this focused test, we'll check the notification settings component's navigation
      renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
        viewport: size 
      });
      
      // Check for any hamburger menu or collapsible sections on mobile
      if (size.width < 768) {
        // Look for expandable/collapsible sections in mobile view
        const collapsibleSections = document.querySelectorAll('[aria-expanded]');
        
        // If collapsible sections exist, they should be usable on mobile
        collapsibleSections.forEach(section => {
          const isExpanded = section.getAttribute('aria-expanded') === 'true';
          
          // Verify that clicking toggles the expanded state
          if (section instanceof HTMLElement) {
            fireEvent.click(section);
            
            // Check that aria-expanded attribute changed
            const newExpandedState = section.getAttribute('aria-expanded') === 'true';
            expect(newExpandedState).not.toBe(isExpanded);
          }
        });
      }
      
      // All navigation elements should be easily tappable
      const navElements = document.querySelectorAll('button, a, [role="tab"]');
      navElements.forEach(element => {
        const hasSufficientTapSize = layoutValidator.validateMinimumTapTargetSize(element, 44);
        
        // On mobile, strict adherence to 44px minimum
        if (size.width < 768) {
          expect(hasSufficientTapSize).toBe(true);
        } else {
          // On desktop, we might have smaller controls, but they should still be usable
          const rect = element.getBoundingClientRect();
          expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(24);
        }
      });
    });
  });
});

describe('Step 4: Content Prioritization', () => {
  beforeEach(() => {
    mockMatchMedia();
    jest.clearAllMocks();
  });

  test('should prioritize critical content on small screens', async () => {
    // First check mobile view
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.mobileSmall
    });
    
    // Critical controls should be immediately visible without scrolling
    const criticalElements = [
      screen.getByText('Notification Settings'),
      screen.getByRole('switch', { name: /Enable notifications/i })
    ];
    
    criticalElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      
      // Element should be within the initial viewport (no scrolling needed)
      expect(rect.top).toBeLessThan(window.innerHeight);
      expect(rect.left).toBeGreaterThanOrEqual(0);
      expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
    });
    
    // Check desktop for comparison
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.desktop
    });
    
    // On desktop, more content should be visible simultaneously
    const settingsGroups = screen.getAllByRole('heading', { level: 3 });
    expect(settingsGroups.length).toBeGreaterThan(0);
    
    // Calculate how many sections are visible without scrolling
    const visibleSections = settingsGroups.filter(heading => {
      const rect = heading.getBoundingClientRect();
      return rect.top < window.innerHeight;
    });
    
    // Desktop should show more sections without scrolling than mobile
    expect(visibleSections.length).toBeGreaterThan(1);
  });
  
  test('should reorder content appropriately on small screens', async () => {
    // Compare layout order between mobile and desktop
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.mobileSmall
    });
    
    // Capture element positions in mobile view
    const mobileElementPositions = Array.from(document.querySelectorAll('h3, button'))
      .map(el => ({ 
        text: el.textContent, 
        top: el.getBoundingClientRect().top 
      }));
    
    // Switch to desktop view
    renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
      viewport: viewports.desktop
    });
    
    // Capture element positions in desktop view
    const desktopElementPositions = Array.from(document.querySelectorAll('h3, button'))
      .map(el => ({ 
        text: el.textContent, 
        top: el.getBoundingClientRect().top 
      }));
    
    // Verify that critical content (like main toggles) stays in similar relative position
    // but secondary content might be reorganized for better desktop layout
    
    // Main title should be at the top in both views
    const mobileTitlePos = mobileElementPositions.find(p => p.text?.includes('Notification Settings'))?.top;
    const desktopTitlePos = desktopElementPositions.find(p => p.text?.includes('Notification Settings'))?.top;
    
    if (mobileTitlePos !== undefined && desktopTitlePos !== undefined) {
      expect(mobileTitlePos < 100).toBe(true);
      expect(desktopTitlePos < 100).toBe(true);
    }
    
    // Action buttons should be accessible in both views
    const mobileApplyButton = mobileElementPositions.find(p => p.text?.includes('Apply Changes'));
    const desktopApplyButton = desktopElementPositions.find(p => p.text?.includes('Apply Changes'));
    
    expect(mobileApplyButton).toBeDefined();
    expect(desktopApplyButton).toBeDefined();
  });
});

describe('Step 5: Interactive Elements Scaling', () => {
  beforeEach(() => {
    mockMatchMedia();
    jest.clearAllMocks();
  });

  test('should maintain minimum touch target sizes across viewports', async () => {
    await testResponsiveness(async (size) => {
      renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
        viewport: size 
      });
      
      // Get all interactive elements
      const interactiveElements = [
        ...Array.from(screen.getAllByRole('switch')),
        ...Array.from(screen.getAllByRole('button'))
      ];
      
      // Small screens should maintain minimum touch target sizes
      if (size.width < 768) {
        interactiveElements.forEach(element => {
          const rect = element.getBoundingClientRect();
          
          // 44px is the recommended minimum for touch targets
          const minimumSize = 44;
          
          // For odd-shaped controls, verify they have sufficient area
          const area = rect.width * rect.height;
          const minimumArea = minimumSize * minimumSize;
          
          // Check either dimension meets minimum or area is sufficient
          expect(
            rect.width >= minimumSize || 
            rect.height >= minimumSize ||
            area >= minimumArea
          ).toBe(true);
        });
      }
    });
  });
  
  test('should adjust input fields appropriately for each viewport', async () => {
    await testResponsiveness(async (size) => {
      renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
        viewport: size 
      });
      
      // Find all input elements
      const inputs = Array.from(document.querySelectorAll('input'));
      
      inputs.forEach(input => {
        // All inputs should be fully visible
        expect(layoutValidator.validateNoHorizontalOverflow(input)).toBe(true);
        
        // Inputs should have at least 32px height for comfortable interaction
        const rect = input.getBoundingClientRect();
        expect(rect.height).toBeGreaterThanOrEqual(32);
        
        // Input width should adapt to container
        const container = input.closest('div, form');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          
          // Input shouldn't exceed container width
          expect(rect.width).toBeLessThanOrEqual(containerRect.width);
          
          // On smaller screens, inputs should maximize available width
          if (size.width < 768) {
            expect(rect.width / containerRect.width).toBeGreaterThan(0.5);
          }
        }
      });
    });
  });
  
  test('modal and popover elements should resize properly', async () => {
    // Test modals and popovers at different viewport sizes
    await testResponsiveness(async (size) => {
      renderWithViewport(<NotificationSettings onSettingChange={jest.fn()} />, { 
        viewport: size 
      });
      
      // Find any modal/dialog components
      const modals = document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="popup"]');
      
      modals.forEach(modal => {
        // Modals should resize to fit viewport
        const rect = modal.getBoundingClientRect();
        
        // Modal shouldn't exceed viewport width
        expect(rect.width).toBeLessThanOrEqual(window.innerWidth);
        
        // On mobile, modals should take most of the width
        if (size.width < 768) {
          expect(rect.width / window.innerWidth).toBeGreaterThan(0.8);
        } else {
          // On desktop, modals should be reasonably constrained
          expect(rect.width / window.innerWidth).toBeLessThan(0.9);
        }
      });
    });
  });
});
