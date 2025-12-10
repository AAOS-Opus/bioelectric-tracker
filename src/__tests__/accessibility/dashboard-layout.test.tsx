/**
 * Accessibility Testing for DashboardLayout Component
 * 
 * This file implements comprehensive accessibility testing for the DashboardLayout component,
 * checking compliance with WCAG 2.1 AA standards including semantic structure, keyboard
 * accessibility, screen reader compatibility, and more.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { SessionProvider } from 'next-auth/react';
import { runA11yAudit } from '../../tests/utils/a11y-testing';
import { testSemanticStructure, testKeyboardNavigation } from '../../tests/utils/a11y-testing';
import { testImageAccessibility, testAriaAttributes, testLiveRegions, testAccessibleNames } from '../../tests/utils/a11y-screen-reader';
import { testColorContrast } from '../../tests/utils/a11y-color-contrast';
import { testMobileAccessibility, withViewportSize, viewportSizes, testTextResizing } from '../../tests/utils/a11y-mobile';
import { generateAccessibilityReport, generateHtmlReport } from '../../tests/utils/a11y-report';
import fs from 'fs';
import path from 'path';

// Mock Next Auth session
const mockSession = {
  user: { 
    id: "user-123",
    currentPhaseNumber: 2,
    name: "Test User", 
    email: "test@example.com" 
  },
  expires: "1"
};

// Mock child components as needed
jest.mock('../../components/notifications/NotificationCenter', () => {
  return function MockNotificationCenter() {
    return <div data-testid="notification-center">Notification Center</div>;
  };
});

/**
 * Helper function to render the component with all necessary providers
 */
const renderWithProviders = () => {
  return render(
    <SessionProvider session={mockSession}>
      <DashboardLayout>
        <div data-testid="dashboard-content">Dashboard Content</div>
      </DashboardLayout>
    </SessionProvider>
  );
};

