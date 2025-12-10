/**
 * Telemetry Flow Monitoring Component
 * 
 * This component provides real-time monitoring and visualization of telemetry data
 * flowing through the cognitive pipeline, including intent processing metrics,
 * system health, and performance indicators.
 */

import React, { useState, useEffect, useRef } from 'react';
import mockBackend from '../../mocks/mock-backend';

// Types for telemetry monitoring
export interface TelemetryConfig {
  refreshInterval: number; // in milliseconds
  maxDataPoints: number;
  enableAlerts: boolean;
  alertThresholds: {
    errorRate: number; // 0-1 scale
    latency: number; // in milliseconds
    memoryUsage: number; // 0-1 scale
    successRate: number; // 0-1 scale
  };
}

export interface TelemetrySnapshot {
  timestamp: Date;
  totalIntents: number;
  successRate: number;
  avgDispatchTime: number;
  statusCounts: Record<string, number>;
  intentTypes: Record<string, number>;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  activeAgents: number;
  queuedRequests: number;
  alerts: TelemetryAlert[];
}

export interface TelemetryAlert {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
}

export interface TelemetryChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
  }[];
}

// Default configuration
const DEFAULT_CONFIG: TelemetryConfig = {
  refreshInterval: 5000, // 5 seconds
  maxDataPoints: 20,
  enableAlerts: true,
  alertThresholds: {
    errorRate: 0.1, // 10%
    latency: 500, // 500ms
    memoryUsage: 0.8, // 80%
    successRate: 0.9 // 90%
  }
};

// Chart colors
const CHART_COLORS = {
  blue: 'rgba(54, 162, 235, 1)',
  green: 'rgba(75, 192, 192, 1)',
  red: 'rgba(255, 99, 132, 1)',
  orange: 'rgba(255, 159, 64, 1)',
  purple: 'rgba(153, 102, 255, 1)',
  yellow: 'rgba(255, 205, 86, 1)',
  grey: 'rgba(201, 203, 207, 1)'
};

interface TelemetryMonitorProps {
  config?: Partial<TelemetryConfig>;
  onAlert?: (alert: TelemetryAlert) => void;
  onSnapshot?: (snapshot: TelemetrySnapshot) => void;
  className?: string;
}

