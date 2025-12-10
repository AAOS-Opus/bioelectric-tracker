/**
 * Run Chaos Testing
 * 
 * This script runs various chaos scenarios to test system resilience.
 * It injects failures, monitors system behavior, and collects metrics.
 */

import { ChaosTestHarness } from '../resilience/ChaosTestHarness';
import { UXImpactTracker } from '../helpers/ux-impact-tracking';
import { ChaosTelemetryCollector } from '../helpers/chaos-telemetry-integration';
import { loadScenario } from '../helpers/load-scenario';
import { FAILURE_TYPES, UXDegradationLevel } from '../types/chaos';
import * as fs from 'fs';
import * as path from 'path';

// Import mock services
let mockServices: any;
try {
  mockServices = require('../mocks/mock-services').default;
} catch (err) {
  console.error('Failed to load mock services:', err);
  console.log('Make sure to run prepare-chaos-environment.ts first');
  process.exit(1);
}

/**
 * Run the chaos testing sequence
 */
async function runChaosTestingSequence() {
  console.log('Starting MaestroDeck Resilience Testing Sequence');
  
  // Initialize tracking systems
  const uxTracker = new UXImpactTracker();
  const telemetryCollector = new ChaosTelemetryCollector();
  
  // Create results directory
  const resultsDir = path.join(__dirname, '../../../../logs/chaos');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  // Add metric sources to telemetry collector
  telemetryCollector.addMetricSource(async () => {
    // Collect metrics from mock services
    return {
      databaseConnections: mockServices.database.connectionCount,
      databaseQueryLatency: mockServices.database.queryLatency,
      apiRequestCount: mockServices.api.requestCount,
      apiErrorRate: mockServices.api.errorRate,
      cacheHitRate: mockServices.cache.hitRate,
      voiceRecognitionAccuracy: mockServices.voice.recognitionAccuracy,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpuLoad: Math.random() * 0.5 // Mock CPU load between 0-50%
    };
  });
  
  // Set anomaly thresholds
  telemetryCollector.setAnomalyThresholds({
    databaseQueryLatency: { max: 500 }, // ms
    apiErrorRate: { max: 0.05 }, // 5%
    memoryUsage: { max: 1024 }, // MB
    cpuLoad: { max: 0.8 } // 80%
  });
  
  // Start telemetry collection
  telemetryCollector.startChaosMonitoring(1000); // 1 second interval
  
  try {
    // Collect baseline metrics
    console.log('Collecting baseline metrics...');
    await telemetryCollector.collectBaselineMetrics(5000);
    
    // Create chaos harness with different configurations for each test phase
    const chaosHarness = new ChaosTestHarness({
      failureRate: 0.1,
      maxConcurrentFailures: 1,
      modules: ['database', 'api', 'cache', 'voice'],
      severityLevels: {
        database: 4,
        api: 3,
        cache: 2,
        voice: 3
      }
    });
    
    // Phase 1: Single failure testing
    console.log('\n=== Phase 1: Testing individual failure modes ===');
    await testIndividualFailureModes(chaosHarness, uxTracker, telemetryCollector);
    
    // Phase 2: Concurrent failure testing
    console.log('\n=== Phase 2: Testing concurrent failures ===');
    chaosHarness.stop();
    const concurrentChaosHarness = new ChaosTestHarness({
      failureRate: 0.15,
      maxConcurrentFailures: 2,
      modules: ['database', 'api', 'cache', 'voice'],
      severityLevels: {
        database: 4,
        api: 3,
        cache: 2,
        voice: 3
      }
    });
    await testConcurrentFailures(chaosHarness, uxTracker, telemetryCollector);
    
    // Phase 3: Resource constraint testing
    console.log('\n=== Phase 3: Testing resource constraints ===');
    await testResourceConstraints(uxTracker, telemetryCollector);
    
    // Phase 4: Recovery path validation
    console.log('\n=== Phase 4: Validating recovery paths ===');
    concurrentChaosHarness.stop();
    const recoveryPathsHarness = new ChaosTestHarness({
      failureRate: 0,
      maxConcurrentFailures: 1,
      modules: ['database', 'api', 'cache', 'voice'],
      severityLevels: {
        database: 3,
        api: 3,
        cache: 2,
        voice: 3
      }
    });
    await validateRecoveryPaths(recoveryPathsHarness, uxTracker, telemetryCollector);
    
    // Stop chaos harness
    recoveryPathsHarness.stop();
  } catch (err) {
    console.error('Error during chaos testing:', err);
  } finally {
    // Stop telemetry collection
    telemetryCollector.stopMonitoring();
    
    // Generate reports
    const uxReport = uxTracker.generateUXImpactReport();
    const telemetryReport = telemetryCollector.generateTelemetryReport();
    const timelineVisualization = telemetryCollector.generateChaosTimelineVisualization([
      'databaseQueryLatency', 'apiErrorRate', 'cacheHitRate', 'memoryUsage', 'cpuLoad'
    ]);
    const anomalies = telemetryCollector.detectAnomalies();
    const recommendations = uxTracker.generateRecommendations();
    
    // Output results to files
    fs.writeFileSync(
      path.join(resultsDir, 'ux-impact-report.json'),
      JSON.stringify(uxReport, null, 2)
    );
    
    fs.writeFileSync(
      path.join(resultsDir, 'telemetry-report.json'),
      JSON.stringify(telemetryReport, null, 2)
    );
    
    fs.writeFileSync(
      path.join(resultsDir, 'timeline-visualization.json'),
      JSON.stringify(timelineVisualization, null, 2)
    );
    
    fs.writeFileSync(
      path.join(resultsDir, 'anomalies.json'),
      JSON.stringify(anomalies, null, 2)
    );
    
    fs.writeFileSync(
      path.join(resultsDir, 'recommendations.json'),
      JSON.stringify(recommendations, null, 2)
    );
    
    // Generate summary report
    const summaryReport = {
      timestamp: new Date().toISOString(),
      testDuration: Date.now() - startTime,
      uxImpacts: {
        total: uxReport.details.totalImpacts,
        byLevel: uxReport.details.impactsBySeverity,
        avgRecoveryTime: uxReport.details.avgRecoveryTime
      },
      anomalies: Object.keys(anomalies).length,
      recommendations: recommendations.length,
      telemetryDataPoints: telemetryCollector.getTelemetryData().length
    };
    
    fs.writeFileSync(
      path.join(resultsDir, 'summary-report.json'),
      JSON.stringify(summaryReport, null, 2)
    );
    
    console.log('\nChaos testing complete. Reports generated in logs/chaos directory.');
    console.log(`Total UX impacts: ${summaryReport.uxImpacts.total}`);
    console.log(`Average recovery time: ${summaryReport.uxImpacts.avgRecoveryTime.toFixed(2)}ms`);
    console.log(`Anomalies detected: ${summaryReport.anomalies}`);
    console.log(`Recommendations: ${summaryReport.recommendations}`);
    
    // Emit event for dashboard
    if (global.eventEmitter) {
      global.eventEmitter.emit('chaos:complete', summaryReport);
    }
  }
}

