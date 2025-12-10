/**
 * Chaos Suite Validation Script
 * 
 * This script validates the chaos test suite and generates reports.
 * 
 * @federation-compatible
 * @machine-readable
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CHAOS_DIR = path.resolve(__dirname, '..');
const REPORTS_DIR = path.resolve(process.cwd(), 'reports/chaos');
const CONFIG_FILE = path.resolve(process.cwd(), '.chaosrc.js');

/**
 * Main validation function
 */
async function validateChaosSuite() {
  console.log('FEDERATION:{"event":"validation.start","timestamp":' + Date.now() + '}');
  console.log('Starting chaos suite validation');

  // Ensure reports directory exists
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  // Load configuration
  const config = require(CONFIG_FILE);
  console.log('Loaded configuration from', CONFIG_FILE);

  // Discover test files
  const testFiles = discoverTestFiles();
  console.log(`Discovered ${testFiles.length} test files`);

  // Parse test metadata
  const testMetadata = parseTestMetadata(testFiles);
  console.log(`Parsed metadata for ${Object.keys(testMetadata).length} tests`);

  // Generate test discovery metrics
  const discoveryMetrics = generateDiscoveryMetrics(testMetadata);
  console.log('Generated test discovery metrics');

  // Run basic tests to validate
  console.log('Running basic chaos tests for validation');
  try {
    execSync('npm run test:chaos:basic', { stdio: 'inherit' });
    console.log('Basic chaos tests passed');
  } catch (error) {
    console.error('Basic chaos tests failed:', error);
    process.exit(1);
  }

  // Generate report
  const report = generateReport(discoveryMetrics, testMetadata);
  console.log('Generated chaos test report');

  // Write report to file
  const reportPath = path.join(REPORTS_DIR, 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report written to ${reportPath}`);

  // Generate human-readable summary
  const summaryPath = path.join(REPORTS_DIR, 'validation-summary.md');
  const summary = generateSummary(report);
  fs.writeFileSync(summaryPath, summary);
  console.log(`Summary written to ${summaryPath}`);

  console.log('FEDERATION:{"event":"validation.complete","timestamp":' + Date.now() + '}');
  console.log('Chaos suite validation complete');
}

/**
 * Discover test files
 */
function discoverTestFiles() {
  const chaosDir = path.join(CHAOS_DIR, 'chaos');
  const files = [];

  if (fs.existsSync(chaosDir)) {
    const entries = fs.readdirSync(chaosDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.test.tsx')) {
        files.push(path.join(chaosDir, entry.name));
      }
    }
  }

  // Also check for chaos tests in the root directory
  const rootEntries = fs.readdirSync(CHAOS_DIR, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (entry.isFile() && entry.name.includes('chaos') && entry.name.endsWith('.test.tsx')) {
      files.push(path.join(CHAOS_DIR, entry.name));
    }
  }

  return files;
}

/**
 * Parse test metadata from files
 */
function parseTestMetadata(files) {
  const metadata = {};

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    
    // Extract test names
    const testMatches = Array.from(content.matchAll(/test\(['"]([^'"]+)['"]/g));
    for (const match of testMatches) {
      const testName = match[1];
      const testKey = `${fileName}:${testName}`;
      
      // Extract metadata
      const chaosTag = content.match(/@chaos:(\w+)/);
      const resourceProfile = content.match(/@resource-profile\s+({[^}]+})/);
      const targets = content.match(/@targets\s+(\[[^\]]+\])/);
      const skipReason = content.match(/@skip-reason\s+["']([^"']+)["']/);
      const skipCi = content.includes('@chaos-skip-ci');
      
      metadata[testKey] = {
        file,
        testName,
        chaosTag: chaosTag ? chaosTag[1] : 'unknown',
        resourceProfile: resourceProfile ? JSON.parse(resourceProfile[1].replace(/'/g, '"')) : null,
        targets: targets ? JSON.parse(targets[1].replace(/'/g, '"')) : [],
        skipReason: skipReason ? skipReason[1] : null,
        skipCi
      };
    }
  }

  return metadata;
}

/**
 * Generate discovery metrics
 */
function generateDiscoveryMetrics(metadata) {
  const metrics = {
    totalTests: Object.keys(metadata).length,
    byCategory: {},
    byTarget: {},
    skipped: 0,
    skippedWithReason: 0,
    resourceProfiles: {
      low: 0,
      medium: 0,
      high: 0
    }
  };

  // Count by category and target
  for (const key in metadata) {
    const test = metadata[key];
    
    // Count by category
    const category = test.chaosTag || 'unknown';
    metrics.byCategory[category] = (metrics.byCategory[category] || 0) + 1;
    
    // Count by target
    for (const target of test.targets || []) {
      metrics.byTarget[target] = (metrics.byTarget[target] || 0) + 1;
    }
    
    // Count skipped tests
    if (test.skipCi) {
      metrics.skipped++;
      if (test.skipReason) {
        metrics.skippedWithReason++;
      }
    }
    
    // Count by resource profile
    if (test.resourceProfile) {
      const memory = test.resourceProfile.memory || '';
      if (memory.includes('4GB') || memory.includes('8GB')) {
        metrics.resourceProfiles.high++;
      } else if (memory.includes('1GB') || memory.includes('2GB')) {
        metrics.resourceProfiles.medium++;
      } else {
        metrics.resourceProfiles.low++;
      }
    }
  }

  return metrics;
}

/**
 * Generate full report
 */
function generateReport(discoveryMetrics, testMetadata) {
  // Create basic report structure
  const report = {
    testRunSummary: {
      totalTests: discoveryMetrics.totalTests,
      passedTests: 0, // Will be updated from test results
      skippedTests: discoveryMetrics.skipped,
      failedTests: 0, // Will be updated from test results
      duration: 0,
      timestamp: Date.now()
    },
    failureMap: {},
    dependencyGraph: {},
    federationSignals: [],
    resourceUtilization: {
      memory: 0,
      cpu: 0,
      time: 0
    }
  };

  // Try to load test results if available
  try {
    const resultsPath = path.join(REPORTS_DIR, 'chaos-basic-report.json');
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      
      // Update summary with actual test results
      if (results.numPassedTests !== undefined) {
        report.testRunSummary.passedTests = results.numPassedTests;
      }
      
      if (results.numFailedTests !== undefined) {
        report.testRunSummary.failedTests = results.numFailedTests;
      }
      
      if (results.testResults) {
        // Calculate total duration
        report.testRunSummary.duration = results.testResults.reduce(
          (sum, result) => sum + (result.endTime - result.startTime),
          0
        );
        
        // Extract dependency graph if available
        for (const testResult of results.testResults) {
          if (testResult.console) {
            for (const log of testResult.console) {
              if (log.message.includes('REASONING: Identified component dependencies')) {
                try {
                  const match = log.message.match(/dependencies\s+({[^}]+})/);
                  if (match) {
                    const dependencies = JSON.parse(match[1].replace(/'/g, '"'));
                    Object.assign(report.dependencyGraph, dependencies);
                  }
                } catch (e) {
                  // Ignore parsing errors
                }
              }
              
              // Extract federation signals
              if (log.message.startsWith('FEDERATION:')) {
                try {
                  const eventData = JSON.parse(log.message.substring(11));
                  report.federationSignals.push({
                    type: eventData.eventType || 'unknown',
                    payload: eventData.payload || {},
                    path: eventData.propagationPath || [],
                    reasoning: eventData.reasoningTrace || ''
                  });
                } catch (e) {
                  // Ignore parsing errors
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('Could not load test results:', error);
  }

  // Add failure map entries for skipped tests
  for (const key in testMetadata) {
    const test = testMetadata[key];
    if (test.skipCi) {
      report.failureMap[key] = {
        component: test.testName,
        failureType: 'skipped',
        severity: 'low',
        reasoning: test.skipReason || 'No reason provided',
        recoveryState: 'unreachable'
      };
      
      // Add these as extra properties since they're not in the type
      report.failureMap[key].linkedDependencies = test.targets || [];
      report.failureMap[key].impact = 'none';
    }
  }

  return report;
}

/**
 * Generate human-readable summary
 */
function generateSummary(report) {
  let summary = `# Chaos Testing Validation Summary\n\n`;
  summary += `Generated: ${new Date(report.testRunSummary.timestamp).toISOString()}\n\n`;
  
  summary += `## Test Run Summary\n\n`;
  summary += `- Total Tests: ${report.testRunSummary.totalTests}\n`;
  summary += `- Passed Tests: ${report.testRunSummary.passedTests}\n`;
  summary += `- Skipped Tests: ${report.testRunSummary.skippedTests}\n`;
  summary += `- Failed Tests: ${report.testRunSummary.failedTests}\n`;
  summary += `- Duration: ${report.testRunSummary.duration}ms\n\n`;
  
  summary += `## Dependency Graph\n\n`;
  summary += `\`\`\`json\n${JSON.stringify(report.dependencyGraph, null, 2)}\n\`\`\`\n\n`;
  
  summary += `## Federation Signals\n\n`;
  summary += `Total Signals: ${report.federationSignals.length}\n\n`;
  
  if (report.federationSignals.length > 0) {
    summary += `### Signal Types\n\n`;
    const signalTypes = {};
    for (const signal of report.federationSignals) {
      signalTypes[signal.type] = (signalTypes[signal.type] || 0) + 1;
    }
    
    for (const type in signalTypes) {
      summary += `- ${type}: ${signalTypes[type]}\n`;
    }
    summary += `\n`;
  }
  
  summary += `## Skipped Tests\n\n`;
  const skippedTests = Object.entries(report.failureMap)
    .filter(([_, data]) => data.failureType === 'skipped');
  
  if (skippedTests.length > 0) {
    for (const [key, data] of skippedTests) {
      summary += `### ${data.component}\n\n`;
      summary += `- Reason: ${data.reasoning}\n`;
      summary += `- Linked Dependencies: ${data.linkedDependencies?.join(', ') || 'None'}\n\n`;
    }
  } else {
    summary += `No skipped tests.\n\n`;
  }
  
  return summary;
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateChaosSuite().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = { validateChaosSuite };