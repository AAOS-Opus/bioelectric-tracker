/**
 * Responsive Design Audit Test Runner
 * 
 * This script executes the responsive design tests and generates
 * a comprehensive report of the results.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { renderWithViewport, mockMatchMedia } from '../tests/utils/responsive-render';
import { viewports, setViewport, breakpoints } from '../tests/utils/viewport';
import * as layoutValidator from '../tests/utils/layout-validator';
import * as reportGenerator from '../tests/utils/responsive-report';

// Import components to test
import NotificationSettings from '../components/preferences/NotificationSettings';
import { NotificationCenter } from '../components/notifications/NotificationCenter';

// Configure test environment
jest.mock('next/router', () => require('next-router-mock'));
mockMatchMedia();

// Define components to test
const componentsToTest = [
  { name: 'NotificationSettings', component: React.createElement(NotificationSettings, { onSettingChange: jest.fn() }) },
  // Add more components as needed
];

// Define viewports to test
const viewportsToTest = [
  { name: 'mobileSmall', ...viewports.mobileSmall },
  { name: 'mobileLarge', ...viewports.mobileLarge },
  { name: 'tabletSmall', ...viewports.tabletSmall },
  { name: 'desktop', ...viewports.desktop },
  { name: 'ultrawide', ...viewports.ultrawide }
];

// Test categories
const testCategories = [
  {
    name: 'Core Responsive Framework',
    tests: [
      {
        name: 'Fluid Layout',
        run: async (element: Element) => {
          // Check for relative units
          const usesRelativeUnits = layoutValidator.validateRelativeUnits(element);
          return { 
            pass: usesRelativeUnits,
            message: usesRelativeUnits ? '' : 'Element not using relative CSS units'
          };
        }
      },
      {
        name: 'No Horizontal Overflow',
        run: async (element: Element) => {
          const noOverflow = layoutValidator.validateNoHorizontalOverflow(element);
          return { 
            pass: noOverflow,
            message: noOverflow ? '' : 'Element overflows horizontally'
          };
        }
      }
    ]
  },
  {
    name: 'Interactive Elements',
    tests: [
      {
        name: 'Minimum Touch Target Size',
        run: async (element: Element) => {
          const hasSufficientSize = layoutValidator.validateMinimumTapTargetSize(element);
          return { 
            pass: hasSufficientSize,
            message: hasSufficientSize ? '' : 'Touch target too small'
          };
        },
        selector: 'button, a, [role="button"], [role="link"], [role="switch"], input[type="checkbox"], input[type="radio"]'
      },
      {
        name: 'Readable Text Size',
        run: async (element: Element) => {
          const hasReadableText = layoutValidator.validateMinimumTextSize(element);
          return { 
            pass: hasReadableText,
            message: hasReadableText ? '' : 'Text size too small for readability'
          };
        },
        selector: 'p, h1, h2, h3, h4, h5, h6, span, label, a'
      }
    ]
  },
  {
    name: 'Layout Adaptation',
    tests: [
      {
        name: 'Responsive Flex Container',
        run: async (element: Element) => {
          const style = window.getComputedStyle(element);
          if (style.display !== 'flex') return { pass: true, message: '' };
          
          const wraps = layoutValidator.validateFlexWrapping(element);
          return { 
            pass: wraps,
            message: wraps ? '' : 'Flex container does not wrap on small screens'
          };
        },
        selector: '[style*="display: flex"], [class*="flex"]'
      },
      {
        name: 'Responsive Grid Layout',
        run: async (element: Element) => {
          const style = window.getComputedStyle(element);
          if (style.display !== 'grid') return { pass: true, message: '' };
          
          const isResponsive = layoutValidator.validateResponsiveGrid(element);
          return { 
            pass: isResponsive,
            message: isResponsive ? '' : 'Grid layout not using responsive features'
          };
        },
        selector: '[style*="display: grid"], [class*="grid"]'
      }
    ]
  },
  {
    name: 'Media Elements',
    tests: [
      {
        name: 'Responsive Images',
        run: async (element: Element) => {
          if (!(element instanceof HTMLImageElement)) {
            return { pass: true, message: '' };
          }
          
          const validation = layoutValidator.validateResponsiveImage(element);
          return { 
            pass: validation.maintainsAspectRatio && validation.fitsContainer,
            message: !validation.maintainsAspectRatio 
              ? 'Image does not maintain aspect ratio' 
              : !validation.fitsContainer 
                ? 'Image does not fit container'
                : ''
          };
        },
        selector: 'img'
      }
    ]
  }
];

/**
 * Run all responsive tests for a component at a specific viewport
 */
