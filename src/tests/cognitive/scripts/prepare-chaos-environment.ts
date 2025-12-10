/**
 * Prepare Chaos Environment
 * 
 * This script prepares the environment for chaos testing by:
 * 1. Creating necessary directories
 * 2. Setting up logging
 * 3. Checking dependencies
 * 4. Initializing mock services
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Define paths
const ROOT_DIR = path.resolve(__dirname, '../../../../');
const LOGS_DIR = path.join(ROOT_DIR, 'logs/chaos');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const RECOVERY_PATHS_FILE = path.join(DOCS_DIR, 'recovery-paths.json');

// Create necessary directories
function createDirectories() {
  console.log('Creating necessary directories...');
  
  // Create logs directory
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
    console.log(`Created logs directory: ${LOGS_DIR}`);
  } else {
    console.log(`Logs directory already exists: ${LOGS_DIR}`);
  }
  
  // Create docs directory if it doesn't exist
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
    console.log(`Created docs directory: ${DOCS_DIR}`);
  } else {
    console.log(`Docs directory already exists: ${DOCS_DIR}`);
  }
}

// Check dependencies
function checkDependencies() {
  console.log('Checking dependencies...');
  
  const requiredDependencies = [
    'uuid',
    'ws',
    'why-is-node-running',
    'memory-usage',
    'cpu-percentage'
  ];
  
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('package.json not found!');
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { 
    ...packageJson.dependencies || {}, 
    ...packageJson.devDependencies || {} 
  };
  
  const missingDependencies = requiredDependencies.filter(dep => !dependencies[dep]);
  
  if (missingDependencies.length > 0) {
    console.warn(`Missing dependencies: ${missingDependencies.join(', ')}`);
    console.log('Installing missing dependencies...');
    
    try {
      execSync(`npm install --save-dev ${missingDependencies.join(' ')}`, { 
        stdio: 'inherit',
        cwd: ROOT_DIR
      });
      console.log('Dependencies installed successfully.');
    } catch (error) {
      console.error('Failed to install dependencies:', error);
      process.exit(1);
    }
  } else {
    console.log('All required dependencies are installed.');
  }
}

// Create recovery paths file if it doesn't exist
function createRecoveryPathsFile() {
  console.log('Setting up recovery paths documentation...');
  
  if (!fs.existsSync(RECOVERY_PATHS_FILE)) {
    const defaultRecoveryPaths = [
      {
        component: 'Database',
        primary: 'Connection Pool Reset',
        secondary: 'Replica Failover',
        fallback: 'Read-Only Mode',
        recoveryTime: 5000
      },
      {
        component: 'Cache',
        primary: 'Reconnect',
        secondary: 'Rebuild from Database',
        recoveryTime: 2000
      },
      {
        component: 'API',
        primary: 'Circuit Breaker Reset',
        secondary: 'Rate Limiting',
        fallback: 'Static Response',
        recoveryTime: 3000
      },
      {
        component: 'Frontend',
        primary: 'Retry with Backoff',
        fallback: 'Offline Mode',
        recoveryTime: 1000
      },
      {
        component: 'Voice Module',
        primary: 'Restart Recognition Engine',
        secondary: 'Fallback to Text Input',
        recoveryTime: 4000
      },
      {
        component: 'Intent Parser',
        primary: 'Reset Parser State',
        secondary: 'Use Cached Intents',
        fallback: 'Direct Command Mode',
        recoveryTime: 2500
      },
      {
        component: 'Redis Memory',
        primary: 'Flush Specific Keys',
        secondary: 'Reconnect Client',
        fallback: 'Local Memory Cache',
        recoveryTime: 1500
      }
    ];
    
    fs.writeFileSync(
      RECOVERY_PATHS_FILE,
      JSON.stringify(defaultRecoveryPaths, null, 2),
      'utf8'
    );
    
    console.log(`Created recovery paths file: ${RECOVERY_PATHS_FILE}`);
  } else {
    console.log(`Recovery paths file already exists: ${RECOVERY_PATHS_FILE}`);
  }
}

// Set up global event emitter for real-time updates
// Declare global event emitter type
declare global {
  var eventEmitter: any;
}

function setupGlobalEventEmitter() {
  console.log('Setting up global event emitter...');
  
  // Create a simple event emitter for communication between modules
  const EventEmitter = require('events');
  global.eventEmitter = new EventEmitter();
  
  console.log('Global event emitter initialized.');
}

// Initialize mock services for testing
function initializeMockServices() {
  console.log('Initializing mock services...');
  
  // Create a mock services file if it doesn't exist
  const mockServicesDir = path.join(ROOT_DIR, 'src/tests/cognitive/mocks');
  const mockServicesFile = path.join(mockServicesDir, 'mock-services.ts');
  
  if (!fs.existsSync(mockServicesDir)) {
    fs.mkdirSync(mockServicesDir, { recursive: true });
  }
  
  if (!fs.existsSync(mockServicesFile)) {
    const mockServicesContent = `/**
 * Mock Services for Chaos Testing
 */