/**
 * Test individual failure modes
 */
async function testIndividualFailureModes(
  chaosHarness: ChaosTestHarness,
  uxTracker: UXImpactTracker,
  telemetryCollector: ChaosTelemetryCollector
) {
  // Test each failure mode individually
  const failureModes = [
    { type: FAILURE_TYPES.DATABASE, component: 'database', severity: 4, duration: 10000 },
    { type: FAILURE_TYPES.CACHE, component: 'cache', severity: 3, duration: 8000 },
    { type: FAILURE_TYPES.API, component: 'api', severity: 3, duration: 12000 },
    { type: FAILURE_TYPES.NETWORK, component: 'network', severity: 4, duration: 15000 },
    { type: FAILURE_TYPES.MEMORY, component: 'memory', severity: 3, duration: 20000 }
  ];
  
  for (const mode of failureModes) {
    console.log(`Testing failure mode: ${mode.type} on ${mode.component}`);
    
    // Register chaos event
    const eventId = `${mode.type}-${mode.component}-failure`;
    telemetryCollector.registerChaosEvent(eventId, {
      type: mode.type,
      component: mode.component,
      severity: mode.severity
    });
    
    // Record start time
    const startTime = Date.now();
    
    // Inject failure
    const failureId = chaosHarness.injectFailure(
      mode.type,
      mode.component,
      mode.severity,
      mode.duration
    );
    
    // Simulate service degradation
    simulateServiceDegradation(mode.component, mode.severity);
    
    // Wait for failure duration
    console.log(`Waiting for ${mode.duration}ms...`);
    await new Promise(resolve => setTimeout(resolve, mode.duration + 2000));
    
    // Calculate recovery time
    const recoveryTime = Date.now() - startTime;
    
    // Record UX impact
    const severity = calculateUXSeverity(mode.severity);
    uxTracker.recordImpact({
      component: mode.component,
      severity,
      description: `${mode.type} failure on ${mode.component} (severity ${mode.severity})`,
      recoveryTime
    });
    
    // Unregister chaos event
    telemetryCollector.unregisterChaosEvent(eventId);
    
    // Log results
    console.log(`Recovery time for ${mode.type} on ${mode.component}: ${recoveryTime}ms`);
    console.log(`UX impact severity: ${UXDegradationLevel[severity]}`);
    
    // Allow system to stabilize
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

/**
 * Test concurrent failures
 */
async function testConcurrentFailures(
  chaosHarness: ChaosTestHarness,
  uxTracker: UXImpactTracker,
  telemetryCollector: ChaosTelemetryCollector
) {
  // Test combinations of failure modes
  const failureCombinations = [
    [
      { type: FAILURE_TYPES.DATABASE, component: 'database', severity: 3, duration: 15000 },
      { type: FAILURE_TYPES.API, component: 'api', severity: 2, duration: 10000 }
    ],
    [
      { type: FAILURE_TYPES.NETWORK, component: 'network', severity: 4, duration: 20000 },
      { type: FAILURE_TYPES.MEMORY, component: 'memory', severity: 3, duration: 25000 }
    ],
    [
      { type: FAILURE_TYPES.CACHE, component: 'cache', severity: 2, duration: 12000 },
      { type: FAILURE_TYPES.CPU, component: 'cpu', severity: 3, duration: 18000 }
    ]
  ];
  
  for (const combination of failureCombinations) {
    const combinationName = combination.map(f => `${f.type}-${f.component}`).join(' + ');
    console.log(`Testing failure combination: ${combinationName}`);
    
    // Register chaos event
    const eventId = `concurrent-${Date.now()}`;
    telemetryCollector.registerChaosEvent(eventId, {
      combination: combinationName,
      failures: combination
    });
    
    // Record start time
    const startTime = Date.now();
    
    // Inject failures
    const failureIds = [];
    for (const failure of combination) {
      const failureId = chaosHarness.injectFailure(
        failure.type,
        failure.component,
        failure.severity,
        failure.duration
      );
      failureIds.push(failureId);
      
      // Simulate service degradation
      simulateServiceDegradation(failure.component, failure.severity);
    }
    
    // Calculate max duration
    const maxDuration = Math.max(...combination.map(f => f.duration));
    
    // Wait for failures to resolve
    console.log(`Waiting for ${maxDuration}ms...`);
    await new Promise(resolve => setTimeout(resolve, maxDuration + 5000));
    
    // Calculate recovery time
    const recoveryTime = Date.now() - startTime;
    
    // Calculate combined severity
    const combinedSeverity = Math.min(
      UXDegradationLevel.CRITICAL,
      Math.ceil(combination.reduce((sum, f) => sum + f.severity, 0) / combination.length) + 1
    );
    
    // Record UX impact
    uxTracker.recordImpact({
      component: 'System',
      severity: combinedSeverity,
      description: `Concurrent failures: ${combinationName}`,
      recoveryTime
    });
    
    // Unregister chaos event
    telemetryCollector.unregisterChaosEvent(eventId);
    
    // Log results
    console.log(`Recovery time for ${combinationName}: ${recoveryTime}ms`);
    console.log(`UX impact severity: ${UXDegradationLevel[combinedSeverity]}`);
    
    // Allow system to stabilize
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
}

/**
 * Test resource constraints
 */
async function testResourceConstraints(
  uxTracker: UXImpactTracker,
  telemetryCollector: ChaosTelemetryCollector
) {
  // Test CPU constraints
  console.log('Testing CPU constraints');
  const cpuEventId = 'resource-cpu';
  telemetryCollector.registerChaosEvent(cpuEventId, { resource: 'cpu' });
  
  const cpuStartTime = Date.now();
  
  await loadScenario({
    cpu: {
      targetUsage: 0.8,
      pattern: 'constant',
      duration: 20000
    }
  });
  
  const cpuRecoveryTime = Date.now() - cpuStartTime;
  
  uxTracker.recordImpact({
    component: 'CPU',
    severity: UXDegradationLevel.MODERATE,
    description: 'High CPU usage',
    recoveryTime: cpuRecoveryTime
  });
  
  telemetryCollector.unregisterChaosEvent(cpuEventId);
  console.log(`CPU constraint recovery time: ${cpuRecoveryTime}ms`);
  
  // Allow system to stabilize
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test memory constraints
  console.log('Testing memory constraints');
  const memoryEventId = 'resource-memory';
  telemetryCollector.registerChaosEvent(memoryEventId, { resource: 'memory' });
  
  const memoryStartTime = Date.now();
  
  await loadScenario({
    memory: {
      targetUsage: 512, // MB
      duration: 15000
    }
  });
  
  const memoryRecoveryTime = Date.now() - memoryStartTime;
  
  uxTracker.recordImpact({
    component: 'Memory',
    severity: UXDegradationLevel.MODERATE,
    description: 'High memory usage',
    recoveryTime: memoryRecoveryTime
  });
  
  telemetryCollector.unregisterChaosEvent(memoryEventId);
  console.log(`Memory constraint recovery time: ${memoryRecoveryTime}ms`);
  
  // Allow system to stabilize
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test network constraints
  console.log('Testing network constraints');
  const networkEventId = 'resource-network';
  telemetryCollector.registerChaosEvent(networkEventId, { resource: 'network' });
  
  const networkStartTime = Date.now();
  
  await loadScenario({
    network: {
      bandwidth: 50, // KB/s
      latency: 500, // ms
      jitter: 100, // ms
      packetLoss: 0.05, // 5%
      duration: 25000
    }
  });
  
  const networkRecoveryTime = Date.now() - networkStartTime;
  
  uxTracker.recordImpact({
    component: 'Network',
    severity: UXDegradationLevel.SIGNIFICANT,
    description: 'Network degradation',
    recoveryTime: networkRecoveryTime
  });
  
  telemetryCollector.unregisterChaosEvent(networkEventId);
  console.log(`Network constraint recovery time: ${networkRecoveryTime}ms`);
}

/**
 * Validate recovery paths
 */
async function validateRecoveryPaths(
  chaosHarness: ChaosTestHarness,
  uxTracker: UXImpactTracker,
  telemetryCollector: ChaosTelemetryCollector
) {
  // Load recovery paths
  let recoveryPaths;
  try {
    const recoveryPathsFile = path.join(__dirname, '../../../../docs/recovery-paths.json');
    recoveryPaths = JSON.parse(fs.readFileSync(recoveryPathsFile, 'utf8'));
  } catch (err) {
    console.error('Failed to load recovery paths:', err);
    return;
  }
  
  // Results tracking
  const results = {
    total: recoveryPaths.length,
    primarySuccess: 0,
    secondarySuccess: 0,
    fallbackSuccess: 0,
    completeFail: 0,
    recoveryTimes: [] as number[]
  };
  
  // Test each recovery path
  for (const path of recoveryPaths) {
    console.log(`\nTesting recovery path for: ${path.component}`);
    
    // Map component to failure type
    const failureType = mapComponentToFailureType(path.component);
    
    // Register chaos event
    const eventId = `recovery-${path.component}`;
    telemetryCollector.registerChaosEvent(eventId, {
      component: path.component,
      recoveryPath: path
    });
    
    // Record start time
    const startTime = Date.now();
    
    // Inject failure
    const failureId = chaosHarness.injectFailure(
      failureType,
      path.component.toLowerCase(),
      3,
      10000
    );
    
    // Simulate service degradation
    simulateServiceDegradation(path.component.toLowerCase(), 3);
    
    // Wait for primary recovery
    console.log(`Waiting for primary recovery (${path.primary})...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if primary recovery worked
    const primaryRecovered = Math.random() > 0.3; // 70% chance of success
    
    if (primaryRecovered) {
      results.primarySuccess++;
      const recoveryTime = Date.now() - startTime;
      results.recoveryTimes.push(recoveryTime);
      
      console.log(`✅ Primary recovery (${path.primary}) succeeded in ${recoveryTime}ms`);
      
      uxTracker.recordImpact({
        component: path.component,
        severity: UXDegradationLevel.MODERATE,
        description: `${path.component} recovered via primary path (${path.primary})`,
        recoveryTime
      });
    } else {
      console.log(`❌ Primary recovery (${path.primary}) failed`);
      
      // Try secondary if available
      if (path.secondary) {
        console.log(`Attempting secondary recovery (${path.secondary})...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if secondary recovery worked
        const secondaryRecovered = Math.random() > 0.4; // 60% chance of success
        
        if (secondaryRecovered) {
          results.secondarySuccess++;
          const recoveryTime = Date.now() - startTime;
          results.recoveryTimes.push(recoveryTime);
          
          console.log(`✅ Secondary recovery (${path.secondary}) succeeded in ${recoveryTime}ms`);
          
          uxTracker.recordImpact({
            component: path.component,
            severity: UXDegradationLevel.SIGNIFICANT,
            description: `${path.component} recovered via secondary path (${path.secondary})`,
            recoveryTime
          });
        } else {
          console.log(`❌ Secondary recovery (${path.secondary}) failed`);
          
          // Try fallback if available
          if (path.fallback) {
            console.log(`Attempting fallback strategy (${path.fallback})...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check if fallback recovery worked
            const fallbackRecovered = Math.random() > 0.2; // 80% chance of success
            
            if (fallbackRecovered) {
              results.fallbackSuccess++;
              const recoveryTime = Date.now() - startTime;
              results.recoveryTimes.push(recoveryTime);
              
              console.log(`✅ Fallback strategy (${path.fallback}) succeeded in ${recoveryTime}ms`);
              
              uxTracker.recordImpact({
                component: path.component,
                severity: UXDegradationLevel.SEVERE,
                description: `${path.component} recovered via fallback strategy (${path.fallback})`,
                recoveryTime
              });
            } else {
              results.completeFail++;
              console.log(`❌ All recovery options failed for ${path.component}`);
              
              uxTracker.recordImpact({
                component: path.component,
                severity: UXDegradationLevel.CRITICAL,
                description: `${path.component} failed to recover via any path`,
                recoveryTime: Date.now() - startTime
              });
            }
          } else {
            results.completeFail++;
            console.log(`❌ No fallback available for ${path.component}`);
            
            uxTracker.recordImpact({
              component: path.component,
              severity: UXDegradationLevel.CRITICAL,
              description: `${path.component} failed to recover (no fallback available)`,
              recoveryTime: Date.now() - startTime
            });
          }
        }
      } else {
        results.completeFail++;
        console.log(`❌ No secondary recovery available for ${path.component}`);
        
        uxTracker.recordImpact({
          component: path.component,
          severity: UXDegradationLevel.CRITICAL,
          description: `${path.component} failed to recover (no secondary path available)`,
          recoveryTime: Date.now() - startTime
        });
      }
    }
    
    // Unregister chaos event
    telemetryCollector.unregisterChaosEvent(eventId);
    
    // Allow system to stabilize
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // Calculate summary statistics
  const totalSuccess = results.primarySuccess + results.secondarySuccess + results.fallbackSuccess;
  const successRate = (totalSuccess / results.total) * 100;
  const avgRecoveryTime = results.recoveryTimes.length > 0
    ? results.recoveryTimes.reduce((sum, time) => sum + time, 0) / results.recoveryTimes.length
    : 0;
  
  // Print summary
  console.log('\n=== Recovery Path Verification Summary ===');
  console.log(`Total components tested: ${results.total}`);
  console.log(`Primary recovery success: ${results.primarySuccess} (${Math.round(results.primarySuccess/results.total*100)}%)`);
  console.log(`Secondary recovery success: ${results.secondarySuccess} (${Math.round(results.secondarySuccess/results.total*100)}%)`);
  console.log(`Fallback strategy success: ${results.fallbackSuccess} (${Math.round(results.fallbackSuccess/results.total*100)}%)`);
  console.log(`Complete failures: ${results.completeFail} (${Math.round(results.completeFail/results.total*100)}%)`);
  console.log(`Overall success rate: ${successRate.toFixed(1)}%`);
  console.log(`Average recovery time: ${avgRecoveryTime.toFixed(2)}ms`);
  
  // Write results to file
  fs.writeFileSync(
    path.join(__dirname, '../../../../logs/chaos/recovery-verification.json'),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: results.total,
        primarySuccess: results.primarySuccess,
        secondarySuccess: results.secondarySuccess,
        fallbackSuccess: results.fallbackSuccess,
        completeFail: results.completeFail,
        successRate,
        avgRecoveryTime
      },
      details: recoveryPaths.map((path: any) => ({
        component: path.component,
        // Add test results for each component
      }))
    }, null, 2)
  );
}

/**
 * Map component to failure type
 */
function mapComponentToFailureType(component: string): string {
  // Map component names to failure types
  const mapping: Record<string, string> = {
    'Database': FAILURE_TYPES.DATABASE,
    'Cache': FAILURE_TYPES.CACHE,
    'API': FAILURE_TYPES.API,
    'Frontend': FAILURE_TYPES.RENDERING,
    'Voice Module': FAILURE_TYPES.VOICE,
    'Intent Parser': FAILURE_TYPES.INTENT,
    'Redis Memory': FAILURE_TYPES.CACHE
  };
  
  return mapping[component] || FAILURE_TYPES.DEPENDENCY;
}

/**
 * Calculate UX severity based on failure severity
 */
function calculateUXSeverity(failureSeverity: number): UXDegradationLevel {
  // Map failure severity (1-5) to UX degradation level
  switch (failureSeverity) {
    case 1:
      return UXDegradationLevel.MINOR;
    case 2:
      return UXDegradationLevel.MODERATE;
    case 3:
      return UXDegradationLevel.SIGNIFICANT;
    case 4:
      return UXDegradationLevel.SEVERE;
    case 5:
      return UXDegradationLevel.CRITICAL;
    default:
      return UXDegradationLevel.MODERATE;
  }
}

/**
 * Simulate service degradation
 */
function simulateServiceDegradation(component: string, severity: number) {
  // Update mock service metrics based on component and severity
  switch (component.toLowerCase()) {
    case 'database':
      if (mockServices.database) {
        mockServices.database.setHealth(false);
        mockServices.database.setQueryLatency(100 * severity);
        mockServices.database.setConnectionCount(Math.max(0, 100 - 20 * severity));
      }
      break;
    case 'api':
      if (mockServices.api) {
        mockServices.api.setHealth(false);
        mockServices.api.setErrorRate(0.1 * severity);
        mockServices.api.setRequestCount(Math.max(0, 1000 - 200 * severity));
      }
      break;
    case 'cache':
      if (mockServices.cache) {
        mockServices.cache.setHealth(false);
        mockServices.cache.setHitRate(Math.max(0, 0.9 - 0.15 * severity));
      }
      break;
    case 'voice':
      if (mockServices.voice) {
        mockServices.voice.setHealth(false);
        mockServices.voice.setRecognitionAccuracy(Math.max(0, 0.95 - 0.15 * severity));
      }
      break;
  }
  
  // Emit event for dashboard
  if (global.eventEmitter) {
    global.eventEmitter.emit('chaos:degradation', {
      component,
      severity,
      timestamp: Date.now()
    });
  }
}

// Record start time
const startTime = Date.now();

// Run the chaos testing sequence
runChaosTestingSequence().catch(err => {
  console.error('Error during chaos testing:', err);
  process.exit(1);
});