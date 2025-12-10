/**
 * Performance Benchmarking Utility
 * 
 * This utility provides tools for measuring and comparing performance metrics
 * across different implementations and optimizations.
 */

import { performance } from 'perf_hooks';

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  medianTime: number;
  p95Time: number; // 95th percentile
  p99Time: number; // 99th percentile
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface BenchmarkOptions {
  iterations?: number;
  warmupIterations?: number;
  name?: string;
  metadata?: Record<string, any>;
  onProgress?: (iteration: number, totalIterations: number) => void;
}

const DEFAULT_OPTIONS: BenchmarkOptions = {
  iterations: 100,
  warmupIterations: 5,
  name: 'Unnamed Benchmark'
};

/**
 * Run a benchmark on a synchronous function
 */
export async function benchmark<T>(
  fn: () => T,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { iterations, warmupIterations, name, metadata, onProgress } = opts;
  
  // Warmup phase
  for (let i = 0; i < warmupIterations!; i++) {
    fn();
  }
  
  // Benchmark phase
  const times: number[] = [];
  
  for (let i = 0; i < iterations!; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
    
    if (onProgress) {
      onProgress(i + 1, iterations!);
    }
  }
  
  // Sort times for percentile calculations
  times.sort((a, b) => a - b);
  
  // Calculate statistics
  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations!;
  const minTime = times[0];
  const maxTime = times[times.length - 1];
  const medianTime = times[Math.floor(times.length / 2)];
  const p95Index = Math.floor(times.length * 0.95);
  const p99Index = Math.floor(times.length * 0.99);
  const p95Time = times[p95Index];
  const p99Time = times[p99Index];
  
  return {
    name: name!,
    iterations: iterations!,
    totalTime,
    averageTime,
    minTime,
    maxTime,
    medianTime,
    p95Time,
    p99Time,
    timestamp: new Date(),
    metadata
  };
}

/**
 * Run a benchmark on an asynchronous function
 */
export async function benchmarkAsync<T>(
  fn: () => Promise<T>,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { iterations, warmupIterations, name, metadata, onProgress } = opts;
  
  // Warmup phase
  for (let i = 0; i < warmupIterations!; i++) {
    await fn();
  }
  
  // Benchmark phase
  const times: number[] = [];
  
  for (let i = 0; i < iterations!; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
    
    if (onProgress) {
      onProgress(i + 1, iterations!);
    }
  }
  
  // Sort times for percentile calculations
  times.sort((a, b) => a - b);
  
  // Calculate statistics
  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations!;
  const minTime = times[0];
  const maxTime = times[times.length - 1];
  const medianTime = times[Math.floor(times.length / 2)];
  const p95Index = Math.floor(times.length * 0.95);
  const p99Index = Math.floor(times.length * 0.99);
  const p95Time = times[p95Index];
  const p99Time = times[p99Index];
  
  return {
    name: name!,
    iterations: iterations!,
    totalTime,
    averageTime,
    minTime,
    maxTime,
    medianTime,
    p95Time,
    p99Time,
    timestamp: new Date(),
    metadata
  };
}

/**
 * Compare multiple implementations and return the results
 */
export async function compareBenchmarks(
  implementations: Record<string, () => any>,
  options: BenchmarkOptions = {}
): Promise<Record<string, BenchmarkResult>> {
  const results: Record<string, BenchmarkResult> = {};
  
  for (const [name, fn] of Object.entries(implementations)) {
    const result = await benchmark(fn, {
      ...options,
      name
    });
    
    results[name] = result;
  }
  
  return results;
}

/**
 * Compare multiple async implementations and return the results
 */
export async function compareBenchmarksAsync(
  implementations: Record<string, () => Promise<any>>,
  options: BenchmarkOptions = {}
): Promise<Record<string, BenchmarkResult>> {
  const results: Record<string, BenchmarkResult> = {};
  
  for (const [name, fn] of Object.entries(implementations)) {
    const result = await benchmarkAsync(fn, {
      ...options,
      name
    });
    
    results[name] = result;
  }
  
  return results;
}

