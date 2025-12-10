import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataPipeline } from '@/lib/metrics/dataPipeline';
import { MetricsStore } from '@/stores/metricsStore';
import { MetricsDashboard } from '@/components/dashboard/MetricsDashboard';
import { mockUsageData } from '../mocks/productUsageMock';
import { mockModalitySessions } from '../mocks/modalitySessionsMock';
import { mockWearableData } from '../mocks/wearableDataMock';
import { mockUserInput } from '../mocks/userInputMock';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Mock timers and performance
jest.useFakeTimers();

// Mock MSW server for API endpoints
const server = setupServer(
  rest.post('/api/metrics/ingest', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  }),
  
  rest.get('/api/metrics/anomalies', (req, res, ctx) => {
    return res(ctx.json({
      anomalies: [
        {
          id: 'anom_001',
          metricName: 'heart_rate_variability',
          timestamp: '2025-03-20T08:30:00Z',
          expectedRange: [45, 65],
          actualValue: 85,
          severity: 'medium',
          possibleCauses: ['stress', 'medication', 'measurement error']
        }
      ]
    }));
  }),
  
  rest.post('/api/metrics/verify', (req, res, ctx) => {
    return res(ctx.json({ success: true, verifiedValue: req.body.value }));
  }),
  
  rest.get('/api/metrics/phase-transition', (req, res, ctx) => {
    return res(ctx.json({
      phaseId: 2,
      transitionDate: '2025-03-15',
      baselineMetrics: {
        'sleep_quality': 0.65,
        'energy_level': 0.72,
        'stress_level': 0.45
      }
    }));
  })
);

