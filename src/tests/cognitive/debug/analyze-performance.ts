/**
 * Analyze Performance
 * 
 * This script analyzes the performance of the system during chaos testing
 * and calculates a composite resilience score.
 */

import * as fs from 'fs';
import * as path from 'path';

// Define paths
const ROOT_DIR = path.resolve(__dirname, '../../../../');
const LOGS_DIR = path.join(ROOT_DIR, 'logs/chaos');
const SUMMARY_REPORT_PATH = path.join(LOGS_DIR, 'summary-report.json');
const UX_IMPACT_REPORT_PATH = path.join(LOGS_DIR, 'ux-impact-report.json');
const TELEMETRY_REPORT_PATH = path.join(LOGS_DIR, 'telemetry-report.json');
const HISTORY_PATH = path.join(LOGS_DIR, 'chaos-history.json');

// Define interfaces
interface SummaryReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  recoverySuccessRate: number;
  averageRecoveryTime: number;
  testsByComponent: Record<string, {
    total: number;
    passed: number;
    failed: number;
  }>;
  testsByFailureType: Record<string, {
    total: number;
    passed: number;
    failed: number;
  }>;
  resilienceScore?: number;
  resilienceRating?: string;
}

interface UXImpactReport {
  timestamp: string;
  summary: {
    totalImpacts: number;
    avgSeverity: number;
    avgRecoveryTime: number;
    worstComponent: string | null;
  };
  details: {
    totalImpacts: number;
    impactsBySeverity: Record<number, number>;
    impactsByComponent: Record<string, number>;
    avgRecoveryTime: number;
    impacts: any[];
  };
}

interface TelemetryReport {
  timestamp: string;
  dataPoints: number;
  timeRange: {
    start: number;
    end: number;
  };
  metrics: Record<string, {
    min: number;
    max: number;
    mean: number;
    stdDev: number;
    count: number;
  }>;
  anomalies: Record<string, any[]>;
}

interface HistoryEntry {
  timestamp: string;
  resilienceScore: number;
  recoverySuccessRate: number;
  avgUXSeverity: number;
  performanceBenchmarkPassRate: number;
  anomalyCount: number;
}

/**
 * Load report from file
 * 
 * @param filePath Path to the report file
 * @returns Report object or null if file doesn't exist
 */
function loadReport<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`Report file not found: ${filePath}`);
      return null;
    }
    
    const reportData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(reportData) as T;
  } catch (error) {
    console.error(`Error loading report from ${filePath}:`, error);
    return null;
  }
}

/**
 * Load history from file
 * 
 * @returns History array or empty array if file doesn't exist
 */
function loadHistory(): HistoryEntry[] {
  try {
    if (!fs.existsSync(HISTORY_PATH)) {
      return [];
    }
    
    const historyData = fs.readFileSync(HISTORY_PATH, 'utf8');
    return JSON.parse(historyData) as HistoryEntry[];
  } catch (error) {
    console.error(`Error loading history from ${HISTORY_PATH}:`, error);
    return [];
  }
}

/**
 * Save history to file
 * 
 * @param history History array
 */
function saveHistory(history: HistoryEntry[]): void {
  try {
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
    
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf8');
    console.log(`History saved to ${HISTORY_PATH}`);
  } catch (error) {
    console.error(`Error saving history to ${HISTORY_PATH}:`, error);
  }
}

/**
 * Calculate performance benchmark pass rate
 * 
 * @param telemetryReport Telemetry report
 * @returns Performance benchmark pass rate (0-1)
 */
function calculatePerformanceBenchmarkPassRate(telemetryReport: TelemetryReport | null): number {
  if (!telemetryReport) {
    return 0;
  }
  
  // Count total anomalies
  let totalAnomalies = 0;
  for (const anomalies of Object.values(telemetryReport.anomalies)) {
    totalAnomalies += anomalies.length;
  }
  
  // Calculate pass rate based on anomalies
  // If there are no metrics, return 0
  const totalMetrics = Object.keys(telemetryReport.metrics).length;
  if (totalMetrics === 0) {
    return 0;
  }
  
  // Calculate pass rate as 1 - (anomalies / metrics)
  // Clamp to 0-1 range
  const passRate = Math.max(0, Math.min(1, 1 - (totalAnomalies / totalMetrics)));
  return passRate;
}

/**
 * Calculate resilience score
 * 
 * @param recoverySuccessRate Recovery success rate (0-1)
 * @param avgUXSeverity Average UX severity (0-5)
 * @param performanceBenchmarkPassRate Performance benchmark pass rate (0-1)
 * @returns Resilience score (0-100)
 */
