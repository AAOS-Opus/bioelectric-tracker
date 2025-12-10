import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TrendAnalyzer } from '@/lib/metrics/trendAnalyzer';
import { TrendChart } from '@/components/metrics/TrendChart';
import { CorrelationMatrix } from '@/components/metrics/CorrelationMatrix';
import { PredictiveChart } from '@/components/metrics/PredictiveChart';
import { mockTrendData } from '../mocks/trendDataMock';

// Mock timers and performance
jest.useFakeTimers();

describe('Advanced Trend Detection & Prediction', () => {
  
  describe('Moving Averages & Rate of Change', () => {
    test('calculates moving averages accurately', () => {
      const analyzer = new TrendAnalyzer();
      
      // Simple linear data
      const linearData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value, index) => ({
        date: new Date(2025, 2, index + 1).toISOString(),
        value
      }));
      
      // Calculate 3-day moving average
      const movingAverage3Day = analyzer.calculateMovingAverage(linearData, 3);
      
      // First point should start at index 2 (after having 3 points)
      expect(movingAverage3Day.length).toBe(linearData.length - 2);
      expect(movingAverage3Day[0].value).toBeCloseTo((1 + 2 + 3) / 3, 2);
      expect(movingAverage3Day[1].value).toBeCloseTo((2 + 3 + 4) / 3, 2);
      
      // 7-day moving average
      const movingAverage7Day = analyzer.calculateMovingAverage(linearData, 7);
      
      // First point should start at index 6
      expect(movingAverage7Day.length).toBe(linearData.length - 6);
      expect(movingAverage7Day[0].value).toBeCloseTo((1 + 2 + 3 + 4 + 5 + 6 + 7) / 7, 2);
    });
    
    test('calculates rate-of-change accurately', () => {
      const analyzer = new TrendAnalyzer();
      
      // Exponential growth data
      const exponentialData = [1, 2, 4, 8, 16, 32].map((value, index) => ({
        date: new Date(2025, 2, index + 1).toISOString(),
        value
      }));
      
      // Calculate day-over-day rate of change
      const dailyRoC = analyzer.calculateRateOfChange(exponentialData, 1);
      
      // Each point should have 100% growth over the previous
      expect(dailyRoC.length).toBe(exponentialData.length - 1);
      expect(dailyRoC.every(point => point.value === 1)).toBe(true); // 100% growth
      
      // Linear data
      const linearData = [10, 20, 30, 40, 50].map((value, index) => ({
        date: new Date(2025, 2, index + 1).toISOString(),
        value
      }));
      
      const linearRoC = analyzer.calculateRateOfChange(linearData, 1);
      
      // Each point should have consistent percentage growth
      // For 10→20, growth is (20-10)/10 = 1
      expect(linearRoC[0].value).toBeCloseTo(1, 2);
      expect(linearRoC[1].value).toBeCloseTo(0.5, 2); // (30-20)/20 = 0.5
      expect(linearRoC[2].value).toBeCloseTo(0.33, 2); // (40-30)/30 = 0.33...
    });
  });
  
  describe('Correlation Detection', () => {
    test('calculates correlation matrix correctly between key metrics', () => {
      const analyzer = new TrendAnalyzer();
      const correlationMatrix = analyzer.calculateCorrelationMatrix(mockTrendData.multiMetricDataset);
      
      // Number of metrics should match input dataset
      const metricCount = Object.keys(mockTrendData.multiMetricDataset).length;
      expect(Object.keys(correlationMatrix).length).toBe(metricCount);
      
      // Each metric should have correlation values with all other metrics
      Object.keys(correlationMatrix).forEach(metric => {
        expect(Object.keys(correlationMatrix[metric]).length).toBe(metricCount - 1);
      });
      
      // Strong correlations should be identified (sleep and energy are strongly correlated in mock data)
      expect(correlationMatrix.sleep.energy).toBeGreaterThan(0.7);
      
      // Anti-correlations should be identified (stress and energy are negatively correlated in mock data)
      expect(correlationMatrix.stress.energy).toBeLessThan(0);
    });
    
    test('renders correlation matrix chart correctly', () => {
      // Get correlation data from analyzer
      const analyzer = new TrendAnalyzer();
      const correlationData = analyzer.calculateCorrelationMatrix(mockTrendData.multiMetricDataset);
      
      // Render matrix component
      const { container } = render(
        <CorrelationMatrix 
          data={correlationData} 
          metricLabels={{
            sleep: 'Sleep Quality',
            energy: 'Energy Level',
            stress: 'Stress Level',
            digestion: 'Digestion Quality',
            mood: 'Mood Score'
          }}
        />
      );
      
      // Check that each cell exists and has color coding
      const cells = container.querySelectorAll('.correlation-cell');
      
      // Should have n² - n cells (no self-correlations)
      const metricCount = Object.keys(correlationData).length;
      expect(cells.length).toBe(metricCount * metricCount - metricCount);
      
      // Check for strong positive correlation cell
      const strongPositiveCell = Array.from(cells).find(cell => 
        cell.textContent.includes('0.7') || cell.textContent.includes('0.8') || cell.textContent.includes('0.9')
      );
      expect(strongPositiveCell).toHaveClass('strong-positive');
      
      // Check for negative correlation cell
      const negativeCell = Array.from(cells).find(cell => 
        cell.textContent.includes('-')
      );
      expect(negativeCell).toHaveClass('negative');
    });
  });
  
  describe('Predictive Modeling', () => {
    test('generates accurate future projections for health index', () => {
      const analyzer = new TrendAnalyzer();
      
      // Generate prediction based on existing trend
      const historicalData = mockTrendData.healthIndexHistory;
      const prediction = analyzer.predictFutureTrend(historicalData, 14); // 14-day prediction
      
      // Should return the right number of prediction points
      expect(prediction.projectedPoints.length).toBe(14);
      
      // First projected point should be after the last historical point
      const lastHistoricalDate = new Date(historicalData[historicalData.length - 1].date);
      const firstProjectionDate = new Date(prediction.projectedPoints[0].date);
      expect(firstProjectionDate > lastHistoricalDate).toBe(true);
      
      // Values should follow the trend direction
      const historicalSlope = analyzer.calculateTrendSlope(historicalData);
      
      if (historicalSlope > 0) {
        // If positive trend, last prediction should be higher than first
        expect(prediction.projectedPoints[prediction.projectedPoints.length - 1].value)
          .toBeGreaterThan(prediction.projectedPoints[0].value);
      } else if (historicalSlope < 0) {
        // If negative trend, last prediction should be lower than first
        expect(prediction.projectedPoints[prediction.projectedPoints.length - 1].value)
          .toBeLessThan(prediction.projectedPoints[0].value);
      }
      
      // Prediction should include confidence intervals
      expect(prediction.projectedPoints[0].upperBound).toBeGreaterThan(prediction.projectedPoints[0].value);
      expect(prediction.projectedPoints[0].lowerBound).toBeLessThan(prediction.projectedPoints[0].value);
      
      // Confidence interval should widen over time
      const firstIntervalWidth = prediction.projectedPoints[0].upperBound - prediction.projectedPoints[0].lowerBound;
      const lastIntervalWidth = prediction.projectedPoints[13].upperBound - prediction.projectedPoints[13].lowerBound;
      expect(lastIntervalWidth).toBeGreaterThan(firstIntervalWidth);
    });
    
    test('renders predictive chart with confidence intervals', () => {
      const analyzer = new TrendAnalyzer();
      const historicalData = mockTrendData.healthIndexHistory;
      const prediction = analyzer.predictFutureTrend(historicalData, 14);
      
      // Render prediction chart
      const { container } = render(
        <PredictiveChart
          historicalData={historicalData}
          projectedData={prediction.projectedPoints}
          metricName="Health Index"
          dataTestId="predictive-chart"
        />
      );
      
      // Should show both historical and projected data
      expect(screen.getByTestId('predictive-chart')).toBeInTheDocument();
      
      // Should have historical line
      const historicalLine = container.querySelector('.historical-line');
      expect(historicalLine).toBeInTheDocument();
      
      // Should have projection line
      const projectionLine = container.querySelector('.projection-line');
      expect(projectionLine).toBeInTheDocument();
      
      // Should have confidence interval area
      const confidenceArea = container.querySelector('.confidence-interval');
      expect(confidenceArea).toBeInTheDocument();
    });
  });
  
  describe('Pattern Recognition', () => {
    test('detects seasonal patterns correctly', () => {
      const analyzer = new TrendAnalyzer();
      
      // Seasonal test data - a metric that cycles every 7 days
      const seasonalData = [];
      for (let i = 0; i < 56; i++) { // 8 weeks of data
        seasonalData.push({
          date: new Date(2025, 0, i + 1).toISOString(),
          value: 5 + 3 * Math.sin((i % 7) * Math.PI / 3) // Value cycles every 7 days
        });
      }
      
      const patterns = analyzer.detectPatterns(seasonalData);
      
      // Should detect weekly pattern
      expect(patterns.seasonalPatterns).toBeTruthy();
      expect(patterns.seasonalPatterns.some(p => p.periodDays === 7)).toBe(true);
      
      // Should identify strong pattern
      const weeklyPattern = patterns.seasonalPatterns.find(p => p.periodDays === 7);
      expect(weeklyPattern.strength).toBeGreaterThan(0.7);
    });
    
    test('detects and characterizes cyclical patterns', () => {
      const analyzer = new TrendAnalyzer();
      
      // Cyclical data with longer-term trend
      const cyclicalData = mockTrendData.cyclicalWithTrend;
      
      const patterns = analyzer.detectPatterns(cyclicalData);
      
      // Should identify both cyclical pattern and underlying trend
      expect(patterns.hasCycles).toBe(true);
      expect(patterns.underlyingTrend).not.toBe(0);
      
      // Should identify cycle periods
      expect(patterns.cycles.length).toBeGreaterThan(0);
      expect(patterns.cycles[0].periodDays).toBeGreaterThan(0);
    });
    
    test('detects anomalies with appropriate sensitivity', () => {
      const analyzer = new TrendAnalyzer();
      
      // Data with clear anomalies
      const dataWithAnomalies = mockTrendData.dataWithAnomalies;
      
      // Default sensitivity
      const anomaliesDefault = analyzer.detectAnomalies(dataWithAnomalies);
      
      // Should detect the obvious anomalies
      expect(anomaliesDefault.length).toBeGreaterThanOrEqual(2);
      
      // High sensitivity - should detect more anomalies
      const anomaliesHighSensitivity = analyzer.detectAnomalies(dataWithAnomalies, { sensitivity: 'high' });
      expect(anomaliesHighSensitivity.length).toBeGreaterThan(anomaliesDefault.length);
      
      // Low sensitivity - should detect fewer anomalies
      const anomaliesLowSensitivity = analyzer.detectAnomalies(dataWithAnomalies, { sensitivity: 'low' });
      expect(anomaliesLowSensitivity.length).toBeLessThan(anomaliesDefault.length);
    });
  });
  
  describe('Confidence Intervals', () => {
    test('scales confidence intervals based on data quality', () => {
      const analyzer = new TrendAnalyzer();
      
      // High quality data (frequent, consistent)
      const highQualityData = mockTrendData.highQualityData;
      const highQualityPrediction = analyzer.predictFutureTrend(highQualityData, 7);
      
      // Low quality data (sparse, high variance)
      const lowQualityData = mockTrendData.lowQualityData;
      const lowQualityPrediction = analyzer.predictFutureTrend(lowQualityData, 7);
      
      // Measure confidence interval widths
      const getAverageIntervalWidth = (prediction) => {
        return prediction.projectedPoints.reduce((sum, point) => 
          sum + (point.upperBound - point.lowerBound), 0
        ) / prediction.projectedPoints.length;
      };
      
      const highQualityWidth = getAverageIntervalWidth(highQualityPrediction);
      const lowQualityWidth = getAverageIntervalWidth(lowQualityPrediction);
      
      // Low quality data should have wider confidence intervals
      expect(lowQualityWidth).toBeGreaterThan(highQualityWidth);
    });
  });
});