const TelemetryMonitor: React.FC<TelemetryMonitorProps> = ({
  config = {},
  onAlert,
  onSnapshot,
  className = ''
}) => {
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<TelemetryConfig>({
    ...DEFAULT_CONFIG,
    ...config
  });
  const [snapshots, setSnapshots] = useState<TelemetrySnapshot[]>([]);
  const [latestSnapshot, setLatestSnapshot] = useState<TelemetrySnapshot | null>(null);
  const [alerts, setAlerts] = useState<TelemetryAlert[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chartData, setChartData] = useState<Record<string, TelemetryChartData>>({});
  
  // Refs
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const snapshotsRef = useRef<TelemetrySnapshot[]>([]);
  const alertsRef = useRef<TelemetryAlert[]>([]);
  
  // Initialize
  useEffect(() => {
    const initializeMonitor = async () => {
      try {
        // Initialize mock backend
        await mockBackend.initialize();
        
        // Check if telemetry is available
        if (!mockBackend.getTelemetryData) {
          throw new Error('Mock backend does not support telemetry data');
        }
        
        setIsInitialized(true);
        
        // Take initial snapshot
        await takeSnapshot();
      } catch (error) {
        setErrorMessage(`Failed to initialize telemetry monitor: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    
    initializeMonitor();
    
    // Cleanup on unmount
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, []);
  
  // Update refs when state changes
  useEffect(() => {
    snapshotsRef.current = snapshots;
  }, [snapshots]);
  
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);
  
  // Take a telemetry snapshot
  const takeSnapshot = async () => {
    try {
      // Get telemetry data from mock backend
      const telemetryData = await mockBackend.getTelemetryData();
      
      // Generate additional mock metrics
      const errorRate = 1 - (telemetryData.successRate || 0);
      const memoryUsage = Math.random() * 0.5 + 0.3; // 30-80%
      const cpuUsage = Math.random() * 0.6 + 0.2; // 20-80%
      const activeAgents = Math.floor(Math.random() * 10) + 1; // 1-10
      const queuedRequests = Math.floor(Math.random() * 5); // 0-4
      
      // Create snapshot
      const snapshot: TelemetrySnapshot = {
        timestamp: new Date(),
        totalIntents: telemetryData.totalIntents || 0,
        successRate: telemetryData.successRate || 0,
        avgDispatchTime: telemetryData.avgDispatchTime || 0,
        statusCounts: telemetryData.statusCounts || {},
        intentTypes: telemetryData.intentTypes || {},
        errorRate,
        memoryUsage,
        cpuUsage,
        activeAgents,
        queuedRequests,
        alerts: []
      };
      
      // Check for alerts
      if (currentConfig.enableAlerts) {
        const newAlerts: TelemetryAlert[] = [];
        
        // Check error rate
        if (errorRate > currentConfig.alertThresholds.errorRate) {
          newAlerts.push({
            id: `error-rate-${Date.now()}`,
            timestamp: new Date(),
            level: errorRate > currentConfig.alertThresholds.errorRate * 2 ? 'critical' : 'warning',
            message: `Error rate (${(errorRate * 100).toFixed(1)}%) exceeds threshold (${(currentConfig.alertThresholds.errorRate * 100).toFixed(1)}%)`,
            metric: 'errorRate',
            value: errorRate,
            threshold: currentConfig.alertThresholds.errorRate
          });
        }
        
        // Check latency
        if (telemetryData.avgDispatchTime > currentConfig.alertThresholds.latency) {
          newAlerts.push({
            id: `latency-${Date.now()}`,
            timestamp: new Date(),
            level: telemetryData.avgDispatchTime > currentConfig.alertThresholds.latency * 2 ? 'critical' : 'warning',
            message: `Average dispatch time (${telemetryData.avgDispatchTime.toFixed(0)}ms) exceeds threshold (${currentConfig.alertThresholds.latency}ms)`,
            metric: 'latency',
            value: telemetryData.avgDispatchTime,
            threshold: currentConfig.alertThresholds.latency
          });
        }
        
        // Check memory usage
        if (memoryUsage > currentConfig.alertThresholds.memoryUsage) {
          newAlerts.push({
            id: `memory-${Date.now()}`,
            timestamp: new Date(),
            level: memoryUsage > currentConfig.alertThresholds.memoryUsage * 1.2 ? 'critical' : 'warning',
            message: `Memory usage (${(memoryUsage * 100).toFixed(1)}%) exceeds threshold (${(currentConfig.alertThresholds.memoryUsage * 100).toFixed(1)}%)`,
            metric: 'memoryUsage',
            value: memoryUsage,
            threshold: currentConfig.alertThresholds.memoryUsage
          });
        }
        
        // Check success rate
        if (telemetryData.successRate < currentConfig.alertThresholds.successRate) {
          newAlerts.push({
            id: `success-rate-${Date.now()}`,
            timestamp: new Date(),
            level: telemetryData.successRate < currentConfig.alertThresholds.successRate * 0.8 ? 'critical' : 'warning',
            message: `Success rate (${(telemetryData.successRate * 100).toFixed(1)}%) below threshold (${(currentConfig.alertThresholds.successRate * 100).toFixed(1)}%)`,
            metric: 'successRate',
            value: telemetryData.successRate,
            threshold: currentConfig.alertThresholds.successRate
          });
        }
        
        // Add alerts to snapshot
        snapshot.alerts = newAlerts;
        
        // Update alerts state
        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50 alerts
          
          // Call onAlert callback for each alert
          if (onAlert) {
            newAlerts.forEach(alert => onAlert(alert));
          }
        }
      }
      
      // Update snapshots state
      setSnapshots(prev => {
        const updated = [...prev, snapshot].slice(-currentConfig.maxDataPoints);
        return updated;
      });
      
      // Update latest snapshot
      setLatestSnapshot(snapshot);
      
      // Call onSnapshot callback
      if (onSnapshot) {
        onSnapshot(snapshot);
      }
      
      // Update chart data
      updateChartData([...snapshotsRef.current, snapshot]);
      
      return snapshot;
    } catch (error) {
      setErrorMessage(`Failed to take snapshot: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  };
  
  // Update chart data
  const updateChartData = (snapshots: TelemetrySnapshot[]) => {
    if (snapshots.length === 0) return;
    
    // Prepare time labels (last 20 snapshots)
    const recentSnapshots = snapshots.slice(-currentConfig.maxDataPoints);
    const labels = recentSnapshots.map(s => {
      const date = new Date(s.timestamp);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    });
    
    // Create performance chart data
    const performanceData: TelemetryChartData = {
      labels,
      datasets: [
        {
          label: 'Success Rate',
          data: recentSnapshots.map(s => s.successRate * 100),
          borderColor: CHART_COLORS.green,
          backgroundColor: CHART_COLORS.green + '20',
          fill: true
        },
        {
          label: 'Error Rate',
          data: recentSnapshots.map(s => s.errorRate * 100),
          borderColor: CHART_COLORS.red,
          backgroundColor: CHART_COLORS.red + '20',
          fill: true
        },
        {
          label: 'Avg Dispatch Time (ms)',
          data: recentSnapshots.map(s => s.avgDispatchTime),
          borderColor: CHART_COLORS.blue,
          backgroundColor: CHART_COLORS.blue + '20',
          fill: true
        }
      ]
    };
    
    // Create resource usage chart data
    const resourceData: TelemetryChartData = {
      labels,
      datasets: [
        {
          label: 'Memory Usage',
          data: recentSnapshots.map(s => s.memoryUsage * 100),
          borderColor: CHART_COLORS.purple,
          backgroundColor: CHART_COLORS.purple + '20',
          fill: true
        },
        {
          label: 'CPU Usage',
          data: recentSnapshots.map(s => s.cpuUsage * 100),
          borderColor: CHART_COLORS.orange,
          backgroundColor: CHART_COLORS.orange + '20',
          fill: true
        }
      ]
    };
    
    // Create intent volume chart data
    const volumeData: TelemetryChartData = {
      labels,
      datasets: [
        {
          label: 'Total Intents',
          data: recentSnapshots.map(s => s.totalIntents),
          borderColor: CHART_COLORS.blue,
          backgroundColor: CHART_COLORS.blue + '20',
          fill: true
        },
        {
          label: 'Active Agents',
          data: recentSnapshots.map(s => s.activeAgents),
          borderColor: CHART_COLORS.green,
          backgroundColor: CHART_COLORS.green + '20',
          fill: true
        },
        {
          label: 'Queued Requests',
          data: recentSnapshots.map(s => s.queuedRequests),
          borderColor: CHART_COLORS.yellow,
          backgroundColor: CHART_COLORS.yellow + '20',
          fill: true
        }
      ]
    };
    
    // Update chart data state
    setChartData({
      performance: performanceData,
      resources: resourceData,
      volume: volumeData
    });
  };
  
  // Start monitoring
  const startMonitoring = () => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    
    // Take snapshot immediately
    takeSnapshot();
    
    // Set up interval for regular snapshots
    monitoringIntervalRef.current = setInterval(() => {
      takeSnapshot();
    }, currentConfig.refreshInterval);
  };
  
  // Stop monitoring
  const stopMonitoring = () => {
    if (!isMonitoring) return;
    
    setIsMonitoring(false);
    
    // Clear interval
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
  };
  
  // Update configuration
  const updateConfig = (key: keyof TelemetryConfig, value: any) => {
    setCurrentConfig(prev => {
      // Handle nested alertThresholds
      if (key === 'alertThresholds') {
        return {
          ...prev,
          alertThresholds: {
            ...prev.alertThresholds,
            ...value
          }
        };
      }
      
      return {
        ...prev,
        [key]: value
      };
    });
    
    // Restart monitoring if refresh interval changes
    if (key === 'refreshInterval' && isMonitoring) {
      stopMonitoring();
      startMonitoring();
    }
  };
  
  // Clear alerts
  const clearAlerts = () => {
    setAlerts([]);
  };
  
  // Render component
  return (
    <div className={`telemetry-monitor ${className}`} data-testid="telemetry-monitor">
      <div className="telemetry-header">
        <h2>Telemetry Flow Monitor</h2>
        {!isInitialized && <p>Initializing...</p>}
      </div>
      
      {errorMessage && (
        <div className="telemetry-error" role="alert">
          <p>{errorMessage}</p>
          <button onClick={() => setErrorMessage(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="telemetry-controls">
        <div className="control-buttons">
          {!isMonitoring ? (
            <button
              onClick={startMonitoring}
              disabled={!isInitialized}
              className="start-button"
            >
              Start Monitoring
            </button>
          ) : (
            <button
              onClick={stopMonitoring}
              className="stop-button"
            >
              Stop Monitoring
            </button>
          )}
          
          <button
            onClick={takeSnapshot}
            disabled={!isInitialized}
            className="snapshot-button"
          >
            Take Snapshot
          </button>
          
          <button
            onClick={clearAlerts}
            disabled={alerts.length === 0}
            className="clear-button"
          >
            Clear Alerts
          </button>
        </div>
        
        <div className="config-controls">
          <div className="config-item">
            <label htmlFor="refresh-interval">Refresh Interval (ms):</label>
            <input
              id="refresh-interval"
              type="number"
              min="1000"
              max="60000"
              step="1000"
              value={currentConfig.refreshInterval}
              onChange={(e) => updateConfig('refreshInterval', Number(e.target.value))}
              disabled={isMonitoring}
            />
          </div>
          
          <div className="config-item">
            <label htmlFor="max-data-points">Max Data Points:</label>
            <input
              id="max-data-points"
              type="number"
              min="5"
              max="100"
              value={currentConfig.maxDataPoints}
              onChange={(e) => updateConfig('maxDataPoints', Number(e.target.value))}
            />
          </div>
          
          <div className="config-checkbox">
            <input
              id="enable-alerts"
              type="checkbox"
              checked={currentConfig.enableAlerts}
              onChange={(e) => updateConfig('enableAlerts', e.target.checked)}
            />
            <label htmlFor="enable-alerts">Enable Alerts</label>
          </div>
        </div>
      </div>
      
      <div className="telemetry-dashboard">
        <div className="dashboard-row">
          <div className="dashboard-card summary-card">
            <h3>System Summary</h3>
            
            {latestSnapshot ? (
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Total Intents:</span>
                  <span className="summary-value">{latestSnapshot.totalIntents}</span>
                </div>
                
                <div className="summary-item">
                  <span className="summary-label">Success Rate:</span>
                  <span className={`summary-value ${latestSnapshot.successRate < currentConfig.alertThresholds.successRate ? 'warning' : ''}`}>
                    {(latestSnapshot.successRate * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="summary-item">
                  <span className="summary-label">Error Rate:</span>
                  <span className={`summary-value ${latestSnapshot.errorRate > currentConfig.alertThresholds.errorRate ? 'warning' : ''}`}>
                    {(latestSnapshot.errorRate * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="summary-item">
                  <span className="summary-label">Avg Dispatch Time:</span>
                  <span className={`summary-value ${latestSnapshot.avgDispatchTime > currentConfig.alertThresholds.latency ? 'warning' : ''}`}>
                    {latestSnapshot.avgDispatchTime.toFixed(0)}ms
                  </span>
                </div>
              </div>
            ) : (
              <p>No data available</p>
            )}
          </div>
          
          <div className="dashboard-card alerts-card">
            <h3>Active Alerts</h3>
            
            {alerts.length === 0 ? (
              <p>No active alerts</p>
            ) : (
              <div className="alerts-list">
                {alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className={`alert-item alert-${alert.level}`}>
                    <div className="alert-header">
                      <span className="alert-level">{alert.level.toUpperCase()}</span>
                      <span className="alert-time">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="alert-message">{alert.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format time
const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString();
};

export default TelemetryMonitor;