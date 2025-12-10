/**
 * Accessibility Testing Report Generator
 * 
 * This module provides utilities for generating structured reports from accessibility tests,
 * including violation severity categorization and remediation suggestions.
 */

import { A11yViolation, A11yTestResult } from './a11y-testing';
import { ColorContrastResult } from './a11y-color-contrast';
import { ViewportTestResult } from './a11y-mobile';

/**
 * Severity levels for accessibility issues
 */
export enum ViolationSeverity {
  Critical = 'critical',
  Serious = 'serious',
  Moderate = 'moderate',
  Minor = 'minor'
}

/**
 * Interface for a categorized accessibility violation
 */
export interface CategorizedViolation {
  violationId: string;
  description: string;
  severity: ViolationSeverity;
  wcagCriteria: string[];
  elements: string[];
  impact: string;
  remediation: string;
}

/**
 * Interface for an accessibility report
 */
export interface AccessibilityReport {
  component: string;
  date: string;
  passedTests: string[];
  violations: CategorizedViolation[];
  incompleteTests: string[];
  summary: {
    criticalCount: number;
    seriousCount: number;
    moderateCount: number;
    minorCount: number;
    totalViolations: number;
    conformanceLevel: 'A' | 'AA' | 'AAA' | 'None';
  };
}

/**
 * Map of WCAG success criteria for common accessibility issues
 */
const wcagCriteriaMap: Record<string, string[]> = {
  // Semantic Structure
  'landmark-one-main': ['1.3.1', '2.4.1'],
  'region': ['1.3.1', '2.4.1'],
  'document-title': ['2.4.2'],
  'heading-order': ['1.3.1', '2.4.10'],
  'list': ['1.3.1'],
  'listitem': ['1.3.1'],
  'definition-list': ['1.3.1'],
  'dlitem': ['1.3.1'],
  
  // Text Alternatives
  'image-alt': ['1.1.1'],
  'input-image-alt': ['1.1.1'],
  'area-alt': ['1.1.1'],
  'object-alt': ['1.1.1'],
  'svg-img-alt': ['1.1.1'],
  
  // Adaptable Content
  'meta-viewport': ['1.4.4'],
  'orientation': ['1.3.4'],
  'frame-title': ['2.4.1', '4.1.2'],
  'table-duplicate-name': ['1.3.1'],
  'td-headers-attr': ['1.3.1'],
  'th-has-data-cells': ['1.3.1'],
  
  // Distinguishable Content
  'color-contrast': ['1.4.3'],
  'link-in-text-block': ['1.4.1'],
  'audio-caption': ['1.2.1'],
  'video-caption': ['1.2.2'],
  'video-description': ['1.2.3', '1.2.5'],
  'gestural': ['2.5.1'],
  
  // Keyboard Accessible
  'accesskeys': ['2.1.1', '2.1.2'],
  'focusable-no-name': ['2.1.1', '4.1.2'],
  'keyboard': ['2.1.1'],
  'no-keyboard-trap': ['2.1.2'],
  'tabindex': ['2.4.3'],
  
  // Enough Time
  'blink': ['2.2.2'],
  'server-side-image-map': ['2.1.1'],
  
  // Navigable
  'bypass': ['2.4.1'],
  'empty-heading': ['2.4.6'],
  'focus-order-semantics': ['2.4.3'],
  'heading-level': ['2.4.6'],
  'label-title-only': ['2.4.6', '3.3.2'],
  'p-as-heading': ['1.3.1', '2.4.6'],
  
  // Input Modalities
  'pointer-gesture': ['2.5.1'],
  'target-size': ['2.5.5'],
  
  // Parse
  'duplicate-id-active': ['4.1.1'],
  'duplicate-id-aria': ['4.1.1'],
  'duplicate-id': ['4.1.1'],
  
  // Name, Role, Value
  'aria-allowed-attr': ['4.1.2'],
  'aria-hidden-body': ['4.1.2'],
  'aria-required-attr': ['4.1.2'],
  'aria-required-children': ['4.1.2'],
  'aria-required-parent': ['4.1.2'],
  'aria-roles': ['4.1.2'],
  'aria-valid-attr-value': ['4.1.2'],
  'aria-valid-attr': ['4.1.2'],
  'button-name': ['4.1.2'],
  'label': ['3.3.2', '4.1.2'],
  'form-field-multiple-labels': ['3.3.2'],
  'link-name': ['2.4.4', '4.1.2'],
  'select-name': ['4.1.2'],
};