function calculateResilienceScore(
  recoverySuccessRate: number,
  avgUXSeverity: number,
  performanceBenchmarkPassRate: number
): number {
  // Normalize UX severity to 0-1 range (0 is best, 1 is worst)
  const normalizedUXSeverity = avgUXSeverity / 5;
  
  // Calculate resilience score
  // 40% recovery success rate + 30% (1 - UX severity) + 30% performance benchmark pass rate
  const score = 
    (0.4 * recoverySuccessRate) +
    (0.3 * (1 - normalizedUXSeverity)) +
    (0.3 * performanceBenchmarkPassRate);
  
  // Convert to 0-100 range
  return Math.round(score * 100);
}

/**
 * Get resilience rating based on score
 * 
 * @param score Resilience score (0-100)
 * @returns Resilience rating
 */
function getResilienceRating(score: number): string {
  if (score >= 90) {
    return '💎 Platinum';
  } else if (score >= 80) {
    return '🟩 Strong';
  } else if (score >= 70) {
    return '🟨 Stable';
  } else {
    return '🟥 Needs Work';
  }
}

/**
 * Generate markdown report
 * 
 * @param summaryReport Summary report
 * @param uxImpactReport UX impact report
 * @param telemetryReport Telemetry report
 * @param history History array
 * @returns Markdown report
 */
