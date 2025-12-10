/**
 * Redis Memory Testing Component
 * 
 * This component provides a test harness for validating Redis memory operations,
 * including storage, retrieval, and context management for the cognitive pipeline.
 */

import React, { useState, useEffect } from 'react';
import mockBackend, { Intent } from '../../mocks/mock-backend';

// Types for Redis memory testing
export interface MemoryTestConfig {
  sessionId: string;
  maxItems: number;
  persistenceEnabled: boolean;
  ttlSeconds: number;
  compressionEnabled: boolean;
}

export interface MemoryTestResult {
  operation: 'store' | 'retrieve' | 'search' | 'delete' | 'flush';
  success: boolean;
  duration: number;
  itemCount?: number;
  error?: string;
  data?: any;
}

export interface MemoryStats {
  totalItems: number;
  totalSizeBytes: number;
  avgItemSizeBytes: number;
  oldestItemAge: number;
  newestItemAge: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
}

// Default configuration
const DEFAULT_CONFIG: MemoryTestConfig = {
  sessionId: 'test-session',
  maxItems: 100,
  persistenceEnabled: true,
  ttlSeconds: 3600, // 1 hour
  compressionEnabled: true
};

interface RedisMemoryTestProps {
  config?: Partial<MemoryTestConfig>;
  onResult?: (result: MemoryTestResult) => void;
  onStatsUpdate?: (stats: MemoryStats) => void;
  className?: string;
}

