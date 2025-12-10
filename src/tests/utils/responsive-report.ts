/**
 * Responsive Design Test Report Generator
 * 
 * This utility creates structured reports from responsive design test results,
 * capturing metrics across viewports and providing actionable insights.
 */

import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { breakpoints, viewports } from './viewport';

// Define report structure
interface ResponsiveTestResult {
  component: string;
  viewport: string;
  width: number;
  height: number;
  passRate: number;
  failures: string[];
  warnings: string[];
  metrics: {
    renderTime?: number;
    layoutShiftScore?: number;
    interactiveElementCount?: number;
    accessibleElementCount?: number;
    mediaAssetCount?: number;
    loadSizeKB?: number;
  };
  screenshots?: string[];
}

interface ResponsiveAuditReport {
  timestamp: string;
  summary: {
    totalComponents: number;
    totalViewports: number;
    totalTests: number;
    overallPassRate: number;
    criticalFailures: number;
    potentialIssues: number;
  };
  componentResults: Record<string, {
    name: string;
    overallScore: number;
    bestPerformingViewport: string;
    worstPerformingViewport: string;
    viewportResults: ResponsiveTestResult[];
  }>;
  recommendations: string[];
}

// Report storage
let currentReport: ResponsiveAuditReport = {
  timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  summary: {
    totalComponents: 0,
    totalViewports: 0,
    totalTests: 0,
    overallPassRate: 0,
    criticalFailures: 0,
    potentialIssues: 0
  },
  componentResults: {},
  recommendations: []
};

/**
 * Initialize a new responsive design test report
 */
export const initializeReport = (): void => {
  currentReport = {
    timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    summary: {
      totalComponents: 0,
      totalViewports: 0,
      totalTests: 0,
      overallPassRate: 0,
      criticalFailures: 0,
      potentialIssues: 0
    },
    componentResults: {},
    recommendations: []
  };
};

/**
 * Register a component for responsive testing
 * @param componentName Name of the component being tested
 */
export const registerComponent = (componentName: string): void => {
  if (!currentReport.componentResults[componentName]) {
    currentReport.componentResults[componentName] = {
      name: componentName,
      overallScore: 0,
      bestPerformingViewport: '',
      worstPerformingViewport: '',
      viewportResults: []
    };
    currentReport.summary.totalComponents++;
  }
};

/**
 * Record a test result for a specific component and viewport
 * @param result Test result details
 */
export const recordTestResult = (result: ResponsiveTestResult): void => {
  const componentName = result.component;
  
  // Register component if not already registered
  if (!currentReport.componentResults[componentName]) {
    registerComponent(componentName);
  }
  
  // Add result to component
  currentReport.componentResults[componentName].viewportResults.push(result);
  
  // Update summary statistics
  currentReport.summary.totalViewports = Object.keys(
    currentReport.componentResults
  ).reduce((total, comp) => {
    return total + new Set(
      currentReport.componentResults[comp].viewportResults.map(r => r.viewport)
    ).size;
  }, 0);
  
  currentReport.summary.totalTests++;
  
  // Update failure and warning counts
  if (result.failures.length > 0) {
    currentReport.summary.criticalFailures += result.failures.length;
  }
  
  if (result.warnings.length > 0) {
    currentReport.summary.potentialIssues += result.warnings.length;
  }
  
  // Update component scores
  updateComponentScores(componentName);
};

/**
 * Calculate and update scores for a component
 * @param componentName Component to update scores for
 */
const updateComponentScores = (componentName: string): void => {
  const component = currentReport.componentResults[componentName];
  const results = component.viewportResults;
  
  if (results.length === 0) return;
  
  // Calculate overall score as average of pass rates
  const totalPassRate = results.reduce((sum, result) => sum + result.passRate, 0);
  component.overallScore = totalPassRate / results.length;
  
  // Find best and worst performing viewports
  let bestScore = -1;
  let worstScore = 101;
  
  results.forEach(result => {
    if (result.passRate > bestScore) {
      bestScore = result.passRate;
      component.bestPerformingViewport = result.viewport;
    }
    
    if (result.passRate < worstScore) {
      worstScore = result.passRate;
      component.worstPerformingViewport = result.viewport;
    }
  });
  
  // Update overall application pass rate
  const totalComponentScores = Object.values(currentReport.componentResults)
    .reduce((sum, comp) => sum + comp.overallScore, 0);
  
  currentReport.summary.overallPassRate = 
    totalComponentScores / currentReport.summary.totalComponents;
};

/**
 * Add recommendations based on test results
 * @param recommendations List of recommendations to add
 */
export const addRecommendations = (recommendations: string[]): void => {
  currentReport.recommendations.push(...recommendations);
};

/**
 * Generate patterns from test results
 * @returns Array of identified patterns and insights
 */