function generateMarkdownReport(
  summaryReport: SummaryReport,
  uxImpactReport: UXImpactReport | null,
  telemetryReport: TelemetryReport | null,
  history: HistoryEntry[]
): string {
  const timestamp = new Date().toISOString();
  const resilienceScore = summaryReport.resilienceScore || 0;
  const resilienceRating = summaryReport.resilienceRating || 'N/A';
  
  let markdown = `# Resilience Report\n\n`;
  markdown += `Generated: ${new Date(timestamp).toLocaleString()}\n\n`;
  
  // Add resilience score badge
  markdown += `## Resilience Score: ${resilienceScore} (${resilienceRating})\n\n`;
  
  // Add summary table
  markdown += `## Summary\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `| ------ | ----- |\n`;
  markdown += `| Recovery Success Rate | ${(summaryReport.recoverySuccessRate * 100).toFixed(1)}% |\n`;
  markdown += `| Average Recovery Time | ${summaryReport.averageRecoveryTime.toFixed(1)}ms |\n`;
  
  if (uxImpactReport) {
    markdown += `| UX Impacts | ${uxImpactReport.summary.totalImpacts} |\n`;
    markdown += `| Average UX Severity | ${uxImpactReport.summary.avgSeverity.toFixed(1)} / 5 |\n`;
    markdown += `| Worst Component | ${uxImpactReport.summary.worstComponent || 'None'} |\n`;
  }
  
  if (telemetryReport) {
    const anomalyCount = Object.values(telemetryReport.anomalies)
      .reduce((sum, anomalies) => sum + anomalies.length, 0);
    
    markdown += `| Anomalies Detected | ${anomalyCount} |\n`;
    markdown += `| Test Duration | ${((telemetryReport.timeRange.end - telemetryReport.timeRange.start) / 1000).toFixed(1)}s |\n`;
  }
  
  // Add recovery matrix
  markdown += `\n## Recovery Success Matrix\n\n`;
  markdown += `### By Component\n\n`;
  markdown += `| Component | Success Rate | Tests |\n`;
  markdown += `| --------- | ------------ | ----- |\n`;
  
  for (const [component, stats] of Object.entries(summaryReport.testsByComponent)) {
    const successRate = stats.total > 0 ? (stats.passed / stats.total) * 100 : 0;
    markdown += `| ${component} | ${successRate.toFixed(1)}% | ${stats.passed}/${stats.total} |\n`;
  }
  
  markdown += `\n### By Failure Type\n\n`;
  markdown += `| Failure Type | Success Rate | Tests |\n`;
  markdown += `| ------------ | ------------ | ----- |\n`;
  
  for (const [failureType, stats] of Object.entries(summaryReport.testsByFailureType)) {
    const successRate = stats.total > 0 ? (stats.passed / stats.total) * 100 : 0;
    markdown += `| ${failureType} | ${successRate.toFixed(1)}% | ${stats.passed}/${stats.total} |\n`;
  }
  
  // Add UX impact analysis
  if (uxImpactReport) {
    markdown += `\n## UX Impact Analysis\n\n`;
    markdown += `### Severity Distribution\n\n`;
    markdown += `| Severity | Count |\n`;
    markdown += `| -------- | ----- |\n`;
    
    for (let i = 0; i <= 5; i++) {
      const count = uxImpactReport.details.impactsBySeverity[i] || 0;
      markdown += `| ${i} | ${count} |\n`;
    }
    
    markdown += `\n### Most Impacted Components\n\n`;
    markdown += `| Component | Impact Count |\n`;
    markdown += `| --------- | ------------ |\n`;
    
    const sortedComponents = Object.entries(uxImpactReport.details.impactsByComponent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    for (const [component, count] of sortedComponents) {
      markdown += `| ${component} | ${count} |\n`;
    }
  }
  
  // Add anomaly analysis
  if (telemetryReport && Object.keys(telemetryReport.anomalies).length > 0) {
    markdown += `\n## Anomaly Analysis\n\n`;
    markdown += `| Metric | Anomalies | Description |\n`;
    markdown += `| ------ | --------- | ----------- |\n`;
    
    for (const [metric, anomalies] of Object.entries(telemetryReport.anomalies)) {
      if (anomalies.length > 0) {
        markdown += `| ${metric} | ${anomalies.length} | ${anomalies[0].description} |\n`;
      }
    }
  }
  
  // Add historical comparison
  if (history.length > 0) {
    markdown += `\n## Historical Comparison\n\n`;
    
    // Get previous entry
    const previousEntry = history[history.length - 1];
    
    // Calculate changes
    const scoreChange = resilienceScore - previousEntry.resilienceScore;
    const recoveryRateChange = 
      (summaryReport.recoverySuccessRate - previousEntry.recoverySuccessRate) * 100;
    
    let avgUXSeverity = 0;
    if (uxImpactReport) {
      avgUXSeverity = uxImpactReport.summary.avgSeverity;
    }
    const uxSeverityChange = previousEntry.avgUXSeverity - avgUXSeverity;
    
    // Add comparison table
    markdown += `| Metric | Current | Previous | Change |\n`;
    markdown += `| ------ | ------- | -------- | ------ |\n`;
    markdown += `| Resilience Score | ${resilienceScore} | ${previousEntry.resilienceScore} | ${scoreChange >= 0 ? '+' : ''}${scoreChange} |\n`;
    markdown += `| Recovery Success Rate | ${(summaryReport.recoverySuccessRate * 100).toFixed(1)}% | ${(previousEntry.recoverySuccessRate * 100).toFixed(1)}% | ${recoveryRateChange >= 0 ? '+' : ''}${recoveryRateChange.toFixed(1)}% |\n`;
    markdown += `| Average UX Severity | ${avgUXSeverity.toFixed(1)} | ${previousEntry.avgUXSeverity.toFixed(1)} | ${uxSeverityChange >= 0 ? '+' : ''}${uxSeverityChange.toFixed(1)} |\n`;
  }
  
  // Add recommendations
  markdown += `\n## Recommendations\n\n`;
  
  // Add default recommendations
  const recommendations = [
    'Continue monitoring system resilience with regular chaos testing',
    'Focus on improving recovery mechanisms for components with low success rates',
    'Implement circuit breakers for components with high UX impact'
  ];
  
  // Add specific recommendations based on analysis
  if (summaryReport.recoverySuccessRate < 0.8) {
    recommendations.push('Improve overall recovery success rate, currently below 80%');
  }
  
  if (uxImpactReport && uxImpactReport.summary.avgSeverity > 2) {
    recommendations.push('Reduce UX impact severity, currently above moderate levels');
  }
  
  if (telemetryReport) {
    const anomalyCount = Object.values(telemetryReport.anomalies)
      .reduce((sum, anomalies) => sum + anomalies.length, 0);
    
    if (anomalyCount > 5) {
      recommendations.push('Address system anomalies, particularly in metrics with multiple anomalies');
    }
  }
  
  // Add recommendations to markdown
  for (const recommendation of recommendations) {
    markdown += `- ${recommendation}\n`;
  }
  
  return markdown;
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('=== Analyzing Performance ===');
  
  try {
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
    
    // Load reports
    const summaryReport = loadReport<SummaryReport>(SUMMARY_REPORT_PATH);
    const uxImpactReport = loadReport<UXImpactReport>(UX_IMPACT_REPORT_PATH);
    const telemetryReport = loadReport<TelemetryReport>(TELEMETRY_REPORT_PATH);
    
    if (!summaryReport) {
      console.error('Summary report not found. Run chaos tests first.');
      process.exit(1);
    }
    
    // Calculate performance benchmark pass rate
    const performanceBenchmarkPassRate = calculatePerformanceBenchmarkPassRate(telemetryReport);
    
    // Get UX severity
    let avgUXSeverity = 0;
    if (uxImpactReport) {
      avgUXSeverity = uxImpactReport.summary.avgSeverity;
    }
    
    // Calculate resilience score
    const resilienceScore = calculateResilienceScore(
      summaryReport.recoverySuccessRate,
      avgUXSeverity,
      performanceBenchmarkPassRate
    );
    
    // Get resilience rating
    const resilienceRating = getResilienceRating(resilienceScore);
    
    // Update summary report with resilience score and rating
    summaryReport.resilienceScore = resilienceScore;
    summaryReport.resilienceRating = resilienceRating;
    
    // Save updated summary report
    fs.writeFileSync(SUMMARY_REPORT_PATH, JSON.stringify(summaryReport, null, 2), 'utf8');
    
    // Load history
    const history = loadHistory();
    
    // Create history entry
    const historyEntry: HistoryEntry = {
      timestamp: new Date().toISOString(),
      resilienceScore,
      recoverySuccessRate: summaryReport.recoverySuccessRate,
      avgUXSeverity,
      performanceBenchmarkPassRate,
      anomalyCount: telemetryReport
        ? Object.values(telemetryReport.anomalies).reduce((sum, anomalies) => sum + anomalies.length, 0)
        : 0
    };
    
    // Add history entry
    history.push(historyEntry);
    
    // Save history
    saveHistory(history);
    
    // Generate markdown report
    const markdownReport = generateMarkdownReport(
      summaryReport,
      uxImpactReport,
      telemetryReport,
      history
    );
    
    // Save markdown report
    const markdownReportPath = path.join(LOGS_DIR, 'resilience-report.md');
    fs.writeFileSync(markdownReportPath, markdownReport, 'utf8');
    
    // Copy to docs directory
    const docsDir = path.join(ROOT_DIR, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    const docsReportPath = path.join(docsDir, 'resilience-report.md');
    fs.copyFileSync(markdownReportPath, docsReportPath);
    
    // Print summary
    console.log('\n=== Performance Analysis Summary ===');
    console.log(`Resilience Score: ${resilienceScore} (${resilienceRating})`);
    console.log(`Recovery Success Rate: ${(summaryReport.recoverySuccessRate * 100).toFixed(1)}%`);
    console.log(`Average UX Severity: ${avgUXSeverity.toFixed(1)} / 5`);
    console.log(`Performance Benchmark Pass Rate: ${(performanceBenchmarkPassRate * 100).toFixed(1)}%`);
    console.log(`\nReports saved to:`);
    console.log(`- ${SUMMARY_REPORT_PATH}`);
    console.log(`- ${markdownReportPath}`);
    console.log(`- ${docsReportPath}`);
    
    // Send notifications if score is low
    sendNotifications(resilienceScore);
    
    console.log('\n✅ Performance analysis complete!');
  } catch (error) {
    console.error('Error during performance analysis:', error);
    process.exit(1);
  }
}

/**
 * Send notifications if resilience score is low
 * 
 * @param resilienceScore Resilience score
 */
function sendNotifications(resilienceScore: number) {
  if (process.env.CI && resilienceScore < 70) {
    // Send critical alert for failing resilience
    if (process.env.SLACK_WEBHOOK) {
      sendSlackAlert(`🚨 Critical: Resilience score dropped to ${resilienceScore}`);
    }
    
    if (process.env.TEAMS_WEBHOOK) {
      sendTeamsAlert(`🚨 Critical: Resilience score dropped to ${resilienceScore}`);
    }
    
    if (process.env.NOTIFICATION_EMAIL) {
      sendEmailAlert(`Resilience Alert: Score ${resilienceScore}`, 
        `Resilience testing detected a critical drop in system resilience.`);
    }
  }
}

/**
 * Send Slack alert
 * 
 * @param message Message to send
 */
function sendSlackAlert(message: string): void {
  try {
    const webhook = process.env.SLACK_WEBHOOK;
    if (!webhook) {
      return;
    }
    
    console.log(`Sending Slack alert: ${message}`);
    
    // In a real implementation, this would use the Slack API
    // For now, just log the message
    console.log(`[SLACK] ${message}`);
  } catch (error) {
    console.error('Error sending Slack alert:', error);
  }
}

/**
 * Send Teams alert
 * 
 * @param message Message to send
 */
function sendTeamsAlert(message: string): void {
  try {
    const webhook = process.env.TEAMS_WEBHOOK;
    if (!webhook) {
      return;
    }
    
    console.log(`Sending Teams alert: ${message}`);
    
    // In a real implementation, this would use the Teams API
    // For now, just log the message
    console.log(`[TEAMS] ${message}`);
  } catch (error) {
    console.error('Error sending Teams alert:', error);
  }
}

/**
 * Send email alert
 * 
 * @param subject Email subject
 * @param body Email body
 */
function sendEmailAlert(subject: string, body: string): void {
  try {
    const email = process.env.NOTIFICATION_EMAIL;
    if (!email) {
      return;
    }
    
    console.log(`Sending email alert: ${subject}`);
    
    // In a real implementation, this would use an email service
    // For now, just log the message
    console.log(`[EMAIL] To: ${email}, Subject: ${subject}, Body: ${body}`);
  } catch (error) {
    console.error('Error sending email alert:', error);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error during performance analysis:', error);
  process.exit(1);
});