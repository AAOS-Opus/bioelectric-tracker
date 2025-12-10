/**
 * Accessibility Testing for NotificationCenter Component
 * 
 * This file implements comprehensive accessibility testing for the NotificationCenter component,
 * checking compliance with WCAG 2.1 AA standards including semantic structure, keyboard
 * accessibility, screen reader compatibility, and more.
 */

import React from 'react';
import { render, screen, within, fireEvent, waitFor, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import NotificationCenter from '../../components/notifications/NotificationCenter';
import { SessionProvider } from 'next-auth/react';
import { runA11yAudit } from '../../tests/utils/a11y-testing';
import { testSemanticStructure, testKeyboardNavigation } from '../../tests/utils/a11y-testing';
import { testImageAccessibility, testAriaAttributes, testLiveRegions, testAccessibleNames } from '../../tests/utils/a11y-screen-reader';
import { testColorContrast } from '../../tests/utils/a11y-color-contrast';
import { testFormAccessibility } from '../../tests/utils/a11y-form';
import { testDynamicContent } from '../../tests/utils/a11y-dynamic-content';
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

/**
 * Helper function to render the component with all necessary providers
 */
const renderWithProviders = () => {
  return render(
    <SessionProvider session={mockSession}>
      <NotificationCenter />
    </SessionProvider>
  );
};

// Mock fetch API for notifications
global.fetch = jest.fn().mockImplementation((url) => {
  if (url === '/api/notifications') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        {
          _id: "1",
          type: "daily_reminder",
          title: "Take your supplements",
          message: "Remember to take your daily supplements at 8:00 AM",
          status: "sent",
          priority: "medium",
          category: "protocol",
          scheduledFor: "2023-07-15T08:00:00Z",
          sentAt: "2023-07-15T08:00:00Z",
          metadata: {
            phaseNumber: 1,
            actionRequired: true
          }
        },
        {
          _id: "2",
          type: "modality_alert",
          title: "Frequency Therapy Session",
          message: "Your frequency therapy session is scheduled for 3:00 PM today",
          status: "sent",
          priority: "high",
          category: "device",
          scheduledFor: "2023-07-15T15:00:00Z",
          sentAt: "2023-07-15T14:00:00Z",
          metadata: {
            modalityId: "freq-therapy-1",
            actionRequired: true
          }
        },
        {
          _id: "3",
          type: "weekly_report",
          title: "Weekly Progress Report",
          message: "Your weekly progress report is now available. View your biomarkers and protocol adherence.",
          status: "read",
          priority: "low",
          category: "progress",
          scheduledFor: "2023-07-14T09:00:00Z",
          sentAt: "2023-07-14T09:00:00Z",
          readAt: "2023-07-14T10:30:00Z",
          metadata: {
            reportUrl: "/reports/weekly/2023-07-14",
            actionRequired: false
          }
        }
      ])
    });
  } else if (url.startsWith('/api/notifications/') && url.endsWith('/read')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  }
  return Promise.reject(new Error(`Unhandled fetch request: ${url}`));
});