export const generateInsights = (): string[] => {
  const insights: string[] = [];
  
  // Check for viewport-specific issues
  const viewportIssues = new Map<string, number>();
  
  Object.values(currentReport.componentResults).forEach(component => {
    component.viewportResults.forEach(result => {
      if (result.failures.length > 0) {
        const count = viewportIssues.get(result.viewport) || 0;
        viewportIssues.set(result.viewport, count + result.failures.length);
      }
    });
  });
  
  // Identify problematic viewports
  const problematicViewports = Array.from(viewportIssues.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([viewport, count]) => viewport);
  
  if (problematicViewports.length > 0) {
    insights.push(
      `Most issues occur in these viewports: ${problematicViewports.join(', ')}`
    );
  }
  
  // Check for common failure patterns
  const failurePatterns = new Map<string, number>();
  
  Object.values(currentReport.componentResults).forEach(component => {
    component.viewportResults.forEach(result => {
      result.failures.forEach(failure => {
        const simplifiedFailure = failure
          .toLowerCase()
          .replace(/specific component names|specific element ids/g, '{element}');
        
        const count = failurePatterns.get(simplifiedFailure) || 0;
        failurePatterns.set(simplifiedFailure, count + 1);
      });
    });
  });
  
  // Identify common failure patterns
  const commonFailures = Array.from(failurePatterns.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pattern, count]) => `${pattern} (${count} occurrences)`);
  
  if (commonFailures.length > 0) {
    insights.push('Common failure patterns:');
    insights.push(...commonFailures);
  }
  
  // Performance insights
  const performanceByViewport = new Map<string, number[]>();
  
  Object.values(currentReport.componentResults).forEach(component => {
    component.viewportResults.forEach(result => {
      if (result.metrics.renderTime) {
        const times = performanceByViewport.get(result.viewport) || [];
        times.push(result.metrics.renderTime);
        performanceByViewport.set(result.viewport, times);
      }
    });
  });
  
  // Calculate average render times by viewport
  const averageRenderTimes = Array.from(performanceByViewport.entries())
    .map(([viewport, times]) => ({
      viewport,
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length
    }))
    .sort((a, b) => b.averageTime - a.averageTime);
  
  if (averageRenderTimes.length > 0) {
    const slowestViewport = averageRenderTimes[0];
    insights.push(
      `Slowest performance in ${slowestViewport.viewport} viewport (avg: ${slowestViewport.averageTime.toFixed(2)}ms)`
    );
  }
  
  return insights;
};

/**
 * Generate and save responsive test report
 * @param outputPath Path to save the report to
 */
export const generateReport = async (outputPath?: string): Promise<ResponsiveAuditReport> => {
  // Add auto-generated insights
  const insights = generateInsights();
  addRecommendations([
    '--- Auto-generated insights ---',
    ...insights
  ]);
  
  // Save report if path provided
  if (outputPath) {
    const reportDir = path.dirname(outputPath);
    
    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    // Write report to file
    fs.writeFileSync(
      outputPath,
      JSON.stringify(currentReport, null, 2),
      'utf-8'
    );
    
    // Generate HTML report
    const htmlReport = generateHtmlReport(currentReport);
    const htmlPath = outputPath.replace(/\.json$/, '.html');
    fs.writeFileSync(htmlPath, htmlReport, 'utf-8');
  }
  
  return currentReport;
};

/**
 * Generate an HTML report from the audit data
 * @param report The responsive audit report data
 * @returns HTML string of the report
 */
