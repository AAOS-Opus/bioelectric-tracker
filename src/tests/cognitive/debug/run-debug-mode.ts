/**
 * Run Debug Mode
 * 
 * This script runs all debug tools and generates comprehensive reports.
 * It serves as a one-stop command for analyzing chaos testing results.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { updateArchitectureDocumentation } from '../../cognitive/docs/update-architecture-docs';

// Define paths
const ROOT_DIR = path.resolve(__dirname, '../../../../');
const LOGS_DIR = path.join(ROOT_DIR, 'logs/chaos');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

/**
 * Ensure directory exists
 * 
 * @param dirPath Directory path
 */
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Run command and log output
 * 
 * @param command Command to run
 * @param description Description of the command
 */
function runCommand(command: string, description: string): void {
  console.log(`\n=== ${description} ===`);
  console.log(`Running: ${command}`);
  
  try {
    execSync(command, {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description} failed`);
    if (error instanceof Error) {
      console.error(error.message);
    }
  }
}

/**
 * Generate optimization recommendations
 */
function generateOptimizationRecommendations(): void {
  console.log('\n=== Generating Optimization Recommendations ===');
  
  try {
    // Load reports
    const summaryReportPath = path.join(LOGS_DIR, 'summary-report.json');
    const uxImpactReportPath = path.join(LOGS_DIR, 'ux-impact-report.json');
    const telemetryReportPath = path.join(LOGS_DIR, 'telemetry-report.json');
    const cascadeMapPath = path.join(LOGS_DIR, 'cascade-map.json');
    
    if (!fs.existsSync(summaryReportPath)) {
      console.error('Summary report not found. Run chaos tests first.');
      return;
    }
    
    // Load summary report
    const summaryReport = JSON.parse(fs.readFileSync(summaryReportPath, 'utf8'));
    
    // Load UX impact report if exists
    let uxImpactReport = null;
    if (fs.existsSync(uxImpactReportPath)) {
      uxImpactReport = JSON.parse(fs.readFileSync(uxImpactReportPath, 'utf8'));
    }
    
    // Load telemetry report if exists
    let telemetryReport = null;
    if (fs.existsSync(telemetryReportPath)) {
      telemetryReport = JSON.parse(fs.readFileSync(telemetryReportPath, 'utf8'));
    }
    
    // Load cascade map if exists
    let cascadeMap = null;
    if (fs.existsSync(cascadeMapPath)) {
      cascadeMap = JSON.parse(fs.readFileSync(cascadeMapPath, 'utf8'));
    }
    
    // Generate recommendations
    const recommendations: Array<{
      title: string;
      description: string;
      priority: 'High' | 'Medium' | 'Low';
      codeExample?: string;
    }> = [];
    
    // Add recommendations based on recovery success rate
    if (summaryReport.recoverySuccessRate < 0.9) {
      recommendations.push({
        title: 'Improve Recovery Success Rate',
        description: `Current recovery success rate is ${(summaryReport.recoverySuccessRate * 100).toFixed(1)}%, which is below the target of 90%.`,
        priority: summaryReport.recoverySuccessRate < 0.7 ? 'High' : 'Medium',
        codeExample: `
// Implement more robust error handling
try {
  // Operation that might fail
} catch (error) {
  // Log the error
  console.error('Operation failed:', error);
  
  // Attempt recovery
  if (isRetryableError(error)) {
    return retryOperation();
  }
  
  // Fallback to degraded mode
  return fallbackOperation();
}`
      });
    }
    
    // Add recommendations based on UX impact
    if (uxImpactReport && uxImpactReport.summary.avgSeverity > 2) {
      recommendations.push({
        title: 'Reduce UX Impact Severity',
        description: `Average UX impact severity is ${uxImpactReport.summary.avgSeverity.toFixed(1)}/5, which is above the target of 2/5.`,
        priority: uxImpactReport.summary.avgSeverity > 3 ? 'High' : 'Medium',
        codeExample: `
// Implement graceful degradation
function handleComponentFailure(component) {
  // Show loading state instead of error
  showLoadingState(component);
  
  // Attempt recovery in the background
  recoverComponent(component)
    .then(() => {
      // Restore component when recovered
      hideLoadingState(component);
      renderComponent(component);
    })
    .catch(() => {
      // Show degraded UI after multiple failures
      showDegradedUI(component);
    });
}`
      });
      
      // Add recommendation for worst component
      if (uxImpactReport.summary.worstComponent) {
        recommendations.push({
          title: `Improve Resilience of ${uxImpactReport.summary.worstComponent}`,
          description: `${uxImpactReport.summary.worstComponent} has the highest UX impact severity.`,
          priority: 'High'
        });
      }
    }
    
    // Add recommendations based on telemetry
    if (telemetryReport) {
      // Count anomalies
      let anomalyCount = 0;
      for (const anomalies of Object.values(telemetryReport.anomalies)) {
        anomalyCount += (anomalies as any[]).length;
      }
      
      if (anomalyCount > 0) {
        recommendations.push({
          title: 'Address System Anomalies',
          description: `${anomalyCount} anomalies detected during chaos testing.`,
          priority: anomalyCount > 5 ? 'High' : 'Medium'
        });
        
        // Add recommendation for metrics with most anomalies
        const metricsByAnomalyCount = Object.entries(telemetryReport.anomalies)
          .map(([metric, anomalies]) => ({ metric, count: (anomalies as any[]).length }))
          .filter(({ count }) => count > 0)
          .sort((a, b) => b.count - a.count);
        
        if (metricsByAnomalyCount.length > 0) {
          const worstMetric = metricsByAnomalyCount[0];
          recommendations.push({
            title: `Stabilize ${worstMetric.metric} Metric`,
            description: `${worstMetric.metric} had ${worstMetric.count} anomalies during testing.`,
            priority: worstMetric.count > 3 ? 'High' : 'Medium'
          });
        }
      }
    }
    
    // Add recommendations based on cascade map
    if (cascadeMap && cascadeMap.length > 0) {
      // Find components that trigger the most cascades
      const componentCascadeCounts: Record<string, number> = {};
      
      for (const cascade of cascadeMap) {
        if (!componentCascadeCounts[cascade.root]) {
          componentCascadeCounts[cascade.root] = 0;
        }
        componentCascadeCounts[cascade.root] += cascade.effects.length;
      }
      
      const componentsByImpact = Object.entries(componentCascadeCounts)
        .sort((a, b) => b[1] - a[1]);
      
      if (componentsByImpact.length > 0) {
        const worstComponent = componentsByImpact[0];
        recommendations.push({
          title: `Implement Circuit Breaker for ${worstComponent[0]}`,
          description: `${worstComponent[0]} triggered ${worstComponent[1]} cascading failures.`,
          priority: worstComponent[1] > 3 ? 'High' : 'Medium',
          codeExample: `
// Implement circuit breaker pattern
const circuitBreaker = new CircuitBreaker({
  component: '${worstComponent[0]}',
  failureThreshold: 3,
  resetTimeout: 30000,
  fallback: () => {
    // Return cached or default data
    return getCachedData('${worstComponent[0]}');
  }
});

// Use the circuit breaker
async function fetchData() {
  try {
    return await circuitBreaker.execute(() => {
      // Original operation that might fail
      return api.fetchDataFrom${worstComponent[0]}();
    });
  } catch (error) {
    // Handle circuit breaker open state
    console.warn('Circuit breaker open for ${worstComponent[0]}');
    return getFallbackData();
  }
}`
        });
      }
    }
    
    // Save recommendations
    const recommendationsPath = path.join(LOGS_DIR, 'optimization-recommendations.json');
    fs.writeFileSync(recommendationsPath, JSON.stringify(recommendations, null, 2), 'utf8');
    
    // Generate markdown version
    let markdown = '# Optimization Recommendations\n\n';
    markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    for (const recommendation of recommendations) {
      markdown += `## ${recommendation.title} (${recommendation.priority} Priority)\n\n`;
      markdown += `${recommendation.description}\n\n`;
      
      if (recommendation.codeExample) {
        markdown += '```typescript\n';
        markdown += recommendation.codeExample.trim();
        markdown += '\n```\n\n';
      }
    }
    
    const markdownPath = path.join(LOGS_DIR, 'optimization-recommendations.md');
    fs.writeFileSync(markdownPath, markdown, 'utf8');
    
    // Copy to docs directory
    const docsPath = path.join(DOCS_DIR, 'optimization-recommendations.md');
    fs.copyFileSync(markdownPath, docsPath);
    
    console.log(`✅ Generated ${recommendations.length} optimization recommendations`);
    console.log(`   Saved to: ${recommendationsPath}`);
    console.log(`   Markdown: ${markdownPath}`);
    console.log(`   Docs: ${docsPath}`);
  } catch (error) {
    console.error('Error generating optimization recommendations:', error);
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('=== Running Debug Mode ===');
  
  try {
    // Ensure directories exist
    ensureDirectoryExists(LOGS_DIR);
    ensureDirectoryExists(DOCS_DIR);
    
    // Check if chaos tests have been run
    const summaryReportPath = path.join(LOGS_DIR, 'summary-report.json');
    if (!fs.existsSync(summaryReportPath)) {
      console.warn('Summary report not found. Running chaos tests first...');
      runCommand('npx ts-node src/tests/cognitive/scripts/run-chaos-testing.ts', 'Run Chaos Tests');
    }
    
    // Run analyze-performance.ts
    runCommand('npx ts-node src/tests/cognitive/debug/analyze-performance.ts', 'Analyze Performance');
    
    // Run visualize-recovery-paths.ts
    runCommand('npx ts-node src/tests/cognitive/debug/visualize-recovery-paths.ts', 'Visualize Recovery Paths');
    
    // Generate optimization recommendations
    generateOptimizationRecommendations();
    
    // Update architecture documentation
    try {
      updateArchitectureDocumentation();
    } catch (error) {
      console.error('Error updating architecture documentation:', error);
    }
    
    // Generate final report
    console.log('\n=== Generating Final Report ===');
    
    // Combine all reports into a single markdown file
    const finalReportPath = path.join(DOCS_DIR, 'resilience-report.md');
    
    // Check if resilience report exists
    const resilienceReportPath = path.join(LOGS_DIR, 'resilience-report.md');
    if (fs.existsSync(resilienceReportPath)) {
      // Copy resilience report to docs directory
      fs.copyFileSync(resilienceReportPath, finalReportPath);
      console.log(`✅ Final report copied to: ${finalReportPath}`);
    } else {
      console.error('❌ Resilience report not found');
    }
    
    console.log('\n=== Debug Mode Complete ===');
    console.log('All reports and visualizations have been generated.');
    console.log(`Reports directory: ${LOGS_DIR}`);
    console.log(`Documentation directory: ${DOCS_DIR}`);
    
    // Print next steps
    console.log('\n=== Next Steps ===');
    console.log('1. Review the resilience report in docs/resilience-report.md');
    console.log('2. Check optimization recommendations in docs/optimization-recommendations.md');
    console.log('3. View recovery path visualizations (requires GraphViz)');
    console.log('4. Update system based on recommendations');
    console.log('5. Run chaos tests again to verify improvements');
  } catch (error) {
    console.error('Error running debug mode:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error during debug mode:', error);
  process.exit(1);
});