async function runComponentViewportTests(
  componentName: string, 
  component: React.ReactElement,
  viewport: typeof viewportsToTest[0]
) {
  console.log(`Testing ${componentName} at ${viewport.name} (${viewport.width}x${viewport.height})`);
  
  // Initialize test result
  const testResult = reportGenerator.createTestResult(
    componentName,
    viewport.name,
    viewport.width,
    viewport.height
  );
  
  // Measure render time
  const startTime = performance.now();
  
  // Render component at this viewport
  renderWithViewport(component, { viewport });
  
  // Record render time
  const renderTime = performance.now() - startTime;
  reportGenerator.recordMetric(testResult, 'renderTime', renderTime);
  
  // Count interactive elements
  const interactiveElements = document.querySelectorAll(
    'button, a, [role="button"], [role="link"], input, select, textarea'
  );
  reportGenerator.recordMetric(
    testResult, 
    'interactiveElementCount', 
    interactiveElements.length
  );
  
  // Run tests on different element types
  for (const category of testCategories) {
    for (const test of category.tests) {
      // Get elements to test
      const selector = test.selector || '*';
      const elements = document.querySelectorAll(selector);
      
      if (elements.length === 0) {
        // Skip test if no matching elements
        continue;
      }
      
      // Track failures for this test
      let testFailures = 0;
      
      // Test each element
      for (const element of Array.from(elements)) {
        const result = await test.run(element);
        
        if (!result.pass) {
          testFailures++;
          
          // Describe the failing element for better debugging
          const elementDesc = element.tagName.toLowerCase() +
            (element.id ? `#${element.id}` : '') +
            (element.className ? `.${element.className.replace(/\s+/g, '.')}` : '');
          
          // Record failure
          reportGenerator.recordFailure(
            testResult,
            `${category.name} - ${test.name}: ${result.message} (${elementDesc})`,
            // Adjust deduction based on importance
            test.name.includes('Touch Target') || test.name.includes('Overflow') ? 10 : 5
          );
        }
      }
      
      // Calculate failure percentage
      const failurePercentage = (testFailures / elements.length) * 100;
      
      // Record warning if more than 20% of elements fail but less than 50%
      if (failurePercentage >= 20 && failurePercentage < 50) {
        reportGenerator.recordWarning(
          testResult,
          `${category.name} - ${test.name}: ${testFailures} of ${elements.length} elements (${failurePercentage.toFixed(1)}%) have issues`,
          3
        );
      }
    }
  }
  
  // Record test result
  reportGenerator.recordTestResult(testResult);
  
  // Log test completion
  console.log(`Completed testing ${componentName} at ${viewport.name} - Pass Rate: ${testResult.passRate.toFixed(1)}%`);
  if (testResult.failures.length > 0) {
    console.log(`Failures (${testResult.failures.length}):`);
    testResult.failures.forEach(failure => console.log(` - ${failure}`));
  }
  
  // Clear the DOM for next test
  document.body.innerHTML = '';
}

/**
 * Main test execution function
 */
async function runResponsiveTests() {
  console.log('Starting Responsive Design Audit...');
  
  // Initialize report
  reportGenerator.initializeReport();
  
  // Register components
  for (const { name } of componentsToTest) {
    reportGenerator.registerComponent(name);
  }
  
  // Test each component at each viewport
  for (const { name, component } of componentsToTest) {
    for (const viewport of viewportsToTest) {
      await runComponentViewportTests(name, component, viewport);
    }
  }
  
  // Add recommendations based on test results
  reportGenerator.addRecommendations([
    'Ensure all interactive elements meet the minimum 44px touch target size on mobile devices',
    'Use relative CSS units (%, em, rem, vh, vw) for layouts instead of fixed pixels',
    'Implement proper media queries for all major breakpoints',
    'Test keyboard navigation in responsive layouts',
    'Consider implementing container queries for more component-focused responsive designs'
  ]);
  
  // Generate report
  const report = await reportGenerator.generateReport('./responsive-audit-report.json');
  
  console.log('\nResponsive Design Audit Completed');
  console.log(`Overall Pass Rate: ${report.summary.overallPassRate.toFixed(1)}%`);
  console.log(`Critical Issues: ${report.summary.criticalFailures}`);
  console.log(`Reports saved to ./responsive-audit-report.json and ./responsive-audit-report.html`);
}

// Run tests
runResponsiveTests().catch(console.error);