const generateHtmlReport = (report: ResponsiveAuditReport): string => {
  const componentRows = Object.values(report.componentResults)
    .map(component => {
      const results = component.viewportResults;
      const viewportResults = Object.values(viewports)
        .map(viewport => {
          const result = results.find(r => r.viewport === viewport.name);
          if (!result) return '<td class="empty">Not tested</td>';
          
          const passClass = result.passRate >= 90 ? 'pass' : 
                          result.passRate >= 70 ? 'partial' : 'fail';
          
          return `
            <td class="${passClass}">
              ${result.passRate.toFixed(0)}%
              ${result.failures.length > 0 ? 
                `<div class="issues">${result.failures.length} issues</div>` : ''}
            </td>
          `;
        })
        .join('');
      
      return `
        <tr>
          <td>${component.name}</td>
          <td>${component.overallScore.toFixed(0)}%</td>
          ${viewportResults}
        </tr>
      `;
    })
    .join('');
  
  const viewportHeaders = Object.values(viewports)
    .map(viewport => `<th>${viewport.name}<br/>${viewport.width}×${viewport.height}</th>`)
    .join('');
  
  const recommendations = report.recommendations
    .map(rec => `<li>${rec}</li>`)
    .join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Responsive Design Audit Report - ${report.timestamp}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        h1, h2, h3 {
          color: #2c3e50;
        }
        .summary {
          background-color: #f8f9fa;
          border-radius: 5px;
          padding: 20px;
          margin-bottom: 30px;
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }
        .summary-item {
          flex: 1;
          min-width: 200px;
        }
        .summary-value {
          font-size: 2rem;
          font-weight: bold;
          margin: 10px 0;
        }
        .pass-rate {
          color: #27ae60;
        }
        .failures {
          color: #e74c3c;
        }
        .issues {
          color: #f39c12;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        th, td {
          padding: 12px 15px;
          text-align: center;
          border: 1px solid #ddd;
        }
        th {
          background-color: #34495e;
          color: white;
          font-weight: 600;
        }
        td:first-child {
          text-align: left;
          font-weight: 600;
        }
        td.pass {
          background-color: rgba(46, 204, 113, 0.2);
        }
        td.partial {
          background-color: rgba(241, 196, 15, 0.2);
        }
        td.fail {
          background-color: rgba(231, 76, 60, 0.2);
        }
        td.empty {
          background-color: #f5f5f5;
          color: #999;
        }
        .issues {
          font-size: 0.8rem;
          color: #e74c3c;
          margin-top: 5px;
        }
        .recommendations {
          background-color: #f8f9fa;
          border-radius: 5px;
          padding: 20px;
        }
        .recommendations ul {
          padding-left: 20px;
        }
        .recommendations li {
          margin-bottom: 10px;
        }
        .timestamp {
          text-align: right;
          color: #7f8c8d;
          font-size: 0.9rem;
          margin-top: 40px;
        }
      </style>
    </head>
    <body>
      <h1>Responsive Design Audit Report</h1>
      
      <div class="summary">
        <div class="summary-item">
          <h3>Components Tested</h3>
          <div class="summary-value">${report.summary.totalComponents}</div>
        </div>
        <div class="summary-item">
          <h3>Viewports Tested</h3>
          <div class="summary-value">${Object.keys(viewports).length}</div>
        </div>
        <div class="summary-item">
          <h3>Overall Pass Rate</h3>
          <div class="summary-value pass-rate">${report.summary.overallPassRate.toFixed(0)}%</div>
        </div>
        <div class="summary-item">
          <h3>Critical Issues</h3>
          <div class="summary-value failures">${report.summary.criticalFailures}</div>
        </div>
        <div class="summary-item">
          <h3>Potential Issues</h3>
          <div class="summary-value issues">${report.summary.potentialIssues}</div>
        </div>
      </div>
      
      <h2>Component Results</h2>
      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th>Overall</th>
            ${viewportHeaders}
          </tr>
        </thead>
        <tbody>
          ${componentRows}
        </tbody>
      </table>
      
      <h2>Recommendations &amp; Insights</h2>
      <div class="recommendations">
        <ul>
          ${recommendations}
        </ul>
      </div>
      
      <div class="timestamp">Generated: ${report.timestamp}</div>
    </body>
    </html>
  `;
};

/**
 * Helper to create a new test result
 * @param component Component name
 * @param viewport Viewport name
 * @param width Viewport width
 * @param height Viewport height
 * @returns Initialized test result object
 */
export const createTestResult = (
  component: string,
  viewport: string,
  width: number,
  height: number
): ResponsiveTestResult => {
  return {
    component,
    viewport,
    width,
    height,
    passRate: 100, // Start with perfect score
    failures: [],
    warnings: [],
    metrics: {},
    screenshots: []
  };
};

/**
 * Record a test failure
 * @param result Test result to update
 * @param failure Failure description
 * @param deductPoints Points to deduct from pass rate (1-100)
 */
export const recordFailure = (
  result: ResponsiveTestResult,
  failure: string,
  deductPoints: number = 10
): void => {
  result.failures.push(failure);
  result.passRate = Math.max(0, result.passRate - deductPoints);
};

/**
 * Record a test warning
 * @param result Test result to update
 * @param warning Warning description
 * @param deductPoints Points to deduct from pass rate (1-100)
 */
export const recordWarning = (
  result: ResponsiveTestResult,
  warning: string,
  deductPoints: number = 3
): void => {
  result.warnings.push(warning);
  result.passRate = Math.max(0, result.passRate - deductPoints);
};

/**
 * Record a performance metric
 * @param result Test result to update
 * @param metricName Name of the metric
 * @param value Metric value
 */
export const recordMetric = (
  result: ResponsiveTestResult,
  metricName: keyof ResponsiveTestResult['metrics'],
  value: number
): void => {
  result.metrics[metricName] = value;
};

/**
 * Add a screenshot to the test result
 * @param result Test result to update
 * @param screenshotPath Path to the screenshot
 */
export const addScreenshot = (
  result: ResponsiveTestResult,
  screenshotPath: string
): void => {
  result.screenshots = result.screenshots || [];
  result.screenshots.push(screenshotPath);
};