/**
 * Format benchmark results as a table string
 */
export function formatBenchmarkResults(results: Record<string, BenchmarkResult>): string {
  const headers = ['Name', 'Avg (ms)', 'Min (ms)', 'Max (ms)', 'Median (ms)', 'p95 (ms)', 'p99 (ms)'];
  const rows: string[][] = [];
  
  for (const [name, result] of Object.entries(results)) {
    rows.push([
      name,
      result.averageTime.toFixed(3),
      result.minTime.toFixed(3),
      result.maxTime.toFixed(3),
      result.medianTime.toFixed(3),
      result.p95Time.toFixed(3),
      result.p99Time.toFixed(3)
    ]);
  }
  
  // Calculate column widths
  const colWidths = headers.map((h, i) => {
    const maxRowWidth = Math.max(...rows.map(row => row[i].length));
    return Math.max(h.length, maxRowWidth) + 2;
  });
  
  // Create separator line
  const separator = colWidths.map(w => '-'.repeat(w)).join('+');
  
  // Format headers
  const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join('|');
  
  // Format rows
  const formattedRows = rows.map(row => {
    return row.map((cell, i) => cell.padEnd(colWidths[i])).join('|');
  });
  
  // Combine all parts
  return [
    separator,
    headerRow,
    separator,
    ...formattedRows,
    separator
  ].join('\n');
}

/**
 * Save benchmark results to localStorage
 */
export function saveBenchmarkResults(key: string, results: Record<string, BenchmarkResult>): void {
  try {
    localStorage.setItem(key, JSON.stringify(results));
  } catch (error) {
    console.error('Failed to save benchmark results:', error);
  }
}

/**
 * Load benchmark results from localStorage
 */
export function loadBenchmarkResults(key: string): Record<string, BenchmarkResult> | null {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load benchmark results:', error);
    return null;
  }
}

/**
 * Compare current benchmark results with previously saved results
 */
export function compareToPreviousBenchmark(
  current: Record<string, BenchmarkResult>,
  previous: Record<string, BenchmarkResult>
): Record<string, { current: BenchmarkResult; previous: BenchmarkResult; improvement: number }> {
  const comparison: Record<string, { current: BenchmarkResult; previous: BenchmarkResult; improvement: number }> = {};
  
  for (const [name, currentResult] of Object.entries(current)) {
    if (previous[name]) {
      const previousResult = previous[name];
      const improvement = (previousResult.averageTime - currentResult.averageTime) / previousResult.averageTime;
      
      comparison[name] = {
        current: currentResult,
        previous: previousResult,
        improvement
      };
    }
  }
  
  return comparison;
}

/**
 * Format comparison results as a table string
 */
export function formatComparisonResults(
  comparison: Record<string, { current: BenchmarkResult; previous: BenchmarkResult; improvement: number }>
): string {
  const headers = ['Name', 'Current (ms)', 'Previous (ms)', 'Diff (ms)', 'Improvement (%)'];
  const rows: string[][] = [];
  
  for (const [name, result] of Object.entries(comparison)) {
    const diff = result.previous.averageTime - result.current.averageTime;
    const improvementPct = result.improvement * 100;
    
    rows.push([
      name,
      result.current.averageTime.toFixed(3),
      result.previous.averageTime.toFixed(3),
      diff.toFixed(3),
      improvementPct.toFixed(2) + '%'
    ]);
  }
  
  // Calculate column widths
  const colWidths = headers.map((h, i) => {
    const maxRowWidth = Math.max(...rows.map(row => row[i].length));
    return Math.max(h.length, maxRowWidth) + 2;
  });
  
  // Create separator line
  const separator = colWidths.map(w => '-'.repeat(w)).join('+');
  
  // Format headers
  const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join('|');
  
  // Format rows
  const formattedRows = rows.map(row => {
    return row.map((cell, i) => cell.padEnd(colWidths[i])).join('|');
  });
  
  // Combine all parts
  return [
    separator,
    headerRow,
    separator,
    ...formattedRows,
    separator
  ].join('\n');
}