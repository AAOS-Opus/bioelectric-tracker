/**
 * Load Scenario
 * 
 * This file provides utilities for simulating load scenarios during chaos testing.
 */

import { LoadScenario } from '../types/chaos';

/**
 * Load a scenario
 * 
 * @param scenario Load scenario configuration
 * @returns Promise that resolves when the scenario is complete
 */
export async function loadScenario(scenario: LoadScenario): Promise<void> {
  console.log('Loading scenario:', JSON.stringify(scenario, null, 2));
  
  // Track active constraints
  const activeConstraints: string[] = [];
  
  // Apply CPU constraint
  if (scenario.cpu) {
    activeConstraints.push('cpu');
    console.log(`Applying CPU constraint: target=${scenario.cpu.targetUsage}, duration=${scenario.cpu.duration}ms`);
    
    // Emit event for dashboard
    if (global.eventEmitter) {
      global.eventEmitter.emit('chaos:degradation', {
        component: 'CPU',
        severity: Math.ceil(scenario.cpu.targetUsage * 5), // Scale 0-1 to 1-5
        timestamp: Date.now()
      });
    }
    
    // Start CPU load
    const cpuLoadPromise = applyCpuLoad(scenario.cpu.targetUsage, scenario.cpu.pattern, scenario.cpu.duration);
    
    // Wait for CPU load to complete
    cpuLoadPromise.then(() => {
      console.log('CPU constraint completed');
      activeConstraints.splice(activeConstraints.indexOf('cpu'), 1);
    });
  }
  
  // Apply memory constraint
  if (scenario.memory) {
    activeConstraints.push('memory');
    console.log(`Applying memory constraint: target=${scenario.memory.targetUsage}MB, duration=${scenario.memory.duration}ms`);
    
    // Emit event for dashboard
    if (global.eventEmitter) {
      global.eventEmitter.emit('chaos:degradation', {
        component: 'Memory',
        severity: Math.ceil((scenario.memory.targetUsage / 1024) * 5), // Scale based on GB
        timestamp: Date.now()
      });
    }
    
    // Start memory load
    const memoryLoadPromise = applyMemoryLoad(scenario.memory.targetUsage, scenario.memory.duration);
    
    // Wait for memory load to complete
    memoryLoadPromise.then(() => {
      console.log('Memory constraint completed');
      activeConstraints.splice(activeConstraints.indexOf('memory'), 1);
    });
  }
  
  // Apply network constraint
  if (scenario.network) {
    activeConstraints.push('network');
    console.log(`Applying network constraint: bandwidth=${scenario.network.bandwidth}KB/s, latency=${scenario.network.latency}ms, duration=${scenario.network.duration}ms`);
    
    // Emit event for dashboard
    if (global.eventEmitter) {
      global.eventEmitter.emit('chaos:degradation', {
        component: 'Network',
        severity: calculateNetworkSeverity(scenario.network),
        timestamp: Date.now()
      });
    }
    
    // Start network constraint
    const networkConstraintPromise = applyNetworkConstraint(scenario.network);
    
    // Wait for network constraint to complete
    networkConstraintPromise.then(() => {
      console.log('Network constraint completed');
      activeConstraints.splice(activeConstraints.indexOf('network'), 1);
    });
  }
  
  // Apply disk constraint
  if (scenario.disk) {
    activeConstraints.push('disk');
    console.log(`Applying disk constraint: latency=${scenario.disk.latency}ms, errorRate=${scenario.disk.errorRate}, duration=${scenario.disk.duration}ms`);
    
    // Emit event for dashboard
    if (global.eventEmitter) {
      global.eventEmitter.emit('chaos:degradation', {
        component: 'Disk',
        severity: calculateDiskSeverity(scenario.disk),
        timestamp: Date.now()
      });
    }
    
    // Start disk constraint
    const diskConstraintPromise = applyDiskConstraint(scenario.disk);
    
    // Wait for disk constraint to complete
    diskConstraintPromise.then(() => {
      console.log('Disk constraint completed');
      activeConstraints.splice(activeConstraints.indexOf('disk'), 1);
    });
  }
  
  // Wait for all constraints to complete
  while (activeConstraints.length > 0) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('All constraints completed');
}