const RedisMemoryTest: React.FC<RedisMemoryTestProps> = ({
  config = {},
  onResult,
  onStatsUpdate,
  className = ''
}) => {
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<MemoryTestConfig>({
    ...DEFAULT_CONFIG,
    ...config
  });
  const [results, setResults] = useState<MemoryTestResult[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [storedIntents, setStoredIntents] = useState<Intent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize
  useEffect(() => {
    const initializeTest = async () => {
      try {
        // Initialize mock backend
        await mockBackend.initialize();
        
        // Check if memory is available
        if (!mockBackend.getTelemetryData) {
          throw new Error('Mock backend does not support telemetry data');
        }
        
        const telemetry = await mockBackend.getTelemetryData();
        if (!telemetry) {
          throw new Error('Failed to get telemetry data');
        }
        
        setIsInitialized(true);
        
        // Load initial stats
        await refreshStats();
        
        // Load stored intents
        await refreshStoredIntents();
      } catch (error) {
        setErrorMessage(`Failed to initialize Redis memory test: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    
    initializeTest();
  }, []);
  
  // Refresh stats
  const refreshStats = async () => {
    try {
      // In a real implementation, this would call a Redis stats API
      // For the mock, we'll generate some plausible stats
      
      const sessionHistory = await mockBackend.getSessionHistory(currentConfig.sessionId);
      const itemCount = sessionHistory.length;
      
      // Generate mock stats
      const mockStats: MemoryStats = {
        totalItems: itemCount,
        totalSizeBytes: itemCount * 1024, // Assume 1KB per item
        avgItemSizeBytes: itemCount > 0 ? 1024 : 0,
        oldestItemAge: itemCount > 0 ? 3600 : 0, // 1 hour in seconds
        newestItemAge: itemCount > 0 ? 60 : 0, // 1 minute in seconds
        hitRate: 0.85, // 85% hit rate
        missRate: 0.15, // 15% miss rate
        evictionCount: 0
      };
      
      setStats(mockStats);
      
      // Call onStatsUpdate callback
      if (onStatsUpdate) {
        onStatsUpdate(mockStats);
      }
    } catch (error) {
      setErrorMessage(`Failed to refresh stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Refresh stored intents
  const refreshStoredIntents = async () => {
    try {
      const sessionHistory = await mockBackend.getSessionHistory(currentConfig.sessionId, currentConfig.maxItems);
      setStoredIntents(sessionHistory);
    } catch (error) {
      setErrorMessage(`Failed to refresh stored intents: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Store a test intent
  const storeTestIntent = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    
    const startTime = Date.now();
    
    try {
      // Create a test intent
      const testText = `Test intent ${new Date().toISOString()}`;
      const intent = await mockBackend.processText(testText);
      
      // Dispatch the intent
      await mockBackend.dispatchIntent(intent.id);
      
      // Store in Redis memory
      const success = await mockBackend.storeIntent(intent.id);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Create result
      const result: MemoryTestResult = {
        operation: 'store',
        success,
        duration,
        data: intent
      };
      
      // Update results
      setResults(prev => [result, ...prev]);
      
      // Call onResult callback
      if (onResult) {
        onResult(result);
      }
      
      // Refresh stored intents
      await refreshStoredIntents();
      
      // Refresh stats
      await refreshStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrorMessage(errorMessage);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Create error result
      const result: MemoryTestResult = {
        operation: 'store',
        success: false,
        duration,
        error: errorMessage
      };
      
      // Update results
      setResults(prev => [result, ...prev]);
      
      // Call onResult callback
      if (onResult) {
        onResult(result);
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Search intents
  const searchIntents = async () => {
    if (!searchQuery.trim()) {
      setErrorMessage('Please enter a search query');
      return;
    }
    
    setIsProcessing(true);
    setErrorMessage(null);
    
    const startTime = Date.now();
    
    try {
      // Search intents
      const searchResults = await mockBackend.searchIntents(searchQuery);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Create result
      const result: MemoryTestResult = {
        operation: 'search',
        success: true,
        duration,
        itemCount: searchResults.length,
        data: searchResults
      };
      
      // Update results
      setResults(prev => [result, ...prev]);
      
      // Call onResult callback
      if (onResult) {
        onResult(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrorMessage(errorMessage);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Create error result
      const result: MemoryTestResult = {
        operation: 'search',
        success: false,
        duration,
        error: errorMessage
      };
      
      // Update results
      setResults(prev => [result, ...prev]);
      
      // Call onResult callback
      if (onResult) {
        onResult(result);
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Update configuration
  const updateConfig = (key: keyof MemoryTestConfig, value: any) => {
    setCurrentConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Render
  return (
    <div className={`redis-memory-test ${className}`} data-testid="redis-memory-test">
      <div className="memory-test-header">
        <h2>Redis Memory Test Harness</h2>
        {!isInitialized && <p>Initializing...</p>}
      </div>
      
      {errorMessage && (
        <div className="memory-test-error" role="alert">
          <p>{errorMessage}</p>
          <button onClick={() => setErrorMessage(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="memory-test-controls">
        <div className="memory-test-config">
          <h3>Configuration</h3>
          
          <div className="config-controls">
            <div className="config-item">
              <label htmlFor="session-id">Session ID:</label>
              <input
                id="session-id"
                type="text"
                value={currentConfig.sessionId}
                onChange={(e) => updateConfig('sessionId', e.target.value)}
                disabled={isProcessing}
              />
            </div>
            
            <div className="config-item">
              <label htmlFor="max-items">Max Items:</label>
              <input
                id="max-items"
                type="number"
                min="1"
                max="1000"
                value={currentConfig.maxItems}
                onChange={(e) => updateConfig('maxItems', Number(e.target.value))}
                disabled={isProcessing}
              />
            </div>
            
            <div className="config-item">
              <label htmlFor="ttl-seconds">TTL (seconds):</label>
              <input
                id="ttl-seconds"
                type="number"
                min="1"
                max="86400"
                value={currentConfig.ttlSeconds}
                onChange={(e) => updateConfig('ttlSeconds', Number(e.target.value))}
                disabled={isProcessing}
              />
            </div>
            
            <div className="config-checkbox">
              <input
                id="persistence-enabled"
                type="checkbox"
                checked={currentConfig.persistenceEnabled}
                onChange={(e) => updateConfig('persistenceEnabled', e.target.checked)}
                disabled={isProcessing}
              />
              <label htmlFor="persistence-enabled">Enable Persistence</label>
            </div>
            
            <div className="config-checkbox">
              <input
                id="compression-enabled"
                type="checkbox"
                checked={currentConfig.compressionEnabled}
                onChange={(e) => updateConfig('compressionEnabled', e.target.checked)}
                disabled={isProcessing}
              />
              <label htmlFor="compression-enabled">Enable Compression</label>
            </div>
          </div>
        </div>
        
        <div className="memory-test-actions">
          <h3>Actions</h3>
          
          <div className="action-buttons">
            <button
              onClick={storeTestIntent}
              disabled={!isInitialized || isProcessing}
            >
              Store Test Intent
            </button>
            
            <button
              onClick={refreshStoredIntents}
              disabled={!isInitialized || isProcessing}
            >
              Refresh Stored Intents
            </button>
            
            <button
              onClick={refreshStats}
              disabled={!isInitialized || isProcessing}
            >
              Refresh Stats
            </button>
          </div>
          
          <div className="search-controls">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search intents..."
              disabled={!isInitialized || isProcessing}
            />
            
            <button
              onClick={searchIntents}
              disabled={!isInitialized || isProcessing || !searchQuery.trim()}
            >
              Search
            </button>
          </div>
        </div>
      </div>
      
      <div className="memory-test-stats">
        <h3>Memory Stats</h3>
        
        {stats ? (
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Items:</span>
              <span className="stat-value">{stats.totalItems}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Total Size:</span>
              <span className="stat-value">{(stats.totalSizeBytes / 1024).toFixed(2)} KB</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Avg Item Size:</span>
              <span className="stat-value">{(stats.avgItemSizeBytes / 1024).toFixed(2)} KB</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Oldest Item Age:</span>
              <span className="stat-value">{formatDuration(stats.oldestItemAge)}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Newest Item Age:</span>
              <span className="stat-value">{formatDuration(stats.newestItemAge)}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Hit Rate:</span>
              <span className="stat-value">{(stats.hitRate * 100).toFixed(1)}%</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Miss Rate:</span>
              <span className="stat-value">{(stats.missRate * 100).toFixed(1)}%</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Evictions:</span>
              <span className="stat-value">{stats.evictionCount}</span>
            </div>
          </div>
        ) : (
          <p>No stats available</p>
        )}
      </div>
      
      <div className="memory-test-stored-intents">
        <h3>Stored Intents</h3>
        
        {storedIntents.length === 0 ? (
          <p>No intents stored yet</p>
        ) : (
          <table className="intents-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Text</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {storedIntents.map((intent) => (
                <tr key={intent.id}>
                  <td>{intent.id.substring(0, 8)}...</td>
                  <td>{intent.type}</td>
                  <td>{intent.text}</td>
                  <td>{intent.status}</td>
                  <td>{formatDate(intent.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="memory-test-results">
        <h3>Test Results</h3>
        
        {results.length === 0 ? (
          <p>No test results yet</p>
        ) : (
          <div className="results-list">
            {results.map((result, index) => (
              <div key={index} className="result-item">
                <div className="result-header">
                  <h4>{capitalizeFirstLetter(result.operation)}</h4>
                  <span className={`result-status ${result.success ? 'success' : 'error'}`}>
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                
                <div className="result-content">
                  <div className="result-row">
                    <span className="result-label">Duration:</span>
                    <span className="result-value">{result.duration}ms</span>
                  </div>
                  
                  {result.itemCount !== undefined && (
                    <div className="result-row">
                      <span className="result-label">Items:</span>
                      <span className="result-value">{result.itemCount}</span>
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="result-row error">
                      <span className="result-label">Error:</span>
                      <span className="result-value">{result.error}</span>
                    </div>
                  )}
                  
                  {result.data && (
                    <div className="result-row">
                      <span className="result-label">Data:</span>
                      <pre className="result-data">{JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {results.length > 0 && (
          <div className="results-actions">
            <button onClick={() => setResults([])}>Clear Results</button>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .redis-memory-test {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .memory-test-header h2 {
          margin-top: 0;
          color: #333;
        }
        
        .memory-test-error {
          background-color: #ffebee;
          color: #c62828;
          padding: 10px 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .memory-test-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .memory-test-config,
        .memory-test-actions {
          flex: 1;
          min-width: 300px;
        }
        
        .config-controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .config-item {
          display: flex;
          align-items: center;
        }
        
        .config-item label {
          width: 120px;
          font-weight: 500;
        }
        
        .config-item input {
          flex: 1;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .config-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .action-buttons button {
          padding: 8px 16px;
          background-color: #1976d2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .action-buttons button:hover {
          background-color: #1565c0;
        }
        
        .action-buttons button:disabled {
          background-color: #b0bec5;
          cursor: not-allowed;
        }
        
        .search-controls {
          display: flex;
          gap: 10px;
        }
        
        .search-controls input {
          flex: 1;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .search-controls button {
          padding: 8px 16px;
          background-color: #1976d2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .memory-test-stats {
          margin-bottom: 20px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
        }
        
        .stat-item {
          background-color: white;
          padding: 10px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .stat-label {
          font-weight: 500;
          color: #555;
          display: block;
          margin-bottom: 5px;
        }
        
        .stat-value {
          font-size: 1.2rem;
          color: #333;
        }
        
        .intents-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        .intents-table th,
        .intents-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .intents-table th {
          background-color: #f5f5f5;
          font-weight: 500;
        }
        
        .results-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .result-item {
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          background-color: #f5f5f5;
          border-bottom: 1px solid #eee;
        }
        
        .result-header h4 {
          margin: 0;
        }
        
        .result-status {
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 4px;
        }
        
        .result-status.success {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        
        .result-status.error {
          background-color: #ffebee;
          color: #c62828;
        }
        
        .result-content {
          padding: 15px;
        }
        
        .result-row {
          margin-bottom: 8px;
        }
        
        .result-label {
          font-weight: 500;
          margin-right: 8px;
        }
        
        .result-row.error {
          color: #c62828;
        }
        
        .result-data {
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          overflow: auto;
          max-height: 200px;
          font-size: 0.9rem;
        }
        
        .results-actions {
          margin-top: 15px;
          text-align: right;
        }
        
        .results-actions button {
          padding: 8px 16px;
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

// Helper functions
function formatDate(date: Date): string {
  return new Date(date).toLocaleString();
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default RedisMemoryTest;