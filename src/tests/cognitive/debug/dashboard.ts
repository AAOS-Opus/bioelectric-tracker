/**
 * Chaos Testing Dashboard
 *
 * This file creates a simple HTTP server and WebSocket server to provide
 * a real-time dashboard for monitoring chaos testing results.
 */

import { createServer } from 'http';
import * as fs from 'fs';
import * as path from 'path';
import WebSocket, { WebSocketServer } from 'ws';

// Declare global event emitter type
declare global {
  var eventEmitter: any;
}

// Create HTTP server for dashboard UI
const server = createServer((req, res) => {
  if (req.url === '/') {
    // Create dashboard HTML file if it doesn't exist
    const dashboardHtmlPath = path.join(__dirname, 'dashboard.html');
    
    if (!fs.existsSync(dashboardHtmlPath)) {
      createDashboardHtml();
    }
    
    fs.readFile(dashboardHtmlPath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading dashboard');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/recovery-paths') {
    // Serve the recovery paths JSON
    const recoveryPathsFile = path.join(__dirname, '../../../../docs/recovery-paths.json');
    
    if (!fs.existsSync(recoveryPathsFile)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Recovery paths file not found' }));
      return;
    }
    
    fs.readFile(recoveryPathsFile, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error reading recovery paths file' }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

// Create WebSocket server for real-time updates
const wss = new WebSocketServer({ server });

// Store connected clients
const clients: Set<any> = new Set();

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket) => {
  console.log('Dashboard client connected');
  clients.add(ws);
  
  // Send initial data
  sendInitialData(ws);
  
  // Handle client messages
  ws.on('message', (message: WebSocket.Data) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'request_data') {
        sendInitialData(ws);
      }
    } catch (err) {
      console.error('Error parsing client message:', err);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    console.log('Dashboard client disconnected');
    clients.delete(ws);
  });
  
  // Forward events from the event emitter to the client
  if (global.eventEmitter) {
    // Chaos event
    global.eventEmitter.on('chaos:event', (data: any) => {
      ws.send(JSON.stringify({
        type: 'chaos_event',
        event: data,
        active: true
      }));
    });
    
    // Chaos event end
    global.eventEmitter.on('chaos:event:end', (data: any) => {
      ws.send(JSON.stringify({
        type: 'chaos_event',
        event: data,
        active: false
      }));
    });
    
    // Metric update
    global.eventEmitter.on('metric:update', (data: any) => {
      ws.send(JSON.stringify({
        type: 'metric_update',
        metric: data.metric,
        value: data.value
      }));
    });
    
    // UX impact
    global.eventEmitter.on('ux:impact', (data: any) => {
      ws.send(JSON.stringify({
        type: 'ux_impact',
        ...data
      }));
    });
    
    // Recovery attempt
    global.eventEmitter.on('recovery:attempt', (data: any) => {
      ws.send(JSON.stringify({
        type: 'recovery_attempt',
        ...data
      }));
    });
    
    // System status
    global.eventEmitter.on('system:status', (data: any) => {
      ws.send(JSON.stringify({
        type: 'system_status',
        status: data
      }));
    });
    
    // Anomaly detected
    global.eventEmitter.on('anomaly:detected', (data: any) => {
      ws.send(JSON.stringify({
        type: 'anomaly_detected',
        ...data
      }));
    });
    
    // Test complete
    global.eventEmitter.on('chaos:complete', (data: any) => {
      ws.send(JSON.stringify({
        type: 'chaos_complete',
        ...data
      }));
    });
  }
});

// Send initial data to client
function sendInitialData(ws: WebSocket) {
  // Load recovery paths
  let recoveryPaths = [];
  try {
    const recoveryPathsFile = path.join(__dirname, '../../../../docs/recovery-paths.json');
    if (fs.existsSync(recoveryPathsFile)) {
      recoveryPaths = JSON.parse(fs.readFileSync(recoveryPathsFile, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading recovery paths:', err);
  }
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'initial_data',
    recoveryPaths,
    metrics: {},
    systemStatus: {
      database: 'healthy',
      api: 'healthy',
      cache: 'healthy',
      voice: 'healthy'
    },
    activeEvents: []
  }));
}

// Create dashboard HTML file
function createDashboardHtml() {
  const dashboardHtmlPath = path.join(__dirname, 'dashboard.html');
  
  // Basic dashboard HTML template
  const dashboardHtml = `<!DOCTYPE html>
<html>
<head>
  <title>MaestroDeck Chaos Dashboard</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 0; 
      padding: 20px; 
      background-color: #f5f5f5;
      color: #333;
    }
    .grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 20px; 
      margin-bottom: 20px;
    }
    .card { 
      border: 1px solid #ddd; 
      border-radius: 8px; 
      padding: 15px; 
      background-color: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .critical { background-color: #ffdddd; }
    .warning { background-color: #ffffdd; }
    .success { background-color: #ddffdd; }
    .metric { 
      font-size: 24px; 
      font-weight: bold; 
      margin: 10px 0;
    }
    .event {
      padding: 8px;
      margin: 5px 0;
      border-radius: 4px;
      border-left: 4px solid #ccc;
    }
    .event.failure { border-left-color: #ff6b6b; background-color: #fff0f0; }
    .event.recovery { border-left-color: #51cf66; background-color: #f0fff0; }
    .event.degradation { border-left-color: #fcc419; background-color: #fff9db; }
    
    #recovery-path-viz { 
      height: 400px; 
      border: 1px solid #ddd; 
      border-radius: 8px;
      background-color: #fff;
      overflow: auto;
    }
    
    #event-timeline {
      height: 200px;
      position: relative;
      border: 1px solid #ddd;
      border-radius: 8px;
      background-color: #fff;
      margin-top: 10px;
      overflow: hidden;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .status-indicator {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 5px;
    }
    
    .status-indicator.connected { background-color: #51cf66; }
    .status-indicator.disconnected { background-color: #ff6b6b; }
    
    .status-text {
      font-size: 14px;
      color: #666;
    }
    
    h1, h2, h3 {
      color: #333;
      margin-top: 0;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <div class="header">
    <h1>MaestroDeck Chaos Testing Dashboard</h1>
    <div>
      <span class="status-indicator disconnected" id="connection-status"></span>
      <span class="status-text" id="connection-text">Disconnected</span>
    </div>
  </div>
  
  <div class="grid">
    <div class="card">
      <h2>Active Chaos Events</h2>
      <div id="active-chaos"></div>
    </div>
    <div class="card">
      <h2>System Status</h2>
      <div id="system-status"></div>
    </div>
    <div class="card">
      <h2>UX Impact Score</h2>
      <div id="ux-impact" class="metric">-</div>
      <div id="ux-impact-details"></div>
    </div>
    <div class="card">
      <h2>Recovery Success Rate</h2>
      <div id="recovery-rate" class="metric">-</div>
      <div id="recovery-details"></div>
    </div>
  </div>
  
  <div class="card">
    <h2>Recent Events</h2>
    <div id="recent-events"></div>
  </div>
  
  <div class="card">
    <h2>Recovery Path Visualization</h2>
    <div id="recovery-path-viz"></div>
  </div>
  
  <script>
    // Connect to WebSocket for real-time updates
    const ws = new WebSocket('ws://' + window.location.host);
    const connectionStatus = document.getElementById('connection-status');
    const connectionText = document.getElementById('connection-text');
    
    // Dashboard state
    const state = {
      activeEvents: [],
      metrics: {},
      recoveryPaths: [],
      events: [],
      systemStatus: {
        database: 'healthy',
        api: 'healthy',
        cache: 'healthy',
        voice: 'healthy'
      },
      uxImpacts: [],
      recoveryAttempts: {
        total: 0,
        success: 0,
        primary: 0,
        secondary: 0,
        fallback: 0
      },
      anomalies: []
    };
    
    // WebSocket connection handling
    ws.onopen = () => {
      connectionStatus.classList.remove('disconnected');
      connectionStatus.classList.add('connected');
      connectionText.textContent = 'Connected';
      
      // Request initial data
      ws.send(JSON.stringify({ type: 'request_data' }));
    };
    
    ws.onclose = () => {
      connectionStatus.classList.remove('connected');
      connectionStatus.classList.add('disconnected');
      connectionText.textContent = 'Disconnected';
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'chaos_event':
          handleChaosEvent(data);
          break;
        case 'metric_update':
          handleMetricUpdate(data);
          break;
        case 'ux_impact':
          handleUXImpact(data);
          break;
        case 'recovery_attempt':
          handleRecoveryAttempt(data);
          break;
        case 'system_status':
          handleSystemStatus(data);
          break;
        case 'anomaly_detected':
          handleAnomalyDetected(data);
          break;
        case 'initial_data':
          handleInitialData(data);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
      
      // Update UI
      updateUI();
    };
    
    // Event handlers and UI update functions
    function handleChaosEvent(data) {
      if (data.active) {
        state.activeEvents.push(data.event);
      } else {
        state.activeEvents = state.activeEvents.filter(e => e.id !== data.event.id);
      }
      
      // Add to events list
      state.events.push({
        ...data.event,
        timestamp: Date.now(),
        type: data.active ? 'failure' : 'recovery'
      });
      
      // Keep only the last 100 events
      if (state.events.length > 100) {
        state.events = state.events.slice(-100);
      }
    }
    
    function handleMetricUpdate(data) {
      if (!state.metrics[data.metric]) {
        state.metrics[data.metric] = {
          values: [],
          timestamps: []
        };
      }
      
      state.metrics[data.metric].values.push(data.value);
      state.metrics[data.metric].timestamps.push(Date.now());
      
      // Keep only the last 100 data points
      if (state.metrics[data.metric].values.length > 100) {
        state.metrics[data.metric].values.shift();
        state.metrics[data.metric].timestamps.shift();
      }
    }
    
    function handleUXImpact(data) {
      state.uxImpacts.push({
        ...data,
        timestamp: Date.now()
      });
      
      // Keep only the last 100 impacts
      if (state.uxImpacts.length > 100) {
        state.uxImpacts = state.uxImpacts.slice(-100);
      }
    }
    
    function handleRecoveryAttempt(data) {
      state.recoveryAttempts.total++;
      
      if (data.success) {
        state.recoveryAttempts.success++;
        
        if (data.path === 'primary') {
          state.recoveryAttempts.primary++;
        } else if (data.path === 'secondary') {
          state.recoveryAttempts.secondary++;
        } else if (data.path === 'fallback') {
          state.recoveryAttempts.fallback++;
        }
      }
      
      // Add to events list
      state.events.push({
        component: data.component,
        description: \`Recovery attempt (\${data.path}): \${data.success ? 'Success' : 'Failure'}\`,
        timestamp: Date.now(),
        type: data.success ? 'recovery' : 'failure'
      });
    }
    
    function handleSystemStatus(data) {
      state.systemStatus = {
        ...state.systemStatus,
        ...data.status
      };
    }
    
    function handleAnomalyDetected(data) {
      state.anomalies.push({
        ...data,
        timestamp: Date.now()
      });
      
      // Keep only the last 50 anomalies
      if (state.anomalies.length > 50) {
        state.anomalies = state.anomalies.slice(-50);
      }
    }
    
    function handleInitialData(data) {
      if (data.recoveryPaths) {
        state.recoveryPaths = data.recoveryPaths;
        renderRecoveryPaths();
      }
      
      if (data.metrics) {
        state.metrics = data.metrics;
      }
      
      if (data.systemStatus) {
        state.systemStatus = data.systemStatus;
      }
      
      if (data.activeEvents) {
        state.activeEvents = data.activeEvents;
      }
      
      // Update UI
      updateUI();
    }
    
    // UI update functions
    function updateUI() {
      updateActiveChaos();
      updateSystemStatus();
      updateUXImpact();
      updateRecoveryRate();
      updateRecentEvents();
      renderRecoveryPaths();
    }
    
    function updateActiveChaos() {
      const activeChaosEl = document.getElementById('active-chaos');
      
      if (state.activeEvents.length === 0) {
        activeChaosEl.innerHTML = '<p>No active chaos events</p>';
        return;
      }
      
      let html = '';
      for (const event of state.activeEvents) {
        html += \`
          <div class="event failure">
            <strong>\${event.component || 'Unknown'}</strong>: \${event.type || 'Unknown failure'}
            <div>\${event.description || ''}</div>
            <div><small>Started: \${new Date(event.timestamp || Date.now()).toLocaleTimeString()}</small></div>
          </div>
        \`;
      }
      
      activeChaosEl.innerHTML = html;
    }
    
    function updateSystemStatus() {
      const systemStatusEl = document.getElementById('system-status');
      
      let html = '';
      for (const [component, status] of Object.entries(state.systemStatus)) {
        const statusClass = status === 'healthy' ? 'success' : (status === 'degraded' ? 'warning' : 'critical');
        
        html += \`
          <div class="event \${statusClass}">
            <strong>\${component}</strong>: \${status}
          </div>
        \`;
      }
      
      systemStatusEl.innerHTML = html;
    }
    
    function updateUXImpact() {
      const uxImpactEl = document.getElementById('ux-impact');
      const uxImpactDetailsEl = document.getElementById('ux-impact-details');
      
      if (state.uxImpacts.length === 0) {
        uxImpactEl.textContent = '-';
        uxImpactDetailsEl.innerHTML = '<p>No UX impacts recorded</p>';
        return;
      }
      
      // Calculate average severity
      const totalSeverity = state.uxImpacts.reduce((sum, impact) => sum + impact.severity, 0);
      const avgSeverity = totalSeverity / state.uxImpacts.length;
      
      // Update metric
      uxImpactEl.textContent = avgSeverity.toFixed(2);
      
      // Update details
      let html = \`<p>Total impacts: \${state.uxImpacts.length}</p>\`;
      
      // Count by severity
      const countBySeverity = [0, 0, 0, 0, 0, 0];
      for (const impact of state.uxImpacts) {
        countBySeverity[impact.severity]++;
      }
      
      html += '<p>Distribution by severity:</p>';
      html += '<ul>';
      for (let i = 0; i < countBySeverity.length; i++) {
        if (countBySeverity[i] > 0) {
          html += \`<li>Level \${i}: \${countBySeverity[i]}</li>\`;
        }
      }
      html += '</ul>';
      
      uxImpactDetailsEl.innerHTML = html;
    }
    
    function updateRecoveryRate() {
      const recoveryRateEl = document.getElementById('recovery-rate');
      const recoveryDetailsEl = document.getElementById('recovery-details');
      
      if (state.recoveryAttempts.total === 0) {
        recoveryRateEl.textContent = '-';
        recoveryDetailsEl.innerHTML = '<p>No recovery attempts recorded</p>';
        return;
      }
      
      // Calculate success rate
      const successRate = (state.recoveryAttempts.success / state.recoveryAttempts.total) * 100;
      
      // Update metric
      recoveryRateEl.textContent = \`\${successRate.toFixed(1)}%\`;
      
      // Update details
      let html = \`<p>Total attempts: \${state.recoveryAttempts.total}</p>\`;
      html += \`<p>Successful: \${state.recoveryAttempts.success}</p>\`;
      html += '<p>By recovery path:</p>';
      html += '<ul>';
      html += \`<li>Primary: \${state.recoveryAttempts.primary}</li>\`;
      html += \`<li>Secondary: \${state.recoveryAttempts.secondary}</li>\`;
      html += \`<li>Fallback: \${state.recoveryAttempts.fallback}</li>\`;
      html += '</ul>';
      
      recoveryDetailsEl.innerHTML = html;
    }
    
    function updateRecentEvents() {
      const recentEventsEl = document.getElementById('recent-events');
      
      if (state.events.length === 0) {
        recentEventsEl.innerHTML = '<p>No events recorded</p>';
        return;
      }
      
      let html = '';
      for (const event of state.events.slice(-10).reverse()) {
        html += \`
          <div class="event \${event.type}">
            <strong>\${event.component || 'System'}</strong>: \${event.description || event.type}
            <div><small>\${new Date(event.timestamp).toLocaleTimeString()}</small></div>
          </div>
        \`;
      }
      
      recentEventsEl.innerHTML = html;
    }
    
    function renderRecoveryPaths() {
      const recoveryPathVizEl = document.getElementById('recovery-path-viz');
      
      if (state.recoveryPaths.length === 0) {
        recoveryPathVizEl.innerHTML = '<p>No recovery paths available</p>';
        return;
      }
      
      let html = '<div style="padding: 20px;">';
      
      for (const path of state.recoveryPaths) {
        html += \`
          <div style="margin-bottom: 30px;">
            <h3>\${path.component}</h3>
            <div style="display: flex; align-items: center; flex-wrap: wrap;">
              <div style="background-color: #e9ecef; padding: 10px; border-radius: 4px; margin-right: 20px; margin-bottom: 10px;">
                \${path.component}
              </div>
              <div style="font-size: 24px; margin-right: 20px;">→</div>
              <div style="background-color: #d8f5a2; padding: 10px; border-radius: 4px; border: 2px solid #94d82d; margin-bottom: 10px;">
                Primary: \${path.primary}
              </div>
        \`;
        
        if (path.secondary) {
          html += \`
              <div style="font-size: 24px; margin: 0 20px;">→</div>
              <div style="background-color: #ffec99; padding: 10px; border-radius: 4px; border: 2px solid #fcc419; margin-bottom: 10px;">
                Secondary: \${path.secondary}
              </div>
          \`;
        }
        
        if (path.fallback) {
          html += \`
              <div style="font-size: 24px; margin: 0 20px;">→</div>
              <div style="background-color: #ffc9c9; padding: 10px; border-radius: 4px; border: 2px solid #ff8787; margin-bottom: 10px;">
                Fallback: \${path.fallback}
              </div>
          \`;
        }
        
        html += \`
            </div>
            <div style="margin-top: 10px; color: #666;">
              Expected recovery time: \${path.recoveryTime}ms
            </div>
          </div>
        \`;
      }
      
      html += '</div>';
      
      recoveryPathVizEl.innerHTML = html;
    }
  </script>
</body>
</html>`;
  
  fs.writeFileSync(dashboardHtmlPath, dashboardHtml, 'utf8');
  console.log(`Created dashboard HTML file: ${dashboardHtmlPath}`);
}

// Start the server
const PORT = 3030;
server.listen(PORT, () => {
  console.log(`Chaos Dashboard available at http://localhost:${PORT}`);
});