/**
 * Apply CPU load
 * 
 * @param targetUsage Target CPU usage (0-1)
 * @param pattern Load pattern
 * @param duration Duration in milliseconds
 * @returns Promise that resolves when the load is complete
 */
async function applyCpuLoad(
  targetUsage: number,
  pattern: string = 'constant',
  duration: number
): Promise<void> {
  return new Promise(resolve => {
    const startTime = Date.now();
    let intervalId: NodeJS.Timeout;
    
    // Function to perform CPU-intensive work
    const burnCpu = (intensity: number, duration: number) => {
      const endTime = Date.now() + duration;
      
      // Perform CPU-intensive work
      while (Date.now() < endTime) {
        // Adjust work based on intensity
        if (Math.random() < intensity) {
          // Do some meaningless calculations
          for (let i = 0; i < 1000; i++) {
            Math.sqrt(Math.random() * 10000);
          }
        } else {
          // Give the CPU a break
          setTimeout(() => {}, 0);
        }
      }
    };
    
    switch (pattern) {
      case 'spike':
        // Create periodic spikes of CPU usage
        intervalId = setInterval(() => {
          const elapsed = Date.now() - startTime;
          
          if (elapsed >= duration) {
            clearInterval(intervalId);
            resolve();
            return;
          }
          
          // Spike to target usage
          burnCpu(targetUsage, 1000);
          
          // Rest for a bit
          setTimeout(() => {}, 1000);
        }, 5000);
        break;
        
      case 'oscillating':
        // Oscillate CPU usage
        intervalId = setInterval(() => {
          const elapsed = Date.now() - startTime;
          
          if (elapsed >= duration) {
            clearInterval(intervalId);
            resolve();
            return;
          }
          
          // Calculate oscillating usage
          const phase = (elapsed % 10000) / 10000; // 0-1 over 10 seconds
          const usage = targetUsage * (0.5 + 0.5 * Math.sin(phase * 2 * Math.PI));
          
          // Apply load
          burnCpu(usage, 1000);
        }, 1000);
        break;
        
      case 'constant':
      default:
        // Constant CPU usage
        intervalId = setInterval(() => {
          const elapsed = Date.now() - startTime;
          
          if (elapsed >= duration) {
            clearInterval(intervalId);
            resolve();
            return;
          }
          
          // Apply constant load
          burnCpu(targetUsage, 1000);
        }, 1000);
        break;
    }
    
    // Ensure we resolve after the duration
    setTimeout(() => {
      clearInterval(intervalId);
      resolve();
    }, duration);
  });
}

/**
 * Apply memory load
 * 
 * @param targetUsage Target memory usage in MB
 * @param duration Duration in milliseconds
 * @returns Promise that resolves when the load is complete
 */
async function applyMemoryLoad(targetUsage: number, duration: number): Promise<void> {
  return new Promise(resolve => {
    const startTime = Date.now();
    
    // Allocate memory
    const memoryChunks: any[] = [];
    const chunkSize = 1024 * 1024; // 1MB
    const targetChunks = Math.floor(targetUsage);
    
    console.log(`Allocating ${targetChunks} chunks of ${chunkSize} bytes...`);
    
    // Allocate memory in chunks
    for (let i = 0; i < targetChunks; i++) {
      try {
        // Allocate a chunk of memory
        const chunk = Buffer.alloc(chunkSize);
        
        // Fill with random data to prevent optimization
        for (let j = 0; j < chunkSize; j += 1024) {
          chunk[j] = Math.floor(Math.random() * 256);
        }
        
        memoryChunks.push(chunk);
        
        // Log progress
        if (i % 10 === 0) {
          console.log(`Allocated ${i} chunks (${i * chunkSize / (1024 * 1024)}MB)`);
        }
        
        // Check if we've reached the duration
        if (Date.now() - startTime >= duration) {
          break;
        }
      } catch (err) {
        console.error('Error allocating memory:', err);
        break;
      }
    }
    
    console.log(`Allocated ${memoryChunks.length} chunks (${memoryChunks.length * chunkSize / (1024 * 1024)}MB)`);
    
    // Hold the memory for the duration
    setTimeout(() => {
      // Release memory
      for (let i = 0; i < memoryChunks.length; i++) {
        memoryChunks[i] = null;
      }
      
      // Force garbage collection if possible
      if (global.gc) {
        global.gc();
      }
      
      console.log('Memory released');
      resolve();
    }, Math.max(0, duration - (Date.now() - startTime)));
  });
}

