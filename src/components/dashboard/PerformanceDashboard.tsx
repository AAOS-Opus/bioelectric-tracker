/**
 * Performance Dashboard Component
 * 
 * This component provides a real-time visualization of system performance metrics,
 * including intent processing times, dispatch latency, and resource usage.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BenchmarkResult } from '../../utils/performance/benchmark';

// Types
export interface PerformanceMetrics {
  intentProcessingTime: number[];
  dispatchTime: number[];
  successRate: number;
  errorRate: number;
  cacheHitRate: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    network: number;
  };
  queueLength: number;
  activeConnections: number;
  intentTypeDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
}

export interface PerformanceDashboardProps {
  metrics?: PerformanceMetrics;
  benchmarks?: Record<string, BenchmarkResult>;
  refreshInterval?: number;
  onRefresh?: () => void;
  className?: string;
}

// Default metrics for development
const DEFAULT_METRICS: PerformanceMetrics = {
  intentProcessingTime: [12, 15, 10, 8, 9, 11, 13, 10, 9, 8],
  dispatchTime: [45, 50, 48, 52, 47, 43, 49, 51, 46, 44],
  successRate: 0.95,
  errorRate: 0.05,
  cacheHitRate: 0.75,
  resourceUsage: {
    cpu: 35,
    memory: 42,
    network: 28
  },
  queueLength: 3,
  activeConnections: 8,
  intentTypeDistribution: {
    create: 25,
    read: 40,
    update: 20,
    delete: 5,
    query: 10
  },
  statusDistribution: {
    pending: 5,
    processing: 10,
    completed: 80,
    failed: 5
  }
};

// Default benchmarks for development
const DEFAULT_BENCHMARKS: Record<string, BenchmarkResult> = {
  'Intent Processing': {
    name: 'Intent Processing',
    iterations: 100,
    totalTime: 1250,
    averageTime: 12.5,
    minTime: 8.2,
    maxTime: 18.7,
    medianTime: 12.1,
    p95Time: 16.8,
    p99Time: 18.2,
    timestamp: new Date()
  },
  'Intent Dispatch': {
    name: 'Intent Dispatch',
    iterations: 100,
    totalTime: 4800,
    averageTime: 48.0,
    minTime: 42.3,
    maxTime: 58.9,
    medianTime: 47.5,
    p95Time: 55.2,
    p99Time: 57.8,
    timestamp: new Date()
  },
  'Cache Access': {
    name: 'Cache Access',
    iterations: 100,
    totalTime: 320,
    averageTime: 3.2,
    minTime: 1.8,
    maxTime: 6.5,
    medianTime: 3.0,
    p95Time: 5.8,
    p99Time: 6.2,
    timestamp: new Date()
  }
};

// Colors for charts
const COLORS = {
  primary: '#1f77b4',
  secondary: '#ff7f0e',
  success: '#2ca02c',
  error: '#d62728',
  warning: '#ffbb33',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
  chartColors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']
};

/**
 * Performance Dashboard Component
 */