/**
 * Generate an accessibility report from test results
 * @param results One or more A11y test results
 * @returns Comprehensive accessibility report
 */
export const generateAccessibilityReport = (
  results: A11yTestResult | A11yTestResult[]
): AccessibilityReport => {
  const testResults = Array.isArray(results) ? results : [results];
  const component = testResults[0].component;
  
  // Combine all violations
  const allViolations: A11yViolation[] = [];
  const passedTests: string[] = [];
  const incompleteTests: string[] = [];
  
  testResults.forEach(result => {
    // Add violations
    allViolations.push(...result.violations);
    
    // Add incomplete tests
    if (result.incompleteTests) {
      incompleteTests.push(...result.incompleteTests);
    }
    
    // Add passed tests (if no violations)
    if (result.passed) {
      passedTests.push(result.component);
    }
  });
  
  // Categorize violations
  const categorizedViolations = categorizeViolations(allViolations);
  
  // Generate summary
  const summary = {
    criticalCount: categorizedViolations.filter(v => v.severity === ViolationSeverity.Critical).length,
    seriousCount: categorizedViolations.filter(v => v.severity === ViolationSeverity.Serious).length,
    moderateCount: categorizedViolations.filter(v => v.severity === ViolationSeverity.Moderate).length,
    minorCount: categorizedViolations.filter(v => v.severity === ViolationSeverity.Minor).length,
    totalViolations: categorizedViolations.length,
    conformanceLevel: determineConformanceLevel(categorizedViolations)
  };
  
  return {
    component,
    date: new Date().toISOString(),
    passedTests,
    violations: categorizedViolations,
    incompleteTests,
    summary
  };
};

/**
 * Categorize accessibility violations by severity and WCAG criteria
 * @param violations List of raw violations
 * @returns Categorized violations with severity and WCAG mapping
 */