/**
 * Apply network constraint
 * 
 * @param network Network constraint configuration
 * @returns Promise that resolves when the constraint is complete
 */
async function applyNetworkConstraint(network: any): Promise<void> {
  return new Promise(resolve => {
    console.log('Simulating network constraint...');
    
    // In a real implementation, this would use OS-level tools to throttle network
    // For this simulation, we'll just wait for the duration
    
    setTimeout(() => {
      console.log('Network constraint simulation complete');
      resolve();
    }, network.duration);
  });
}

/**
 * Apply disk constraint
 * 
 * @param disk Disk constraint configuration
 * @returns Promise that resolves when the constraint is complete
 */
async function applyDiskConstraint(disk: any): Promise<void> {
  return new Promise(resolve => {
    console.log('Simulating disk constraint...');
    
    // In a real implementation, this would use OS-level tools to introduce disk latency
    // For this simulation, we'll just wait for the duration
    
    setTimeout(() => {
      console.log('Disk constraint simulation complete');
      resolve();
    }, disk.duration);
  });
}

/**
 * Calculate network constraint severity
 * 
 * @param network Network constraint configuration
 * @returns Severity level (1-5)
 */
function calculateNetworkSeverity(network: any): number {
  let severity = 1;
  
  // Bandwidth constraint
  if (network.bandwidth) {
    if (network.bandwidth < 50) severity = Math.max(severity, 5);
    else if (network.bandwidth < 100) severity = Math.max(severity, 4);
    else if (network.bandwidth < 200) severity = Math.max(severity, 3);
    else if (network.bandwidth < 500) severity = Math.max(severity, 2);
  }
  
  // Latency constraint
  if (network.latency) {
    if (network.latency > 1000) severity = Math.max(severity, 5);
    else if (network.latency > 500) severity = Math.max(severity, 4);
    else if (network.latency > 200) severity = Math.max(severity, 3);
    else if (network.latency > 100) severity = Math.max(severity, 2);
  }
  
  // Packet loss constraint
  if (network.packetLoss) {
    if (network.packetLoss > 0.2) severity = Math.max(severity, 5);
    else if (network.packetLoss > 0.1) severity = Math.max(severity, 4);
    else if (network.packetLoss > 0.05) severity = Math.max(severity, 3);
    else if (network.packetLoss > 0.01) severity = Math.max(severity, 2);
  }
  
  return severity;
}

/**
 * Calculate disk constraint severity
 * 
 * @param disk Disk constraint configuration
 * @returns Severity level (1-5)
 */
function calculateDiskSeverity(disk: any): number {
  let severity = 1;
  
  // Latency constraint
  if (disk.latency) {
    if (disk.latency > 500) severity = Math.max(severity, 5);
    else if (disk.latency > 200) severity = Math.max(severity, 4);
    else if (disk.latency > 100) severity = Math.max(severity, 3);
    else if (disk.latency > 50) severity = Math.max(severity, 2);
  }
  
  // Error rate constraint
  if (disk.errorRate) {
    if (disk.errorRate > 0.2) severity = Math.max(severity, 5);
    else if (disk.errorRate > 0.1) severity = Math.max(severity, 4);
    else if (disk.errorRate > 0.05) severity = Math.max(severity, 3);
    else if (disk.errorRate > 0.01) severity = Math.max(severity, 2);
  }
  
  return severity;
}