export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  metrics = DEFAULT_METRICS,
  benchmarks = DEFAULT_BENCHMARKS,
  refreshInterval = 5000,
  onRefresh,
  className = ''
}) => {
  // State
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics>(metrics);
  const [currentBenchmarks, setCurrentBenchmarks] = useState<Record<string, BenchmarkResult>>(benchmarks);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'latency' | 'resources' | 'benchmarks'>('overview');
  
  // Update metrics on props change
  useEffect(() => {
    setCurrentMetrics(metrics);
  }, [metrics]);
  
  // Update benchmarks on props change
  useEffect(() => {
    setCurrentBenchmarks(benchmarks);
  }, [benchmarks]);
  
  // Refresh metrics at interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (onRefresh) {
        onRefresh();
      }
      setLastUpdated(new Date());
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, onRefresh]);
  
  // Format time series data for charts
  const timeSeriesData = useMemo(() => {
    return currentMetrics.intentProcessingTime.map((time, index) => ({
      name: `T-${currentMetrics.intentProcessingTime.length - index}`,
      processingTime: time,
      dispatchTime: currentMetrics.dispatchTime[index] || 0
    })).reverse();
  }, [currentMetrics.intentProcessingTime, currentMetrics.dispatchTime]);
  
  // Format intent type distribution for charts
  const intentTypeData = useMemo(() => {
    return Object.entries(currentMetrics.intentTypeDistribution).map(([type, count], index) => ({
      name: type,
      value: count,
      color: COLORS.chartColors[index % COLORS.chartColors.length]
    }));
  }, [currentMetrics.intentTypeDistribution]);
  
  // Format status distribution for charts
  const statusData = useMemo(() => {
    return Object.entries(currentMetrics.statusDistribution).map(([status, count], index) => ({
      name: status,
      value: count,
      color: status === 'completed' ? COLORS.success :
             status === 'failed' ? COLORS.error :
             status === 'processing' ? COLORS.warning :
             COLORS.info
    }));
  }, [currentMetrics.statusDistribution]);
  
  // Format benchmark data for charts
  const benchmarkData = useMemo(() => {
    return Object.values(currentBenchmarks).map(benchmark => ({
      name: benchmark.name,
      average: benchmark.averageTime,
      p95: benchmark.p95Time,
      p99: benchmark.p99Time,
      min: benchmark.minTime,
      max: benchmark.maxTime
    }));
  }, [currentBenchmarks]);
  
  // Format resource usage for charts
  const resourceData = useMemo(() => {
    return [
      { name: 'CPU', value: currentMetrics.resourceUsage.cpu },
      { name: 'Memory', value: currentMetrics.resourceUsage.memory },
      { name: 'Network', value: currentMetrics.resourceUsage.network }
    ];
  }, [currentMetrics.resourceUsage]);
  
  // Render overview tab
  const renderOverviewTab = () => (
    <div className="dashboard-tab overview-tab">
      <div className="dashboard-row">
        <div className="dashboard-card summary-card">
          <h3>System Summary</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-label">Success Rate</div>
              <div className="metric-value success">{(currentMetrics.successRate * 100).toFixed(1)}%</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Error Rate</div>
              <div className="metric-value error">{(currentMetrics.errorRate * 100).toFixed(1)}%</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Cache Hit Rate</div>
              <div className="metric-value">{(currentMetrics.cacheHitRate * 100).toFixed(1)}%</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Queue Length</div>
              <div className="metric-value">{currentMetrics.queueLength}</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Active Connections</div>
              <div className="metric-value">{currentMetrics.activeConnections}</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Avg Processing Time</div>
              <div className="metric-value">
                {currentMetrics.intentProcessingTime.reduce((sum, time) => sum + time, 0) / 
                 currentMetrics.intentProcessingTime.length}ms
              </div>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card distribution-card">
          <h3>Intent Distribution</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={intentTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {intentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="dashboard-row">
        <div className="dashboard-card status-card">
          <h3>Status Distribution</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="dashboard-card resource-card">
          <h3>Resource Usage</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={resourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render latency tab
  const renderLatencyTab = () => (
    <div className="dashboard-tab latency-tab">
      <div className="dashboard-row">
        <div className="dashboard-card latency-chart-card">
          <h3>Processing & Dispatch Times</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="processingTime" stroke={COLORS.primary} name="Processing Time (ms)" />
                <Line type="monotone" dataKey="dispatchTime" stroke={COLORS.secondary} name="Dispatch Time (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="dashboard-row">
        <div className="dashboard-card latency-stats-card">
          <h3>Latency Statistics</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-label">Avg Processing Time</div>
              <div className="metric-value">
                {(currentMetrics.intentProcessingTime.reduce((sum, time) => sum + time, 0) / 
                 currentMetrics.intentProcessingTime.length).toFixed(2)}ms
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Max Processing Time</div>
              <div className="metric-value">
                {Math.max(...currentMetrics.intentProcessingTime).toFixed(2)}ms
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Min Processing Time</div>
              <div className="metric-value">
                {Math.min(...currentMetrics.intentProcessingTime).toFixed(2)}ms
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Avg Dispatch Time</div>
              <div className="metric-value">
                {(currentMetrics.dispatchTime.reduce((sum, time) => sum + time, 0) / 
                 currentMetrics.dispatchTime.length).toFixed(2)}ms
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Max Dispatch Time</div>
              <div className="metric-value">
                {Math.max(...currentMetrics.dispatchTime).toFixed(2)}ms
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Min Dispatch Time</div>
              <div className="metric-value">
                {Math.min(...currentMetrics.dispatchTime).toFixed(2)}ms
              </div>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card latency-distribution-card">
          <h3>Latency Distribution</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'P50', value: calculatePercentile(currentMetrics.intentProcessingTime, 0.5) },
                { name: 'P75', value: calculatePercentile(currentMetrics.intentProcessingTime, 0.75) },
                { name: 'P90', value: calculatePercentile(currentMetrics.intentProcessingTime, 0.9) },
                { name: 'P95', value: calculatePercentile(currentMetrics.intentProcessingTime, 0.95) },
                { name: 'P99', value: calculatePercentile(currentMetrics.intentProcessingTime, 0.99) }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.primary} name="Processing Time (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render resources tab
  const renderResourcesTab = () => (
    <div className="dashboard-tab resources-tab">
      <div className="dashboard-row">
        <div className="dashboard-card resource-usage-card">
          <h3>Resource Usage Over Time</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { name: 'T-10', cpu: 30, memory: 40, network: 25 },
                { name: 'T-9', cpu: 32, memory: 41, network: 26 },
                { name: 'T-8', cpu: 31, memory: 42, network: 28 },
                { name: 'T-7', cpu: 33, memory: 43, network: 27 },
                { name: 'T-6', cpu: 34, memory: 42, network: 26 },
                { name: 'T-5', cpu: 33, memory: 41, network: 27 },
                { name: 'T-4', cpu: 35, memory: 42, network: 28 },
                { name: 'T-3', cpu: 34, memory: 43, network: 27 },
                { name: 'T-2', cpu: 36, memory: 42, network: 28 },
                { name: 'T-1', cpu: 35, memory: 42, network: 28 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cpu" stroke={COLORS.primary} name="CPU (%)" />
                <Line type="monotone" dataKey="memory" stroke={COLORS.secondary} name="Memory (%)" />
                <Line type="monotone" dataKey="network" stroke={COLORS.success} name="Network (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="dashboard-row">
        <div className="dashboard-card queue-card">
          <h3>Queue Length Over Time</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={[
                { name: 'T-10', value: 2 },
                { name: 'T-9', value: 3 },
                { name: 'T-8', value: 4 },
                { name: 'T-7', value: 3 },
                { name: 'T-6', value: 2 },
                { name: 'T-5', value: 3 },
                { name: 'T-4', value: 4 },
                { name: 'T-3', value: 5 },
                { name: 'T-2', value: 4 },
                { name: 'T-1', value: 3 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke={COLORS.primary} name="Queue Length" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="dashboard-card connections-card">
          <h3>Active Connections Over Time</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={[
                { name: 'T-10', value: 6 },
                { name: 'T-9', value: 7 },
                { name: 'T-8', value: 8 },
                { name: 'T-7', value: 7 },
                { name: 'T-6', value: 8 },
                { name: 'T-5', value: 9 },
                { name: 'T-4', value: 8 },
                { name: 'T-3', value: 7 },
                { name: 'T-2', value: 8 },
                { name: 'T-1', value: 8 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke={COLORS.secondary} name="Active Connections" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render benchmarks tab
  const renderBenchmarksTab = () => (
    <div className="dashboard-tab benchmarks-tab">
      <div className="dashboard-row">
        <div className="dashboard-card benchmark-chart-card">
          <h3>Benchmark Results</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={benchmarkData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill={COLORS.primary} name="Average (ms)" />
                <Bar dataKey="p95" fill={COLORS.secondary} name="P95 (ms)" />
                <Bar dataKey="p99" fill={COLORS.warning} name="P99 (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="dashboard-row">
        <div className="dashboard-card benchmark-stats-card">
          <h3>Benchmark Statistics</h3>
          <table className="benchmark-table">
            <thead>
              <tr>
                <th>Benchmark</th>
                <th>Avg (ms)</th>
                <th>Min (ms)</th>
                <th>Max (ms)</th>
                <th>P95 (ms)</th>
                <th>P99 (ms)</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(currentBenchmarks).map(benchmark => (
                <tr key={benchmark.name}>
                  <td>{benchmark.name}</td>
                  <td>{benchmark.averageTime.toFixed(2)}</td>
                  <td>{benchmark.minTime.toFixed(2)}</td>
                  <td>{benchmark.maxTime.toFixed(2)}</td>
                  <td>{benchmark.p95Time.toFixed(2)}</td>
                  <td>{benchmark.p99Time.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="dashboard-row">
        <div className="dashboard-card benchmark-range-card">
          <h3>Performance Range</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={benchmarkData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="min" fill={COLORS.success} name="Min (ms)" />
                <Bar dataKey="max" fill={COLORS.error} name="Max (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className={`performance-dashboard ${className}`} data-testid="performance-dashboard">
      <div className="dashboard-header">
        <h2>Performance Dashboard</h2>
        <div className="dashboard-info">
          <span className="last-updated">Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <button className="refresh-button" onClick={() => onRefresh && onRefresh()}>
            Refresh
          </button>
        </div>
      </div>
      
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'latency' ? 'active' : ''}`}
          onClick={() => setActiveTab('latency')}
        >
          Latency
        </button>
        <button
          className={`tab-button ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          Resources
        </button>
        <button
          className={`tab-button ${activeTab === 'benchmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('benchmarks')}
        >
          Benchmarks
        </button>
      </div>
      
      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'latency' && renderLatencyTab()}
        {activeTab === 'resources' && renderResourcesTab()}
        {activeTab === 'benchmarks' && renderBenchmarksTab()}
      </div>
      
      <style jsx>{`
        .performance-dashboard {
          font-family: Arial, sans-serif;
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .dashboard-header h2 {
          margin: 0;
          color: #333;
        }
        
        .dashboard-info {
          display: flex;
          align-items: center;
        }
        
        .last-updated {
          margin-right: 10px;
          font-size: 14px;
          color: #666;
        }
        
        .refresh-button {
          background-color: #1f77b4;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
        }
        
        .dashboard-tabs {
          display: flex;
          border-bottom: 1px solid #ddd;
          margin-bottom: 20px;
        }
        
        .tab-button {
          background-color: transparent;
          border: none;
          padding: 10px 20px;
          cursor: pointer;
          font-size: 16px;
          color: #666;
          border-bottom: 3px solid transparent;
        }
        
        .tab-button.active {
          color: #1f77b4;
          border-bottom-color: #1f77b4;
        }
        
        .dashboard-content {
          margin-top: 20px;
        }
        
        .dashboard-row {
          display: flex;
          margin-bottom: 20px;
          gap: 20px;
        }
        
        .dashboard-card {
          background-color: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          flex: 1;
        }
        
        .dashboard-card h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #333;
          font-size: 18px;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .metric-item {
          display: flex;
          flex-direction: column;
        }
        
        .metric-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .metric-value {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
        
        .metric-value.success {
          color: #2ca02c;
        }
        
        .metric-value.error {
          color: #d62728;
        }
        
        .chart-container {
          height: 100%;
          width: 100%;
        }
        
        .benchmark-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .benchmark-table th, .benchmark-table td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        .benchmark-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

// Helper function to calculate percentile
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  // Sort values
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // Calculate index
  const index = Math.ceil(percentile * sortedValues.length) - 1;
  
  // Return percentile value
  return sortedValues[Math.max(0, index)];
}

export default PerformanceDashboard;