// Start server before tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Integrated Data Pipeline', () => {
  describe('Data Ingestion', () => {
    test('ingests product usage data correctly', async () => {
      const pipeline = new DataPipeline();
      const result = await pipeline.ingestProductUsage(mockUsageData.validUsageData);
      
      expect(result.success).toBe(true);
      expect(result.processedRecords).toBe(mockUsageData.validUsageData.length);
      
      // Verify data is accessible through pipeline query
      const productMetrics = await pipeline.getMetricsByCategory('products');
      
      expect(productMetrics.length).toBeGreaterThan(0);
      expect(productMetrics.some(m => m.productId === mockUsageData.validUsageData[0].productId)).toBe(true);
    });
    
    test('ingests modality session data correctly', async () => {
      const pipeline = new DataPipeline();
      const result = await pipeline.ingestModalitySessions(mockModalitySessions.validSessions);
      
      expect(result.success).toBe(true);
      expect(result.processedRecords).toBe(mockModalitySessions.validSessions.length);
      
      // Check that sessions are properly aggregated by modality type
      const modalityMetrics = await pipeline.getMetricsByCategory('modalities');
      
      const modalityTypes = new Set(mockModalitySessions.validSessions.map(s => s.modalityType));
      expect(modalityMetrics.length).toBe(modalityTypes.size);
    });
    
    test('ingests manual wellness inputs correctly', async () => {
      const pipeline = new DataPipeline();
      const result = await pipeline.ingestUserInputs(mockUserInput.validInputs);
      
      expect(result.success).toBe(true);
      expect(result.processedRecords).toBe(mockUserInput.validInputs.length);
      
      // Verify subjective metrics are stored and accessible
      const subjectiveMetrics = await pipeline.getMetricsByCategory('subjective');
      
      expect(subjectiveMetrics.length).toBeGreaterThan(0);
      expect(subjectiveMetrics.some(m => m.name === 'energy_level')).toBe(true);
    });
    
    test('merges external wearable data correctly', async () => {
      const pipeline = new DataPipeline();
      
      // First ingest internal data
      await pipeline.ingestUserInputs(mockUserInput.validInputs);
      
      // Then merge external wearable data
      const result = await pipeline.mergeExternalData('wearable', mockWearableData.fitbitData);
      
      expect(result.success).toBe(true);
      expect(result.mergedRecords).toBeGreaterThan(0);
      
      // Check that external metrics are properly tagged
      const allMetrics = await pipeline.getAllMetrics();
      const externalMetrics = allMetrics.filter(m => m.source === 'wearable');
      
      expect(externalMetrics.length).toBeGreaterThan(0);
      
      // Check that overlapping metrics are properly reconciled
      const sleepMetrics = allMetrics.filter(m => m.name === 'sleep_quality');
      
      // Should have combined sources for the same dates
      expect(sleepMetrics.some(m => m.sources && m.sources.length > 1)).toBe(true);
    });
  });
  
  describe('Real-time Propagation', () => {
    test('propagates new data to visualizations within 300ms', async () => {
      jest.useFakeTimers();
      
      // Mock the MetricsStore
      const metricsStore = new MetricsStore();
      metricsStore.setMetrics([]);
      
      // Create a fresh MetricsDashboard with visibility tracking
      const renderStartTime = performance.now();
      
      render(<MetricsDashboard store={metricsStore} />);
      
      // Verify dashboard is initially empty
      expect(screen.getByTestId('metrics-loading')).toBeInTheDocument();
      
      // Add new metrics data
      act(() => {
        metricsStore.addMetrics(mockUserInput.validInputs);
      });
      
      // Fast-forward timers and wait for UI update
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      // Check that visualizations updated
      await waitFor(() => {
        expect(screen.getByTestId('metrics-chart')).toBeInTheDocument();
        expect(screen.queryByTestId('metrics-loading')).not.toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const propagationTime = endTime - renderStartTime;
      
      // Total time should be under 300ms threshold
      expect(propagationTime).toBeLessThan(300);
      
      jest.useRealTimers();
    });
  });
  
  describe('Anomaly Detection', () => {
    test('flags anomalies and prompts user verification', async () => {
      const pipeline = new DataPipeline();
      
      // Ingest some baseline data
      await pipeline.ingestUserInputs(mockUserInput.validInputs);
      
      // Ingest anomalous data
      const anomalousData = {
        heart_rate_variability: 85, // Abnormally high based on mock server config
        timestamp: '2025-03-20T08:30:00Z',
        userId: 'user123'
      };
      
      const result = await pipeline.ingestSingleMetric(anomalousData);
      
      // Should be successful but flagged
      expect(result.success).toBe(true);
      expect(result.anomalyDetected).toBe(true);
      
      // Verify anomaly is accessible through API
      const anomalies = await pipeline.getAnomalies();
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].metricName).toBe('heart_rate_variability');
      
      // Test user verification flow
      const verificationResult = await pipeline.verifyAnomalyValue(
        anomalies[0].id,
        anomalies[0].actualValue,
        'user_verified'
      );
      
      expect(verificationResult.success).toBe(true);
      
      // Anomaly should be marked as verified
      const updatedAnomalies = await pipeline.getAnomalies();
      expect(updatedAnomalies.find(a => a.id === anomalies[0].id).status).toBe('verified');
    });
  });
  
  describe('Phase Transitions', () => {
    test('recalculates metrics correctly after phase transitions', async () => {
      const pipeline = new DataPipeline();
      
      // Ingest pre-transition data
      await pipeline.ingestUserInputs(mockUserInput.validInputs);
      
      // Snapshot metrics before transition
      const preTransitionMetrics = await pipeline.getAllMetrics();
      
      // Simulate phase transition
      const phaseTransition = {
        userId: 'user123',
        fromPhase: 1,
        toPhase: 2,
        transitionDate: '2025-03-15'
      };
      
      const result = await pipeline.processPhaseTransition(phaseTransition);
      expect(result.success).toBe(true);
      
      // Ingest post-transition data
      await pipeline.ingestUserInputs(mockUserInput.postTransitionInputs);
      
      // Get updated metrics
      const postTransitionMetrics = await pipeline.getAllMetrics();
      
      // Verify baseline metrics are preserved
      const baselineMetrics = await pipeline.getBaselineMetrics(2); // Phase 2
      expect(baselineMetrics.sleep_quality).toBe(0.65);
      
      // Verify trends are calculated relative to new baseline
      const sleepTrend = await pipeline.getTrendByMetric('sleep_quality', phaseTransition.toPhase);
      
      // Trend should be calculated from phase transition date
      expect(sleepTrend.dataPoints[0].date).toBe(phaseTransition.transitionDate);
      
      // Trend should show improvement or regression relative to baseline
      const latestPoint = sleepTrend.dataPoints[sleepTrend.dataPoints.length - 1];
      expect(latestPoint.value).not.toBe(baselineMetrics.sleep_quality);
      expect(latestPoint.percentChange).not.toBe(0);
    });
  });
});
