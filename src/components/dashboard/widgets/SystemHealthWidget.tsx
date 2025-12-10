import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { useAgents } from '../../../store';

interface SystemHealthWidgetProps {
  id: string;
  title?: string;
  refreshInterval?: number;
}

interface MetricData {
  name: string;
  cpu: number;
  memory: number;
  latency: number;
}

const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({
  id,
  title = 'System Health',
  refreshInterval = 5000 // 5 seconds
}) => {
  const agents = useAgents();
  const [cpuData, setCpuData] = useState<MetricData[]>([]);
  const [memoryData, setMemoryData] = useState<MetricData[]>([]);
  const [latencyData, setLatencyData] = useState<MetricData[]>([]);
  
  // Generate random data for demo purposes
  useEffect(() => {
    // Initial data generation
    generateMetricData();
    
    // Set up interval for data updates
    const intervalId = setInterval(() => {
      generateMetricData();
    }, refreshInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval]);
  
  // Calculate system metrics based on agents
  const calculateSystemMetrics = () => {
    const agentValues = Object.values(agents);
    
    if (agentValues.length === 0) {
      return {
        avgCpu: 0,
        avgMemory: 0,
        // Random latency for demo
        latency: Math.random() * 100
      };
    }
    
    const totalCpu = agentValues.reduce((sum, agent) => sum + agent.cpuUsage, 0);
    const totalMemory = agentValues.reduce((sum, agent) => sum + agent.memoryUsage, 0);
    
    return {
      avgCpu: totalCpu / agentValues.length,
      avgMemory: totalMemory / agentValues.length,
      // Random latency for demo
      latency: Math.random() * 100
    };
  };
  
  // Generate metric data
  const generateMetricData = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const metrics = calculateSystemMetrics();
    
    // Add some random variation for demo purposes
    const variation = () => (Math.random() - 0.5) * 10;
    
    // Update CPU data
    setCpuData(prevData => {
      const newData = [...prevData, {
        name: timeStr,
        cpu: metrics.avgCpu + variation(),
        memory: 0,
        latency: 0
      }];
      
      // Keep only the last 10 data points
      return newData.slice(-10);
    });
    
    // Update Memory data
    setMemoryData(prevData => {
      const newData = [...prevData, {
        name: timeStr,
        cpu: 0,
        memory: metrics.avgMemory + variation(),
        latency: 0
      }];
      
      return newData.slice(-10);
    });
    
    // Update Latency data
    setLatencyData(prevData => {
      const newData = [...prevData, {
        name: timeStr,
        cpu: 0,
        memory: 0,
        latency: metrics.latency + variation()
      }];
      
      return newData.slice(-10);
    });
  };
  
  return (
    <div className="system-health-widget">
      <div className="widget-header" style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
      </div>
      
      <div className="widget-content" style={{ padding: '1rem' }}>
        <div className="metrics-container">
          {/* CPU Usage Chart */}
          <div className="metric-chart" style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>CPU Usage (%)</h4>
            <div style={{ height: '100px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cpuData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={false} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="#007bff" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Memory Usage Chart */}
          <div className="metric-chart" style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Memory Usage (MB)</h4>
            <div style={{ height: '100px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={memoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={false} />
                  <YAxis domain={[0, 500]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="memory" 
                    stroke="#28a745" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Response Latency Chart */}
          <div className="metric-chart">
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Response Latency (ms)</h4>
            <div style={{ height: '100px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={false} />
                  <YAxis domain={[0, 200]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="latency" 
                    stroke="#dc3545" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthWidget;