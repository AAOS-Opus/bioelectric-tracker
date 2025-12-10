#!/usr/bin/env node

/**
 * Cognitive Tests Runner
 * 
 * This script runs the cognitive tests for the application, which test resilience,
 * performance, and edge case handling under various stress conditions.
 * 
 * Usage:
 *   node run-cognitive-tests.js [options]
 * 
 * Options:
 *   --test-path-pattern, -p   Run tests matching the specified pattern
 *   --chaos-level, -c         Set chaos level (1-5, default: 3)
 *   --duration, -d            Set test duration in seconds (default: 60)
 *   --report-dir, -r          Directory to save test reports (default: ./reports)
 *   --seed, -s                Random seed for reproducible chaos (default: random)
 *   --verbose, -v             Enable verbose logging
 *   --help, -h                Show help
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  testPathPattern: '',
  chaosLevel: 3,
  duration: 60,
  reportDir: './reports',
  seed: Math.floor(Math.random() * 1000000),
  verbose: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--test-path-pattern' || arg === '-p') {
    options.testPathPattern = args[++i];
  } else if (arg === '--chaos-level' || arg === '-c') {
    options.chaosLevel = parseInt(args[++i], 10);
  } else if (arg === '--duration' || arg === '-d') {
    options.duration = parseInt(args[++i], 10);
  } else if (arg === '--report-dir' || arg === '-r') {
    options.reportDir = args[++i];
  } else if (arg === '--seed' || arg === '-s') {
    options.seed = parseInt(args[++i], 10);
  } else if (arg === '--verbose' || arg === '-v') {
    options.verbose = true;
  } else if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  }
}

// Validate options
if (options.chaosLevel < 1 || options.chaosLevel > 5) {
  console.error('Error: Chaos level must be between 1 and 5');
  process.exit(1);
}

if (options.duration < 1) {
  console.error('Error: Duration must be at least 1 second');
  process.exit(1);
}

// Show help
function showHelp() {
  console.log(`
Cognitive Tests Runner

Usage:
  node run-cognitive-tests.js [options]

Options:
  --test-path-pattern, -p   Run tests matching the specified pattern
  --chaos-level, -c         Set chaos level (1-5, default: 3)
  --duration, -d            Set test duration in seconds (default: 60)
  --report-dir, -r          Directory to save test reports (default: ./reports)
  --seed, -s                Random seed for reproducible chaos (default: random)
  --verbose, -v             Enable verbose logging
  --help, -h                Show help
  `);
}

// Ensure report directory exists
if (!fs.existsSync(options.reportDir)) {
  fs.mkdirSync(options.reportDir, { recursive: true });
}

// Set environment variables for tests
process.env.CHAOS_LEVEL = options.chaosLevel.toString();
process.env.CHAOS_DURATION = options.duration.toString();
process.env.CHAOS_SEED = options.seed.toString();
process.env.REPORT_DIR = options.reportDir;

// Log test configuration
console.log('=== Cognitive Tests Configuration ===');
console.log(`Test Path Pattern: ${options.testPathPattern || '(all tests)'}`);
console.log(`Chaos Level: ${options.chaosLevel}`);
console.log(`Duration: ${options.duration} seconds`);
console.log(`Report Directory: ${options.reportDir}`);
console.log(`Random Seed: ${options.seed}`);
console.log(`Verbose: ${options.verbose}`);
console.log('=====================================');

// Get list of test files
function getTestFiles() {
  const testDir = path.join(__dirname);
  const pattern = options.testPathPattern ? 
    new RegExp(options.testPathPattern) : 
    /\.edge\.test\.tsx$|\.resilience\.test\.tsx$/;
  
  const allFiles = [];
  
  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDir(filePath);
      } else if (pattern.test(file)) {
        allFiles.push(filePath);
      }
    }
  }
  
  scanDir(testDir);
  return allFiles;
}

// Run tests
async function runTests() {
  const testFiles = getTestFiles();
  
  if (testFiles.length === 0) {
    console.log('No test files found matching the pattern');
    return;
  }
  
  console.log(`Found ${testFiles.length} test files to run`);
  
  // Create summary report
  const summary = {
    startTime: new Date().toISOString(),
    endTime: null,
    duration: 0,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    results: []
  };
  
  const startTime = performance.now();
  
  // Run each test file
  for (const testFile of testFiles) {
    const relativePath = path.relative(process.cwd(), testFile);
    console.log(`\nRunning test: ${relativePath}`);
    
    const testResult = {
      file: relativePath,
      passed: false,
      duration: 0,
      error: null
    };
    
    const testStartTime = performance.now();
    
    try {
      // Run the test using Jest
      const jestCommand = `npx jest ${relativePath} --no-cache --runInBand --forceExit`;
      
      if (options.verbose) {
        console.log(`Executing: ${jestCommand}`);
      }
      
      const output = execSync(jestCommand, { 
        stdio: options.verbose ? 'inherit' : 'pipe',
        encoding: 'utf-8'
      });
      
      if (options.verbose) {
        console.log(output);
      }
      
      testResult.passed = true;
      summary.passedTests++;
    } catch (error) {
      testResult.passed = false;
      testResult.error = error.message;
      summary.failedTests++;
      
      console.error(`Test failed: ${relativePath}`);
      if (!options.verbose) {
        console.error(error.stdout || error.message);
      }
    }
    
    const testEndTime = performance.now();
    testResult.duration = (testEndTime - testStartTime) / 1000;
    
    summary.results.push(testResult);
    summary.totalTests++;
    
    console.log(`Completed test: ${relativePath} (${testResult.duration.toFixed(2)}s) - ${testResult.passed ? 'PASSED' : 'FAILED'}`);
  }
  
  const endTime = performance.now();
  summary.duration = (endTime - startTime) / 1000;
  summary.endTime = new Date().toISOString();
  
  // Save summary report
  const summaryPath = path.join(options.reportDir, `cognitive-tests-summary-${Date.now()}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  // Print summary
  console.log('\n=== Cognitive Tests Summary ===');
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Passed: ${summary.passedTests}`);
  console.log(`Failed: ${summary.failedTests}`);
  console.log(`Duration: ${summary.duration.toFixed(2)}s`);
  console.log(`Summary Report: ${summaryPath}`);
  console.log('===============================');
  
  // Exit with appropriate code
  process.exit(summary.failedTests > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});