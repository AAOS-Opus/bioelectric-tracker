#!/usr/bin/env node

/**
 * Cognitive Test CLI Utility
 * 
 * This utility provides a command-line interface for running cognitive tests
 * with filtering, reporting, and visualization capabilities.
 * 
 * Usage:
 *   cogtest --filter=redis
 *   cogtest --tag=performance
 *   cogtest --file=IntentChainValidation.test.ts
 *   cogtest --visualize
 *   cogtest --latency=high
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Configuration
const TEST_DIR = path.join(__dirname, '../../tests/cognitive');
const REPORT_DIR = path.join(TEST_DIR, 'reports');
const LATENCY_PROFILES = {
  low: 50,
  medium: 200,
  high: 500,
  extreme: 1000
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = parseArgs(args);

// Ensure report directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Main function
async function main() {
  console.log('\n🧠 MaestroDeck Cognitive Test Utility\n');
  
  // Display options
  console.log('Options:');
  Object.entries(options).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  console.log('');
  
  // Get test files based on options
  const testFiles = getTestFiles(options);
  
  if (testFiles.length === 0) {
    console.log('❌ No test files found matching the criteria.');
    process.exit(1);
  }
  
  console.log(`Found ${testFiles.length} test files:`);
  testFiles.forEach(file => {
    console.log(`  - ${path.basename(file)}`);
  });
  console.log('');
  
  // Apply latency profile if specified
  if (options.latency) {
    applyLatencyProfile(options.latency);
  }
  
  // Run tests
  const results = await runTests(testFiles, options);
  
  // Generate report
  generateReport(results, options);
  
  // Visualize results if requested
  if (options.visualize) {
    visualizeResults(results);
  }
  
  // Exit with appropriate code
  const success = results.every(result => result.success);
  process.exit(success ? 0 : 1);
}

// Parse command line arguments
function parseArgs(args) {
  const options = {
    filter: null,
    tag: null,
    file: null,
    visualize: false,
    latency: null,
    verbose: false,
    timeout: 30000
  };
  
  args.forEach(arg => {
    if (arg.startsWith('--filter=')) {
      options.filter = arg.replace('--filter=', '');
    } else if (arg.startsWith('--tag=')) {
      options.tag = arg.replace('--tag=', '');
    } else if (arg.startsWith('--file=')) {
      options.file = arg.replace('--file=', '');
    } else if (arg === '--visualize') {
      options.visualize = true;
    } else if (arg.startsWith('--latency=')) {
      options.latency = arg.replace('--latency=', '');
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg.startsWith('--timeout=')) {
      options.timeout = parseInt(arg.replace('--timeout=', ''), 10);
    } else if (arg === '--help') {
      showHelp();
      process.exit(0);
    }
  });
  
  return options;
}

// Show help
function showHelp() {
  console.log(`
🧠 MaestroDeck Cognitive Test Utility

Usage:
  cogtest [options]

Options:
  --filter=<string>    Filter tests by name (e.g., 'redis')
  --tag=<string>       Filter tests by tag (e.g., 'performance')
  --file=<string>      Run a specific test file
  --visualize          Visualize test results
  --latency=<profile>  Apply latency profile (low, medium, high, extreme)
  --verbose            Show verbose output
  --timeout=<ms>       Set test timeout in milliseconds (default: 30000)
  --help               Show this help message

Examples:
  cogtest --filter=redis
  cogtest --tag=performance
  cogtest --file=IntentChainValidation.test.ts
  cogtest --visualize
  cogtest --latency=high
  `);
}

// Get test files based on options
function getTestFiles(options) {
  // Get all test files
  const allFiles = fs.readdirSync(TEST_DIR)
    .filter(file => file.endsWith('.test.ts') || file.endsWith('.test.tsx'))
    .map(file => path.join(TEST_DIR, file));
  
  // Apply filters
  let filteredFiles = allFiles;
  
  if (options.file) {
    const fileName = options.file.endsWith('.ts') || options.file.endsWith('.tsx')
      ? options.file
      : `${options.file}.test.ts`;
    
    filteredFiles = allFiles.filter(file => path.basename(file) === fileName);
  }
  
  if (options.filter) {
    const filter = options.filter.toLowerCase();
    filteredFiles = filteredFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf8').toLowerCase();
      return content.includes(filter) || path.basename(file).toLowerCase().includes(filter);
    });
  }
  
  if (options.tag) {
    const tag = options.tag.toLowerCase();
    filteredFiles = filteredFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf8').toLowerCase();
      return content.includes(`@tag:${tag}`) || content.includes(`@tags:${tag}`);
    });
  }
  
  return filteredFiles;
}

// Apply latency profile
function applyLatencyProfile(profile) {
  const latency = LATENCY_PROFILES[profile.toLowerCase()];
  
  if (!latency) {
    console.log(`❌ Unknown latency profile: ${profile}`);
    console.log(`Available profiles: ${Object.keys(LATENCY_PROFILES).join(', ')}`);
    process.exit(1);
  }
  
  console.log(`Applying latency profile: ${profile} (${latency}ms)`);
  
  // Create a temporary file to configure latency
  const configPath = path.join(TEST_DIR, 'temp-latency-config.json');
  fs.writeFileSync(configPath, JSON.stringify({ latency }));
  
  // This file will be read by the tests to configure latency
  console.log(`Latency configuration written to: ${configPath}`);
  console.log('');
}

// Run tests
async function runTests(testFiles, options) {
  const results = [];
  
  for (const file of testFiles) {
    const fileName = path.basename(file);
    const reportPath = path.join(REPORT_DIR, `${fileName.replace(/\.(test\.tsx?|spec\.tsx?)$/, '')}-report.json`);
    
    console.log(`\n\n========================================`);
    console.log(`Running test: ${fileName}`);
    console.log(`========================================\n`);
    
    try {
      // Run the test with Jest
      const command = `npx jest ${file} --json --outputFile=${reportPath} --testTimeout=${options.timeout}`;
      
      if (options.verbose) {
        console.log(`Executing: ${command}\n`);
      }
      
      execSync(command, { stdio: 'inherit' });
      
      // Read the report
      const reportContent = fs.readFileSync(reportPath, 'utf8');
      const report = JSON.parse(reportContent);
      
      // Add to results
      results.push({
        file: fileName,
        success: report.numFailedTests === 0,
        numTests: report.numTotalTests,
        numPassed: report.numPassedTests,
        numFailed: report.numFailedTests,
        report
      });
      
      console.log(`\n✅ Test completed: ${fileName}`);
      console.log(`   Tests: ${report.numTotalTests}, Passed: ${report.numPassedTests}, Failed: ${report.numFailedTests}`);
    } catch (error) {
      console.error(`\n❌ Test failed: ${fileName}`);
      console.error(error.message);
      
      // Add to results
      results.push({
        file: fileName,
        success: false,
        numTests: 0,
        numPassed: 0,
        numFailed: 1,
        error: error.message
      });
    }
  }
  
  return results;
}

// Generate report
function generateReport(results, options) {
  // Calculate summary
  const summary = {
    totalFiles: results.length,
    totalTests: results.reduce((sum, result) => sum + result.numTests, 0),
    totalPassed: results.reduce((sum, result) => sum + result.numPassed, 0),
    totalFailed: results.reduce((sum, result) => sum + result.numFailed, 0),
    successRate: 0
  };
  
  summary.successRate = summary.totalTests > 0
    ? (summary.totalPassed / summary.totalTests) * 100
    : 0;
  
  // Print summary
  console.log(`\n\n========================================`);
  console.log(`Test Summary`);
  console.log(`========================================`);
  console.log(`Files: ${summary.totalFiles}`);
  console.log(`Tests: ${summary.totalTests}`);
  console.log(`Passed: ${summary.totalPassed}`);
  console.log(`Failed: ${summary.totalFailed}`);
  console.log(`Success Rate: ${summary.successRate.toFixed(2)}%`);
  console.log(`========================================\n`);
  
  // Generate combined report
  const combinedReport = {
    timestamp: new Date().toISOString(),
    options,
    summary,
    results
  };
  
  // Write combined report
  const combinedReportPath = path.join(REPORT_DIR, 'combined-report.json');
  fs.writeFileSync(
    combinedReportPath,
    JSON.stringify(combinedReport, null, 2)
  );
  
  console.log(`Combined report generated at: ${combinedReportPath}`);
}

// Visualize results
function visualizeResults(results) {
  console.log('\nVisualizing results...');
  
  // Simple ASCII visualization
  console.log('\nTest Results:');
  console.log('┌─────────────────────────────┬───────┬────────┬────────┐');
  console.log('│ Test                        │ Tests │ Passed │ Failed │');
  console.log('├─────────────────────────────┼───────┼────────┼────────┤');
  
  results.forEach(result => {
    const name = result.file.padEnd(25).substring(0, 25);
    const tests = result.numTests.toString().padStart(5);
    const passed = result.numPassed.toString().padStart(6);
    const failed = result.numFailed.toString().padStart(6);
    
    console.log(`│ ${name} │ ${tests} │ ${passed} │ ${failed} │`);
  });
  
  console.log('└─────────────────────────────┴───────┴────────┴────────┘');
  
  // Generate HTML report if browser is available
  const htmlReportPath = path.join(REPORT_DIR, 'visual-report.html');
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>MaestroDeck Cognitive Test Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .summary { margin: 20px 0; padding: 10px; background-color: #f5f5f5; border-radius: 5px; }
    .test-results { width: 100%; border-collapse: collapse; }
    .test-results th, .test-results td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    .test-results th { background-color: #f2f2f2; }
    .success { color: green; }
    .failure { color: red; }
    .chart { margin: 20px 0; height: 300px; }
  </style>
</head>
<body>
  <h1>MaestroDeck Cognitive Test Results</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Files: ${results.length}</p>
    <p>Tests: ${results.reduce((sum, result) => sum + result.numTests, 0)}</p>
    <p>Passed: ${results.reduce((sum, result) => sum + result.numPassed, 0)}</p>
    <p>Failed: ${results.reduce((sum, result) => sum + result.numFailed, 0)}</p>
    <p>Success Rate: ${(results.reduce((sum, result) => sum + result.numPassed, 0) / results.reduce((sum, result) => sum + result.numTests, 0) * 100).toFixed(2)}%</p>
  </div>
  
  <h2>Test Results</h2>
  <table class="test-results">
    <tr>
      <th>Test</th>
      <th>Tests</th>
      <th>Passed</th>
      <th>Failed</th>
      <th>Status</th>
    </tr>
    ${results.map(result => `
      <tr>
        <td>${result.file}</td>
        <td>${result.numTests}</td>
        <td>${result.numPassed}</td>
        <td>${result.numFailed}</td>
        <td class="${result.success ? 'success' : 'failure'}">${result.success ? 'Success' : 'Failure'}</td>
      </tr>
    `).join('')}
  </table>
  
  <div class="chart">
    <h2>Success Rate</h2>
    <div style="display: flex; align-items: flex-end; height: 200px;">
      ${results.map(result => {
        const successRate = result.numTests > 0 ? (result.numPassed / result.numTests) * 100 : 0;
        return `
          <div style="flex: 1; margin: 0 5px; display: flex; flex-direction: column; align-items: center;">
            <div style="background-color: ${successRate >= 90 ? 'green' : successRate >= 70 ? 'orange' : 'red'}; width: 30px; height: ${successRate * 2}px;"></div>
            <div style="margin-top: 5px; font-size: 12px; text-align: center;">${result.file.substring(0, 10)}</div>
            <div style="font-size: 12px;">${successRate.toFixed(0)}%</div>
          </div>
        `;
      }).join('')}
    </div>
  </div>
  
  <script>
    // Add any interactive JavaScript here
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync(htmlReportPath, htmlContent);
  console.log(`HTML report generated at: ${htmlReportPath}`);
  
  // Try to open the HTML report
  try {
    const openCommand = process.platform === 'win32'
      ? `start ${htmlReportPath}`
      : process.platform === 'darwin'
        ? `open ${htmlReportPath}`
        : `xdg-open ${htmlReportPath}`;
    
    execSync(openCommand, { stdio: 'ignore' });
  } catch (error) {
    console.log(`Could not automatically open the HTML report. Please open it manually.`);
  }
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});