import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetricsRadarChart } from '@/components/metrics/MetricsRadarChart';
import { MetricsLineChart } from '@/components/metrics/MetricsLineChart';
import { MetricsProgressBar } from '@/components/metrics/MetricsProgressBar';
import { mockChartData } from '../mocks/chartDataMock';
import './test-styles.css'; // Import the test styles
import { act } from 'react-dom/test-utils';

// Mock for requestAnimationFrame and performance measurement
jest.useFakeTimers();
const mockRequestAnimationFrame = jest.fn(callback => {
  callback(performance.now());
  return 1;
});
window.requestAnimationFrame = mockRequestAnimationFrame;

describe('Visual Analytics Components', () => {
  
  // Reset RAF mocks between tests
  beforeEach(() => {
    mockRequestAnimationFrame.mockClear();
  });
  
  describe('Radar Chart Tests', () => {
    test('renders radar chart with correct dimensions and data points', () => {
      const { container } = render(
        <MetricsRadarChart 
          data={mockChartData.radarData} 
          width={400} 
          height={400} 
          dataTestId="radar-chart"
        />
      );
      
      const chart = screen.getByTestId('radar-chart');
      expect(chart).toBeInTheDocument();
      
      // Check correct number of axes and data points
      const axes = container.querySelectorAll('.radar-axis');
      const dataPoints = container.querySelectorAll('.radar-point');
      
      expect(axes).toHaveLength(mockChartData.radarData.dimensions.length);
      expect(dataPoints).toHaveLength(mockChartData.radarData.dimensions.length);
    });
    
    test('handles multidimensional metrics correctly', () => {
      const { container } = render(
        <MetricsRadarChart 
          data={mockChartData.complexRadarData} 
          width={400} 
          height={400} 
          showLegend={true}
        />
      );
      
      // Check for multiple series
      const series = container.querySelectorAll('.radar-series');
      expect(series.length).toBeGreaterThan(1);
      
      // Check legend items match series count
      const legendItems = container.querySelectorAll('.radar-legend-item');
      expect(legendItems.length).toBe(series.length);
    });
    
    test('provides accessible alternative representation', () => {
      render(
        <MetricsRadarChart 
          data={mockChartData.radarData} 
          width={400} 
          height={400} 
          accessibilityEnabled={true}
        />
      );
      
      // Should render a table with the same data
      const accessibleTable = screen.getByRole('table');
      expect(accessibleTable).toBeInTheDocument();
      
      // Table should have headers matching dimension names
      mockChartData.radarData.dimensions.forEach(dimension => {
        expect(screen.getByText(dimension.name)).toBeInTheDocument();
      });
    });
  });
  
  describe('Line Chart Tests', () => {
    test('renders line chart with proper data points and axes', () => {
      const { container } = render(
        <MetricsLineChart 
          data={mockChartData.lineChartData} 
          width={600} 
          height={300}
          dataTestId="line-chart"
        />
      );
      
      const chart = screen.getByTestId('line-chart');
      expect(chart).toBeInTheDocument();
      
      // Check for line path
      const path = container.querySelector('.metrics-line-path');
      expect(path).toBeInTheDocument();
      
      // Check x and y axes
      const xAxis = container.querySelector('.x-axis');
      const yAxis = container.querySelector('.y-axis');
      expect(xAxis).toBeInTheDocument();
      expect(yAxis).toBeInTheDocument();
    });
    
    test('displays confidence intervals when enabled', () => {
      const { container } = render(
        <MetricsLineChart 
          data={mockChartData.lineChartData} 
          width={600} 
          height={300}
          showConfidenceInterval={true}
        />
      );
      
      const confidenceArea = container.querySelector('.confidence-interval');
      expect(confidenceArea).toBeInTheDocument();
    });
    
    test('applies line smoothing when enabled', () => {
      const { container: containerWithoutSmoothing } = render(
        <MetricsLineChart 
          data={mockChartData.lineChartData} 
          width={600} 
          height={300}
          applySmoothing={false}
        />
      );
      
      const { container: containerWithSmoothing } = render(
        <MetricsLineChart 
          data={mockChartData.lineChartData} 
          width={600} 
          height={300}
          applySmoothing={true}
        />
      );
      
      const regularPath = containerWithoutSmoothing.querySelector('.metrics-line-path').getAttribute('d');
      const smoothedPath = containerWithSmoothing.querySelector('.metrics-line-path').getAttribute('d');
      
      // Smoothed path should be different and likely contain curve commands
      expect(regularPath).not.toBe(smoothedPath);
      expect(smoothedPath.includes('C')).toBe(true); // 'C' is for cubic bezier in SVG paths
    });
    
    test('shows tooltips with correct data on hover', async () => {
      const { container } = render(
        <MetricsLineChart 
          data={mockChartData.lineChartData} 
          width={600} 
          height={300}
          showTooltip={true}
        />
      );
      
      // Find a data point and trigger hover
      const dataPoint = container.querySelector('.data-point');
      fireEvent.mouseOver(dataPoint);
      
      // Wait for tooltip to appear
      await waitFor(() => {
        const tooltip = container.querySelector('.tooltip');
        expect(tooltip).toBeInTheDocument();
        // Tooltip should contain the value
        expect(tooltip.textContent).toContain(dataPoint.getAttribute('data-value'));
      });
      
      // Test tooltip disappearance
      fireEvent.mouseLeave(dataPoint);
      await waitFor(() => {
        const tooltip = container.querySelector('.tooltip');
        expect(tooltip).not.toBeInTheDocument();
      });
    });
    
    test('tooltip latency is under 50ms', async () => {
      jest.useFakeTimers();
      const { container } = render(
        <MetricsLineChart 
          data={mockChartData.lineChartData} 
          width={600} 
          height={300}
          showTooltip={true}
        />
      );
      
      // Find a data point
      const dataPoint = container.querySelector('.data-point');
      
      // Record timing
      const startTime = performance.now();
      fireEvent.mouseOver(dataPoint);
      
      // Fast-forward timers just enough to allow any debounced handlers to fire
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      await waitFor(() => {
        const tooltip = container.querySelector('.tooltip');
        expect(tooltip).toBeInTheDocument();
        
        const endTime = performance.now();
        const latency = endTime - startTime;
        expect(latency).toBeLessThan(50);
      });
      
      jest.useRealTimers();
    });
  });
  
  describe('Progress Bar Tests', () => {
    test('renders progress bar with correct percentage', () => {
      render(
        <MetricsProgressBar 
          value={75} 
          maxValue={100} 
          label="Health Score" 
          dataTestId="health-progress"
        />
      );
      
      const progressBar = screen.getByTestId('health-progress');
      expect(progressBar).toBeInTheDocument();
      
      const progressFill = progressBar.querySelector('.progress-fill');
      expect(progressFill).toHaveStyle('width: 75%');
      
      const label = screen.getByText('Health Score');
      expect(label).toBeInTheDocument();
    });
    
    test('displays delta compared to baseline', () => {
      render(
        <MetricsProgressBar 
          value={75} 
          maxValue={100} 
          label="Health Score" 
          baselineValue={70}
          showDelta={true}
        />
      );
      
      const delta = screen.getByText('+5');
      expect(delta).toBeInTheDocument();
      expect(delta).toHaveClass('positive-delta');
      
      // Test negative delta
      const { rerender } = render(
        <MetricsProgressBar 
          value={65} 
          maxValue={100} 
          label="Health Score" 
          baselineValue={70}
          showDelta={true}
        />
      );
      
      const negativeDelta = screen.getByText('-5');
      expect(negativeDelta).toBeInTheDocument();
      expect(negativeDelta).toHaveClass('negative-delta');
    });
    
    test('updates with live data changes', async () => {
      const { rerender } = render(
        <MetricsProgressBar 
          value={50} 
          maxValue={100} 
          label="Health Score"
          dataTestId="dynamic-progress"
        />
      );
      
      // Initial state
      let progressFill = screen.getByTestId('dynamic-progress').querySelector('.progress-fill');
      expect(progressFill).toHaveStyle('width: 50%');
      
      // Update props
      rerender(
        <MetricsProgressBar 
          value={75} 
          maxValue={100} 
          label="Health Score"
          dataTestId="dynamic-progress"
        />
      );
      
      // Check for animated transition
      await waitFor(() => {
        progressFill = screen.getByTestId('dynamic-progress').querySelector('.progress-fill');
        expect(progressFill).toHaveStyle('width: 75%');
      });
      
      // Check animation was used (requestAnimationFrame called)
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });
  });
  
  describe('Responsiveness & Accessibility', () => {
    test('charts are responsive to container size', async () => {
      const { container, rerender } = render(
        <div className="test-container-small">
          <MetricsRadarChart 
            data={mockChartData.radarData} 
            responsive={true}
            dataTestId="responsive-chart"
          />
        </div>
      );
      
      // Get initial size
      const initialChart = screen.getByTestId('responsive-chart');
      const initialWidth = initialChart.getBoundingClientRect().width;
      
      // Change container size
      rerender(
        <div className="test-container-medium">
          <MetricsRadarChart 
            data={mockChartData.radarData} 
            responsive={true}
            dataTestId="responsive-chart"
          />
        </div>
      );
      
      // Trigger resize event
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        const updatedChart = screen.getByTestId('responsive-chart');
        const newWidth = updatedChart.getBoundingClientRect().width;
        expect(newWidth).toBeGreaterThan(initialWidth);
      });
    });
    
    test('charts render correctly on different device sizes', () => {
      // Mock different viewport sizes
      const originalInnerWidth = window.innerWidth;
      const originalInnerHeight = window.innerHeight;
      
      // Test mobile size
      window.innerWidth = 375;
      window.innerHeight = 667;
      window.dispatchEvent(new Event('resize'));
      
      const { container: mobileContainer, unmount: unmountMobile } = render(
        <MetricsLineChart 
          data={mockChartData.lineChartData} 
          responsive={true}
          dataTestId="mobile-chart"
        />
      );
      
      const mobileChart = screen.getByTestId('mobile-chart');
      expect(mobileChart).toHaveClass('mobile-view');
      unmountMobile();
      
      // Test tablet size
      window.innerWidth = 768;
      window.innerHeight = 1024;
      window.dispatchEvent(new Event('resize'));
      
      const { container: tabletContainer, unmount: unmountTablet } = render(
        <MetricsLineChart 
          data={mockChartData.lineChartData} 
          responsive={true}
          dataTestId="tablet-chart"
        />
      );
      
      const tabletChart = screen.getByTestId('tablet-chart');
      expect(tabletChart).toHaveClass('tablet-view');
      unmountTablet();
      
      // Test desktop size
      window.innerWidth = 1440;
      window.innerHeight = 900;
      window.dispatchEvent(new Event('resize'));
      
      const { container: desktopContainer } = render(
        <MetricsLineChart 
          data={mockChartData.lineChartData} 
          responsive={true}
          dataTestId="desktop-chart"
        />
      );
      
      const desktopChart = screen.getByTestId('desktop-chart');
      expect(desktopChart).toHaveClass('desktop-view');
      
      // Restore original values
      window.innerWidth = originalInnerWidth;
      window.innerHeight = originalInnerHeight;
    });
    
    test('animations run at 60fps', () => {
      jest.useFakeTimers();
      const originalRAF = window.requestAnimationFrame;
      const mockRAF = jest.fn();
      window.requestAnimationFrame = mockRAF;
      
      const { container } = render(
        <MetricsProgressBar 
          value={0} 
          maxValue={100} 
          label="Animated Progress"
          animated={true}
          dataTestId="animated-progress"
        />
      );
      
      // Trigger animation
      const { rerender } = render(
        <MetricsProgressBar 
          value={100} 
          maxValue={100} 
          label="Animated Progress"
          animated={true}
          dataTestId="animated-progress"
        />
      );
      
      // Simulate 1 second of time passing with animation frames
      const frameCount = mockRAF.mock.calls.length;
      
      // For 60fps, we should have approximately 60 frames in 1000ms
      expect(frameCount).toBeGreaterThanOrEqual(60);
      
      window.requestAnimationFrame = originalRAF;
      jest.useRealTimers();
    });
  });
});