export const mockServices = {
  database: {
    isHealthy: true,
    connectionCount: 0,
    queryLatency: 0,
    
    setHealth(isHealthy: boolean) {
      this.isHealthy = isHealthy;
      global.eventEmitter.emit('service:health', { service: 'database', isHealthy });
    },
    
    setConnectionCount(count: number) {
      this.connectionCount = count;
      global.eventEmitter.emit('metric:update', { 
        service: 'database', 
        metric: 'connectionCount', 
        value: count 
      });
    },
    
    setQueryLatency(latency: number) {
      this.queryLatency = latency;
      global.eventEmitter.emit('metric:update', { 
        service: 'database', 
        metric: 'queryLatency', 
        value: latency 
      });
    }
  },
  
  api: {
    isHealthy: true,
    requestCount: 0,
    errorRate: 0,
    
    setHealth(isHealthy: boolean) {
      this.isHealthy = isHealthy;
      global.eventEmitter.emit('service:health', { service: 'api', isHealthy });
    },
    
    setRequestCount(count: number) {
      this.requestCount = count;
      global.eventEmitter.emit('metric:update', { 
        service: 'api', 
        metric: 'requestCount', 
        value: count 
      });
    },
    
    setErrorRate(rate: number) {
      this.errorRate = rate;
      global.eventEmitter.emit('metric:update', { 
        service: 'api', 
        metric: 'errorRate', 
        value: rate 
      });
    }
  },
  
  cache: {
    isHealthy: true,
    hitRate: 0,
    
    setHealth(isHealthy: boolean) {
      this.isHealthy = isHealthy;
      global.eventEmitter.emit('service:health', { service: 'cache', isHealthy });
    },
    
    setHitRate(rate: number) {
      this.hitRate = rate;
      global.eventEmitter.emit('metric:update', { 
        service: 'cache', 
        metric: 'hitRate', 
        value: rate 
      });
    }
  },
  
  voice: {
    isHealthy: true,
    recognitionAccuracy: 0,
    
    setHealth(isHealthy: boolean) {
      this.isHealthy = isHealthy;
      global.eventEmitter.emit('service:health', { service: 'voice', isHealthy });
    },
    
    setRecognitionAccuracy(accuracy: number) {
      this.recognitionAccuracy = accuracy;
      global.eventEmitter.emit('metric:update', { 
        service: 'voice', 
        metric: 'recognitionAccuracy', 
        value: accuracy 
      });
    }
  }
};

export default mockServices;
`;
    
    fs.writeFileSync(mockServicesFile, mockServicesContent, 'utf8');
    console.log(`Created mock services file: ${mockServicesFile}`);
  } else {
    console.log(`Mock services file already exists: ${mockServicesFile}`);
  }
}

// Configure extended logging
function configureLogging() {
  console.log('Configuring extended logging...');
  
  // Create a simple logger
  const logFile = path.join(LOGS_DIR, 'chaos-test.log');
  
  // Override console.log, console.warn, console.error to also write to file
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  function timestamp() {
    return new Date().toISOString();
  }
  
  console.log = function(...args) {
    const message = `[${timestamp()}] [INFO] ${args.join(' ')}`;
    fs.appendFileSync(logFile, message + '\n');
    originalConsoleLog.apply(console, args);
  };
  
  console.warn = function(...args) {
    const message = `[${timestamp()}] [WARN] ${args.join(' ')}`;
    fs.appendFileSync(logFile, message + '\n');
    originalConsoleWarn.apply(console, args);
  };
  
  console.error = function(...args) {
    const message = `[${timestamp()}] [ERROR] ${args.join(' ')}`;
    fs.appendFileSync(logFile, message + '\n');
    originalConsoleError.apply(console, args);
  };
  
  // Add debug log function
  console['debug'] = function(...args) {
    if (process.env.DEBUG) {
      const message = `[${timestamp()}] [DEBUG] ${args.join(' ')}`;
      fs.appendFileSync(logFile, message + '\n');
      originalConsoleLog.apply(console, [`[DEBUG]`, ...args]);
    }
  };
  
  console.log('Extended logging configured.');
}

// Main function
async function main() {
  console.log('=== Preparing Chaos Testing Environment ===');
  
  try {
    createDirectories();
    checkDependencies();
    createRecoveryPathsFile();
    setupGlobalEventEmitter();
    initializeMockServices();
    configureLogging();
    
    console.log('=== Chaos Testing Environment Ready ===');
  } catch (error) {
    console.error('Failed to prepare chaos testing environment:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);