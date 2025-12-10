import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HealthIndexCalculator } from '@/lib/metrics/healthIndexCalculator';
import { mockHealthData } from '../mocks/healthDataMock';

// Mock timers for performance testing
jest.useFakeTimers();

describe('Health Index Calculator', () => {
  // 1. Accuracy and Robustness Tests
  describe('Accuracy & Robustness', () => {
    test('calculates composite health scores correctly from controlled datasets', () => {
      const calculator = new HealthIndexCalculator();
      const result = calculator.calculateHealthIndex(mockHealthData.completeDataset);
      expect(result.overallScore).toBeCloseTo(76.5, 1);
      expect(result.categories).toHaveLength(5);
    });

    test('respects user-configured weighting factors', () => {
      const calculator = new HealthIndexCalculator();
      const userWeights = {
        sleep: 0.3,
        nutrition: 0.25,
        modalities: 0.25,
        stress: 0.1,
        exercise: 0.1
      };
      
      // Calculate with default weights
      const defaultResult = calculator.calculateHealthIndex(mockHealthData.completeDataset);
      
      // Calculate with user weights
      const userResult = calculator.calculateHealthIndex(
        mockHealthData.completeDataset, 
        userWeights
      );
      
      // Ensure different weights produce different results
      expect(userResult.overallScore).not.toEqual(defaultResult.overallScore);
      
      // Verify highest weighted category has most impact
      expect(userResult.categoryContributions.sleep)
        .toBeGreaterThan(userResult.categoryContributions.stress);
    });

    test('correctly categorizes health index into thresholds', () => {
      const calculator = new HealthIndexCalculator();
      
      // Test optimal threshold (80-100)
      const optimalResult = calculator.calculateHealthIndex(mockHealthData.optimalDataset);
      expect(optimalResult.status).toBe('Optimal');
      expect(optimalResult.overallScore).toBeGreaterThanOrEqual(80);
      
      // Test improving threshold (60-79)
      const improvingResult = calculator.calculateHealthIndex(mockHealthData.improvingDataset);
      expect(improvingResult.status).toBe('Improving');
      expect(improvingResult.overallScore).toBeGreaterThanOrEqual(60);
      expect(improvingResult.overallScore).toBeLessThan(80);
      
      // Test needs attention threshold (0-59)
      const needsAttentionResult = calculator.calculateHealthIndex(mockHealthData.needsAttentionDataset);
      expect(needsAttentionResult.status).toBe('Attention Needed');
      expect(needsAttentionResult.overallScore).toBeLessThan(60);
    });

    test('handles sparse data with appropriate normalization', () => {
      const calculator = new HealthIndexCalculator();
      const result = calculator.calculateHealthIndex(mockHealthData.sparseDataset);
      
      // Should not have NaN or undefined values
      expect(result.overallScore).not.toBeNaN();
      expect(result.categories.every(c => !isNaN(c.score))).toBe(true);
      
      // Should have confidence level property indicating data quality
      expect(result.confidenceLevel).toBeLessThan(1);
      expect(result.confidenceLevel).toBeGreaterThan(0);
    });

    test('handles outliers with robust normalization', () => {
      const calculator = new HealthIndexCalculator();
      const result = calculator.calculateHealthIndex(mockHealthData.outlierDataset);
      
      // Score should be within valid range despite outliers
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      
      // Should flag categories with outliers
      expect(result.categories.some(c => c.hasOutliers)).toBe(true);
    });

    test('weights recent data more heavily than older data', () => {
      const calculator = new HealthIndexCalculator();
      
      // Dataset with declining trend (good → poor)
      const decliningResult = calculator.calculateHealthIndex(mockHealthData.decliningTrendDataset);
      
      // Dataset with improving trend (poor → good)
      const improvingResult = calculator.calculateHealthIndex(mockHealthData.improvingTrendDataset);
      
      // The improving trend should have a higher score due to recency bias
      expect(improvingResult.overallScore).toBeGreaterThan(decliningResult.overallScore);
    });

    test('performs calculations in under 150ms with 6+ months of data', () => {
      const calculator = new HealthIndexCalculator();
      const startTime = performance.now();
      
      calculator.calculateHealthIndex(mockHealthData.sixMonthDataset);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(150);
    });

    test('normalizes across varying user profiles', () => {
      const calculator = new HealthIndexCalculator();
      
      // Calculate for athletic user profile
      const athleticResult = calculator.calculateHealthIndex(
        mockHealthData.athleticUserDataset,
        undefined,
        { userProfile: 'athletic' }
      );
      
      // Calculate for sedentary user profile
      const sedentaryResult = calculator.calculateHealthIndex(
        mockHealthData.sedentaryUserDataset,
        undefined,
        { userProfile: 'sedentary' }
      );
      
      // Scores should be normalized to reflect relative health within profile
      expect(athleticResult.overallScore).toBeGreaterThan(50);
      expect(sedentaryResult.overallScore).toBeGreaterThan(50);
    });

    test('executes calculations in background thread to avoid UI blocking', async () => {
      // This requires testing in an actual component that uses the worker
      const { getByTestId } = render(<MockHealthDashboard data={mockHealthData.largeDataset} />);
      
      // UI should be immediately interactive
      const loadingIndicator = getByTestId('loading-indicator');
      expect(loadingIndicator).toBeInTheDocument();
      
      // Wait for calculation to complete
      await waitFor(() => {
        expect(screen.getByTestId('health-score')).toBeInTheDocument();
      });
      
      // Check worker communication
      expect(screen.getByTestId('calculation-source')).toHaveTextContent('worker');
    });
  });
});