describe('DashboardLayout Accessibility Tests', () => {
  // Save reports to a reports directory
  const saveToDisk = process.env.SAVE_REPORTS === 'true';
  const reportsDir = path.join(process.cwd(), 'reports', 'accessibility');
  
  if (saveToDisk && !fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  it('should have no axe violations', async () => {
    const { container } = renderWithProviders();
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should have proper semantic structure', async () => {
    const { container } = renderWithProviders();
    
    // Test semantic structure
    const semanticResults = testSemanticStructure(container as HTMLElement);
    
    expect(semanticResults.hasProperLandmarks).toBe(true);
    expect(semanticResults.missingLandmarks.length).toBe(0);
    expect(semanticResults.hasProperHeadingStructure).toBe(true);
    expect(semanticResults.headingIssues.length).toBe(0);
  });
  
  it('should be keyboard accessible', async () => {
    const { container } = renderWithProviders();
    
    // Find navigation links
    const navLinks = screen.getAllByRole('link');
    expect(navLinks.length).toBeGreaterThan(0);
    
    // Test keyboard navigation
    const keyboardResults = await testKeyboardNavigation(container as HTMLElement);
    expect(keyboardResults.allElementsReachable).toBe(true);
    expect(keyboardResults.focusVisibleOnAll).toBe(true);
    expect(keyboardResults.unnavigableElements.length).toBe(0);
    expect(keyboardResults.noVisibleFocusElements.length).toBe(0);
  });
  
  it('should have proper ARIA attributes and screen reader compatibility', async () => {
    const { container } = renderWithProviders();
    
    // Test ARIA attributes
    const ariaResults = testAriaAttributes(container as HTMLElement);
    expect(ariaResults.ariaAttributesValid).toBe(true);
    expect(ariaResults.ariaRolesValid).toBe(true);
    
    // Test accessible names
    const accessibleNameResults = testAccessibleNames(container as HTMLElement);
    expect(accessibleNameResults.allElementsHaveAccessibleNames).toBe(true);
    
    // Test image accessibility
    const imageResults = testImageAccessibility(container as HTMLElement);
    expect(imageResults.allImagesHaveAlt).toBe(true);
  });
  
  it('should have sufficient color contrast', async () => {
    const { container } = renderWithProviders();
    
    // Test color contrast
    const contrastResults = testColorContrast(container as HTMLElement);
    expect(contrastResults.allElementsPass).toBe(true);
    
    // If there are any failures, they should be for non-essential elements
    const failures = contrastResults.results.filter(r => !r.passes);
    for (const failure of failures) {
      // Check if the failed element is likely decorative (has no text content)
      const isLikelyDecorative = !failure.element.textContent?.trim();
      expect(isLikelyDecorative).toBe(true);
    }
  });
  
  it('should be accessible on mobile devices', async () => {
    // Test at mobile viewport
    await withViewportSize(
      viewportSizes.mobile.width,
      viewportSizes.mobile.height,
      async () => {
        const { container } = renderWithProviders();
        
        // Test mobile accessibility
        const mobileResults = testMobileAccessibility(
          container as HTMLElement,
          viewportSizes.mobile.width,
          viewportSizes.mobile.height
        );
        
        expect(mobileResults.contentOverflowsViewport).toBe(false);
        expect(mobileResults.horizontalScrolling).toBe(false);
        
        // Test mobile menu (if exists)
        const mobileMenuButton = screen.queryByRole('button', { name: /menu/i });
        if (mobileMenuButton) {
          fireEvent.click(mobileMenuButton);
          
          // Wait for mobile menu to appear
          await waitFor(() => {
            const mobileMenu = screen.queryByRole('menu') || 
                              screen.queryByRole('navigation');
            expect(mobileMenu).toBeInTheDocument();
            
            // Test touch targets in mobile menu
            const mobileMenuResults = testMobileAccessibility(
              mobileMenu as HTMLElement,
              viewportSizes.mobile.width,
              viewportSizes.mobile.height
            );
            
            // All touch targets should be large enough
            const insufficientTouchTargets = mobileMenuResults.touchTargetResults.filter(
              r => !r.isLargeEnough
            );
            expect(insufficientTouchTargets.length).toBe(0);
          });
        }
        
        // Test text resizing
        const textResizeIssues = testTextResizing(container as HTMLElement);
        expect(textResizeIssues.length).toBe(0);
      }
    );
  });
  
  it('should handle window resizing correctly', async () => {
    // Test desktop view first
    const { container, rerender } = renderWithProviders();
    
    // Then test tablet view
    await withViewportSize(
      viewportSizes.tablet.width,
      viewportSizes.tablet.height,
      async () => {
        // Force a rerender
        rerender(
          <SessionProvider session={mockSession}>
            <DashboardLayout>
              <div data-testid="dashboard-content">Dashboard Content</div>
            </DashboardLayout>
          </SessionProvider>
        );
        
        // Dispatch resize event
        window.dispatchEvent(new Event('resize'));
        
        // Test accessibility in tablet view
        const tabletResults = testMobileAccessibility(
          container as HTMLElement, 
          viewportSizes.tablet.width,
          viewportSizes.tablet.height
        );
        
        expect(tabletResults.contentOverflowsViewport).toBe(false);
        expect(tabletResults.horizontalScrolling).toBe(false);
      }
    );
    
    // Then test mobile view
    await withViewportSize(
      viewportSizes.mobile.width,
      viewportSizes.mobile.height,
      async () => {
        // Force a rerender
        rerender(
          <SessionProvider session={mockSession}>
            <DashboardLayout>
              <div data-testid="dashboard-content">Dashboard Content</div>
            </DashboardLayout>
          </SessionProvider>
        );
        
        // Dispatch resize event
        window.dispatchEvent(new Event('resize'));
        
        // Test accessibility in mobile view
        const mobileResults = testMobileAccessibility(
          container as HTMLElement,
          viewportSizes.mobile.width, 
          viewportSizes.mobile.height
        );
        
        expect(mobileResults.contentOverflowsViewport).toBe(false);
        expect(mobileResults.horizontalScrolling).toBe(false);
      }
    );
  });
  
  it('should generate a comprehensive accessibility report', async () => {
    const { container } = renderWithProviders();
    
    // Run comprehensive audit
    const auditResults = await runA11yAudit('DashboardLayout');
    
    // Generate and save report
    const report = generateAccessibilityReport(auditResults);
    const htmlReport = generateHtmlReport(report);
    
    if (saveToDisk) {
      fs.writeFileSync(
        path.join(reportsDir, 'dashboard-layout-a11y-report.html'),
        htmlReport
      );
    }
    
    // Test results
    expect(report.component).toBe('DashboardLayout');
    expect(report.violations.length).toBeLessThan(1); // Ideally 0
  });
});