describe('NotificationCenter Accessibility Tests', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Save reports to a reports directory
  const saveToDisk = process.env.SAVE_REPORTS === 'true';
  const reportsDir = path.join(process.cwd(), 'reports', 'accessibility');
  
  if (saveToDisk && !fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  it('should have no axe violations', async () => {
    const { container } = renderWithProviders();
    
    // Wait for notifications to load
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    
    // Open notification panel
    const bellButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellButton);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should have proper semantic structure', async () => {
    const { container } = renderWithProviders();
    
    // Wait for notifications to load
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    
    // Open notification panel
    const bellButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellButton);
    
    const notificationPanel = screen.getByRole('dialog', { name: /notifications panel/i });
    const semanticResults = testSemanticStructure(notificationPanel);
    
    expect(semanticResults.hasProperHeadingStructure).toBe(true);
    expect(semanticResults.headingIssues.length).toBe(0);
  });
  
  it('should be keyboard accessible', async () => {
    const { container } = renderWithProviders();
    
    // Wait for notifications to load
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    
    // Test initial bell button keyboard accessibility
    const bellButton = screen.getByRole('button', { name: /notifications/i });
    bellButton.focus();
    fireEvent.keyDown(bellButton, { key: 'Enter' });
    
    // Check if the panel opened
    const notificationPanel = screen.getByRole('dialog', { name: /notifications panel/i });
    expect(notificationPanel).toBeInTheDocument();
    
    // Test keyboard navigation
    const keyboardResults = await testKeyboardNavigation(notificationPanel);
    expect(keyboardResults.allElementsReachable).toBe(true);
    expect(keyboardResults.focusVisibleOnAll).toBe(true);
    
    // Test escape key closes panel
    fireEvent.keyDown(notificationPanel, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
  
  it('should have proper ARIA attributes and screen reader compatibility', async () => {
    const { container } = renderWithProviders();
    
    // Wait for notifications to load
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    
    // Open notification panel
    const bellButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellButton);
    
    const notificationPanel = screen.getByRole('dialog', { name: /notifications panel/i });
    
    // Test ARIA attributes
    const ariaResults = testAriaAttributes(notificationPanel);
    expect(ariaResults.ariaAttributesValid).toBe(true);
    expect(ariaResults.ariaRolesValid).toBe(true);
    
    // Test accessible names
    const accessibleNameResults = testAccessibleNames(notificationPanel);
    expect(accessibleNameResults.allElementsHaveAccessibleNames).toBe(true);
    
    // Test live regions
    const liveRegionResults = testLiveRegions(notificationPanel);
    // NotificationCenter should have live regions for updates
    expect(liveRegionResults.hasProperAriaLive).toBe(true);
  });
  
  it('should have sufficient color contrast', async () => {
    const { container } = renderWithProviders();
    
    // Wait for notifications to load
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    
    // Open notification panel
    const bellButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellButton);
    
    const notificationPanel = screen.getByRole('dialog', { name: /notifications panel/i });
    
    // Test color contrast
    const contrastResults = testColorContrast(notificationPanel);
    expect(contrastResults.allElementsPass).toBe(true);
  });
  
  it('should handle dynamic content accessibly', async () => {
    const { container } = renderWithProviders();
    
    // Wait for notifications to load
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    
    // Test the dynamic content (notification bell with count)
    const dynamicResults = await testDynamicContent(container as HTMLElement);
    expect(dynamicResults.allDynamicContentAccessible).toBe(true);
    
    // Open notification panel
    const bellButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellButton);
    
    // Test the dynamic content (notification panel)
    const panelDynamicResults = await testDynamicContent(container as HTMLElement);
    expect(panelDynamicResults.allDynamicContentAccessible).toBe(true);
  });
  
  it('should be accessible on mobile devices', async () => {
    // Test at mobile viewport
    await withViewportSize(
      viewportSizes.mobile.width,
      viewportSizes.mobile.height,
      async () => {
        const { container } = renderWithProviders();
        
        // Wait for notifications to load
        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
        
        // Test mobile accessibility
        const mobileResults = testMobileAccessibility(
          container as HTMLElement,
          viewportSizes.mobile.width,
          viewportSizes.mobile.height
        );
        
        expect(mobileResults.contentOverflowsViewport).toBe(false);
        expect(mobileResults.horizontalScrolling).toBe(false);
        
        // Open notification panel
        const bellButton = screen.getByRole('button', { name: /notifications/i });
        fireEvent.click(bellButton);
        
        // Check touch targets
        const notificationPanel = screen.getByRole('dialog', { name: /notifications panel/i });
        const mobilePanelResults = testMobileAccessibility(
          notificationPanel,
          viewportSizes.mobile.width,
          viewportSizes.mobile.height
        );
        
        // All touch targets should be large enough
        const insufficientTouchTargets = mobilePanelResults.touchTargetResults.filter(
          r => !r.isLargeEnough
        );
        expect(insufficientTouchTargets.length).toBe(0);
        
        // Test text resizing
        const textResizeIssues = testTextResizing(notificationPanel);
        expect(textResizeIssues.length).toBe(0);
      }
    );
  });
  
  it('should generate a comprehensive accessibility report', async () => {
    const { container } = renderWithProviders();
    
    // Wait for notifications to load
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    
    // Open notification panel
    const bellButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellButton);
    
    // Run comprehensive audit
    const auditResults = await runA11yAudit('NotificationCenter');
    
    // Generate and save report
    const report = generateAccessibilityReport(auditResults);
    const htmlReport = generateHtmlReport(report);
    
    if (saveToDisk) {
      fs.writeFileSync(
        path.join(reportsDir, 'notification-center-a11y-report.html'),
        htmlReport
      );
    }
    
    // Test results
    expect(report.component).toBe('NotificationCenter');
    expect(report.violations.length).toBeLessThan(1); // Ideally 0
  });
});