const categorizeViolations = (violations: A11yViolation[]): CategorizedViolation[] => {
  // Group similar violations
  const violationMap = new Map<string, A11yViolation[]>();
  
  violations.forEach(violation => {
    if (!violationMap.has(violation.id)) {
      violationMap.set(violation.id, []);
    }
    violationMap.get(violation.id)!.push(violation);
  });
  
  // Categorize each group
  const result: CategorizedViolation[] = [];
  
  violationMap.forEach((groupedViolations, id) => {
    // Combine all elements from violations with the same ID
    const elements: string[] = [];
    groupedViolations.forEach(v => {
      elements.push(...v.nodes);
    });
    
    // Get the highest impact from the group
    const impactLevels = ['critical', 'serious', 'moderate', 'minor'];
    let highestImpact = 'minor';
    
    groupedViolations.forEach(v => {
      if (impactLevels.indexOf(v.impact) < impactLevels.indexOf(highestImpact)) {
        highestImpact = v.impact;
      }
    });
    
    // Map to severity
    const severity = mapImpactToSeverity(highestImpact as any);
    
    // Get WCAG criteria
    const wcagCriteria = wcagCriteriaMap[id] || [];
    
    // Get remediation suggestion from the first violation
    const remediation = groupedViolations[0]?.remediation || 
                      'Review WCAG guidelines for this issue.';
    
    result.push({
      violationId: id,
      description: groupedViolations[0]?.description || id,
      severity,
      wcagCriteria,
      elements: uniqueArray(elements),
      impact: highestImpact,
      remediation
    });
  });
  
  // Sort by severity
  return result.sort((a, b) => {
    const severityOrder = {
      [ViolationSeverity.Critical]: 0,
      [ViolationSeverity.Serious]: 1,
      [ViolationSeverity.Moderate]: 2,
      [ViolationSeverity.Minor]: 3
    };
    
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
};

/**
 * Map axe-core impact levels to violation severity
 */
const mapImpactToSeverity = (
  impact: 'minor' | 'moderate' | 'serious' | 'critical'
): ViolationSeverity => {
  switch (impact) {
    case 'critical':
      return ViolationSeverity.Critical;
    case 'serious':
      return ViolationSeverity.Serious;
    case 'moderate':
      return ViolationSeverity.Moderate;
    case 'minor':
    default:
      return ViolationSeverity.Minor;
  }
};

/**
 * Determine WCAG conformance level based on violations
 */
const determineConformanceLevel = (violations: CategorizedViolation[]): 'A' | 'AA' | 'AAA' | 'None' => {
  // If any critical or serious violations, no conformance
  if (violations.some(v => 
      v.severity === ViolationSeverity.Critical || 
      v.severity === ViolationSeverity.Serious)) {
    return 'None';
  }
  
  // Check for A level violations
  const aLevelViolations = violations.filter(v => 
    v.wcagCriteria.some(criteria => criteria.startsWith('1.') || 
                                   criteria.startsWith('2.') || 
                                   criteria.startsWith('3.') || 
                                   criteria.startsWith('4.'))
  );
  
  if (aLevelViolations.length > 0) {
    return 'None';
  }
  
  // Check for AA level violations
  const aaLevelViolations = violations.filter(v => 
    v.wcagCriteria.some(criteria => {
      const parts = criteria.split('.');
      return parts.length >= 2 && parseInt(parts[1]) >= 4;
    })
  );
  
  if (aaLevelViolations.length > 0) {
    return 'A';
  }
  
  // If no A or AA violations, at least AA compliant
  return 'AA';
};

/**
 * Get unique array elements
 */
const uniqueArray = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

/**
 * Generate HTML report from accessibility test results
 * @param report Accessibility report
 * @returns HTML string of the report
 */
export const generateHtmlReport = (report: AccessibilityReport): string => {
  const { component, date, passedTests, violations, incompleteTests, summary } = report;
  
  // Format date
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Generate HTML for passed tests
  const passedTestsHtml = passedTests.length > 0 
    ? `<ul>${passedTests.map(test => `<li>${test}</li>`).join('')}</ul>`
    : '<p>No tests passed.</p>';
  
  // Generate HTML for violations
  const violationsHtml = violations.length > 0
    ? violations.map(violation => `
        <div class="violation ${violation.severity}">
          <h3>${violation.description} (${violation.violationId})</h3>
          <p><strong>Severity:</strong> ${violation.severity}</p>
          <p><strong>WCAG Criteria:</strong> ${violation.wcagCriteria.join(', ')}</p>
          <p><strong>Impact:</strong> ${violation.impact}</p>
          <p><strong>Remediation:</strong> ${violation.remediation}</p>
          <p><strong>Affected Elements:</strong></p>
          <ul>
            ${violation.elements.map(el => `<li><code>${el}</code></li>`).join('')}
          </ul>
        </div>
      `).join('')
    : '<p>No violations found.</p>';
  
  // Generate HTML for incomplete tests
  const incompleteTestsHtml = incompleteTests.length > 0
    ? `<ul>${incompleteTests.map(test => `<li>${test}</li>`).join('')}</ul>`
    : '<p>No incomplete tests.</p>';
  
  // Generate report HTML
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Accessibility Report for ${component}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #0066cc;
          border-bottom: 2px solid #0066cc;
          padding-bottom: 10px;
        }
        h2 {
          color: #0066cc;
          margin-top: 30px;
        }
        .summary {
          background-color: #f5f5f5;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .summary h2 {
          margin-top: 0;
        }
        .violation {
          margin: 20px 0;
          padding: 15px;
          border-radius: 5px;
        }
        .violation h3 {
          margin-top: 0;
        }
        .critical {
          background-color: #ffebee;
          border-left: 5px solid #f44336;
        }
        .serious {
          background-color: #fff8e1;
          border-left: 5px solid #ff9800;
        }
        .moderate {
          background-color: #fffde7;
          border-left: 5px solid #ffeb3b;
        }
        .minor {
          background-color: #e8f5e9;
          border-left: 5px solid #4caf50;
        }
        code {
          background-color: #f5f5f5;
          padding: 2px 5px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <h1>Accessibility Report for ${component}</h1>
      <p><strong>Generated:</strong> ${formattedDate}</p>
      
      <div class="summary">
        <h2>Summary</h2>
        <p><strong>Conformance Level:</strong> ${summary.conformanceLevel}</p>
        <p><strong>Total Violations:</strong> ${summary.totalViolations}</p>
        <ul>
          <li>Critical: ${summary.criticalCount}</li>
          <li>Serious: ${summary.seriousCount}</li>
          <li>Moderate: ${summary.moderateCount}</li>
          <li>Minor: ${summary.minorCount}</li>
        </ul>
      </div>
      
      <h2>Passed Tests</h2>
      ${passedTestsHtml}
      
      <h2>Violations</h2>
      ${violationsHtml}
      
      <h2>Incomplete Tests</h2>
      ${incompleteTestsHtml}
      
      <hr>
      <p><small>Generated by Bioelectric Regeneration Tracker Accessibility Testing Suite</small></p>
    </body>
    </html>
  `;
};
