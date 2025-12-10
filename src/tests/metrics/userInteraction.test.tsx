import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetricsDashboard } from '@/components/dashboard/MetricsDashboard';
import { MetricsFilterPanel } from '@/components/metrics/MetricsFilterPanel';
import { CustomMetricWizard } from '@/components/metrics/CustomMetricWizard';
import { MetricsExportPanel } from '@/components/metrics/MetricsExportPanel';
import { AnnotationTool } from '@/components/metrics/AnnotationTool';
import { mockDashboardData } from '../mocks/dashboardDataMock';
import { act } from 'react-dom/test-utils';

// Mock localStorage for testing persistence
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('User-Driven Interactive Analytics', () => {
  
  beforeEach(() => {
    localStorageMock.clear();
  });
  
  describe('Filtering & Range Selection', () => {
    test('applies user filters to metrics data', async () => {
      const { container } = render(
        <MetricsFilterPanel 
          availableMetrics={mockDashboardData.availableMetrics}
          initialFilters={[]}
          onFilterChange={jest.fn()}
          dataTestId="filter-panel"
        />
      );
      
      // Select a metric filter
      const filterSelect = screen.getByLabelText('Select metrics to display');
      fireEvent.change(filterSelect, { target: { value: 'energy_level' } });
      
      // Apply the filter
      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);
      
      // Filter should be visible in active filters
      const activeFilters = screen.getByTestId('active-filters');
      expect(activeFilters).toHaveTextContent('Energy Level');
    });
    
    test('selects date ranges correctly', async () => {
      const mockOnRangeChange = jest.fn();
      
      const { container } = render(
        <MetricsFilterPanel 
          availableMetrics={mockDashboardData.availableMetrics}
          initialFilters={[]}
          onFilterChange={jest.fn()}
          onRangeChange={mockOnRangeChange}
          dataTestId="filter-panel"
        />
      );
      
      // Select "Last 30 days" range
      const rangeSelect = screen.getByLabelText('Select time range');
      fireEvent.change(rangeSelect, { target: { value: 'last30days' } });
      
      // Verify date range was calculated correctly
      expect(mockOnRangeChange).toHaveBeenCalled();
      
      const callArgs = mockOnRangeChange.mock.calls[0][0];
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      // Normalize dates to compare just the date portion
      const normalizeDate = (date) => {
        return new Date(date.toDateString()).getTime();
      };
      
      expect(normalizeDate(new Date(callArgs.startDate)))
        .toBeCloseTo(normalizeDate(thirtyDaysAgo), -1);
      expect(normalizeDate(new Date(callArgs.endDate)))
        .toBeCloseTo(normalizeDate(today), -1);
    });
    
    test('persists filter preferences across refreshes', async () => {
      const mockOnFilterChange = jest.fn();
      
      // Render and set filters
      const { unmount } = render(
        <MetricsFilterPanel 
          availableMetrics={mockDashboardData.availableMetrics}
          initialFilters={[]}
          onFilterChange={mockOnFilterChange}
          persistFilters={true}
          dataTestId="filter-panel"
        />
      );
      
      // Select metrics
      const filterSelect = screen.getByLabelText('Select metrics to display');
      fireEvent.change(filterSelect, { target: { value: 'sleep_quality' } });
      
      // Add second metric
      fireEvent.change(filterSelect, { target: { value: 'stress_level' } });
      
      // Apply filters
      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);
      
      // Verify localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      // Unmount component to simulate refresh
      unmount();
      
      // Render again and check if filters are restored
      render(
        <MetricsFilterPanel 
          availableMetrics={mockDashboardData.availableMetrics}
          initialFilters={[]}
          onFilterChange={mockOnFilterChange}
          persistFilters={true}
          dataTestId="filter-panel"
        />
      );
      
      // Restored filters should be visible
      const activeFilters = screen.getByTestId('active-filters');
      expect(activeFilters).toHaveTextContent('Sleep Quality');
      expect(activeFilters).toHaveTextContent('Stress Level');
    });
  });
  
  describe('Custom Metric Creation', () => {
    test('creates custom composite metrics with formula validation', async () => {
      const mockOnMetricCreate = jest.fn();
      
      render(
        <CustomMetricWizard 
          availableMetrics={mockDashboardData.availableMetrics}
          onMetricCreate={mockOnMetricCreate}
          dataTestId="metric-wizard"
        />
      );
      
      // Enter metric name
      const nameInput = screen.getByLabelText('Metric Name');
      fireEvent.change(nameInput, { target: { value: 'Recovery Score' } });
      
      // Select base metrics 
      const firstMetricSelect = screen.getByLabelText('Select first metric');
      fireEvent.change(firstMetricSelect, { target: { value: 'sleep_quality' } });
      
      const secondMetricSelect = screen.getByLabelText('Select second metric');
      fireEvent.change(secondMetricSelect, { target: { value: 'hrv_reading' } });
      
      // Set weights
      const firstWeightInput = screen.getByLabelText('Weight for Sleep Quality');
      fireEvent.change(firstWeightInput, { target: { value: '0.7' } });
      
      const secondWeightInput = screen.getByLabelText('Weight for HRV Reading');
      fireEvent.change(secondWeightInput, { target: { value: '0.3' } });
      
      // Click create button
      const createButton = screen.getByText('Create Custom Metric');
      fireEvent.click(createButton);
      
      // Verify callback was called with correct formula
      expect(mockOnMetricCreate).toHaveBeenCalledWith({
        name: 'Recovery Score',
        id: expect.any(String),
        formula: {
          type: 'weighted_average',
          components: [
            { metricId: 'sleep_quality', weight: 0.7 },
            { metricId: 'hrv_reading', weight: 0.3 }
          ]
        },
        isCustom: true
      });
    });
    
    test('validates formula inputs', async () => {
      render(
        <CustomMetricWizard 
          availableMetrics={mockDashboardData.availableMetrics}
          onMetricCreate={jest.fn()}
          dataTestId="metric-wizard"
        />
      );
      
      // Enter metric name
      const nameInput = screen.getByLabelText('Metric Name');
      fireEvent.change(nameInput, { target: { value: 'Invalid Metric' } });
      
      // Select only one metric
      const firstMetricSelect = screen.getByLabelText('Select first metric');
      fireEvent.change(firstMetricSelect, { target: { value: 'sleep_quality' } });
      
      // Set invalid weight (>1)
      const firstWeightInput = screen.getByLabelText('Weight for Sleep Quality');
      fireEvent.change(firstWeightInput, { target: { value: '1.5' } });
      
      // Click create button
      const createButton = screen.getByText('Create Custom Metric');
      fireEvent.click(createButton);
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Weight must be between 0 and 1')).toBeInTheDocument();
      });
      
      // Fix weight but keep only one metric
      fireEvent.change(firstWeightInput, { target: { value: '0.5' } });
      fireEvent.click(createButton);
      
      // Should show validation error for needing at least two metrics
      await waitFor(() => {
        expect(screen.getByText('Custom metric requires at least two components')).toBeInTheDocument();
      });
    });
  });
  
  describe('Data Export', () => {
    test('exports metrics data in CSV format', async () => {
      // Mock the global URL.createObjectURL and document.createElement
      const mockURL = { createObjectURL: jest.fn() };
      global.URL = mockURL;
      
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn(),
        remove: jest.fn()
      };
      
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn(() => mockAnchor);
      
      render(
        <MetricsExportPanel 
          metrics={mockDashboardData.metricsForExport}
          dataTestId="export-panel" 
        />
      );
      
      // Click CSV export button
      const csvButton = screen.getByText('Export as CSV');
      fireEvent.click(csvButton);
      
      // Should have created a blob URL and triggered download
      expect(mockURL.createObjectURL).toHaveBeenCalled();
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockAnchor.download).toContain('.csv');
      
      // Restore original function
      document.createElement = originalCreateElement;
    });
    
    test('exports metrics data in JSON format', async () => {
      // Mock the global URL.createObjectURL and document.createElement
      const mockURL = { createObjectURL: jest.fn() };
      global.URL = mockURL;
      
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn(),
        remove: jest.fn()
      };
      
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn(() => mockAnchor);
      
      render(
        <MetricsExportPanel 
          metrics={mockDashboardData.metricsForExport}
          dataTestId="export-panel" 
        />
      );
      
      // Click JSON export button
      const jsonButton = screen.getByText('Export as JSON');
      fireEvent.click(jsonButton);
      
      // Should have created a blob URL and triggered download
      expect(mockURL.createObjectURL).toHaveBeenCalled();
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockAnchor.download).toContain('.json');
      
      // Restore original function
      document.createElement = originalCreateElement;
    });
    
    test('exports metrics data in PDF format', async () => {
      // Mock jsPDF
      const mockJsPDF = {
        text: jest.fn(),
        addImage: jest.fn(),
        save: jest.fn()
      };
      
      jest.mock('jspdf', () => {
        return {
          jsPDF: jest.fn(() => mockJsPDF)
        };
      });
      
      render(
        <MetricsExportPanel 
          metrics={mockDashboardData.metricsForExport}
          dataTestId="export-panel" 
        />
      );
      
      // Click PDF export button
      const pdfButton = screen.getByText('Export as PDF');
      fireEvent.click(pdfButton);
      
      // Should have called jsPDF functions
      await waitFor(() => {
        expect(mockJsPDF.save).toHaveBeenCalled();
      });
    });
  });
  
  describe('Annotations & Journal Entries', () => {
    test('creates and displays annotations on trend lines', async () => {
      const mockOnAnnotationCreate = jest.fn();
      
      const { container } = render(
        <AnnotationTool
          chartData={mockDashboardData.annotatedTimeSeriesData}
          onAnnotationCreate={mockOnAnnotationCreate}
          dataTestId="annotation-tool"
        />
      );
      
      // Find a data point to annotate
      const dataPoint = container.querySelector('.data-point');
      fireEvent.click(dataPoint);
      
      // Annotation form should appear
      const annotationInput = screen.getByPlaceholderText('Add your note here...');
      fireEvent.change(annotationInput, {
        target: { value: 'Started new detox protocol' }
      });
      
      // Submit annotation
      const submitButton = screen.getByText('Save Annotation');
      fireEvent.click(submitButton);
      
      // Should call the callback with correct data
      expect(mockOnAnnotationCreate).toHaveBeenCalledWith({
        id: expect.any(String),
        date: expect.any(String),
        pointValue: expect.any(Number),
        text: 'Started new detox protocol',
        metricId: expect.any(String)
      });
      
      // Add annotation to chart data
      const annotatedData = {
        ...mockDashboardData.annotatedTimeSeriesData,
        annotations: [
          {
            id: 'ann_001',
            date: mockDashboardData.annotatedTimeSeriesData.data[5].date,
            pointValue: mockDashboardData.annotatedTimeSeriesData.data[5].value,
            text: 'Started new detox protocol',
            metricId: mockDashboardData.annotatedTimeSeriesData.id
          }
        ]
      };
      
      // Re-render with annotation
      const { rerender } = render(
        <AnnotationTool
          chartData={annotatedData}
          onAnnotationCreate={mockOnAnnotationCreate}
          dataTestId="annotation-tool"
        />
      );
      
      // Annotation marker should be visible
      const annotationMarker = container.querySelector('.annotation-marker');
      expect(annotationMarker).toBeInTheDocument();
      
      // Hover on marker to see tooltip
      fireEvent.mouseOver(annotationMarker);
      
      // Tooltip should show annotation text
      await waitFor(() => {
        const tooltip = screen.getByText('Started new detox protocol');
        expect(tooltip).toBeInTheDocument();
      });
    });
  });
  
  describe('Cross-Device Persistence', () => {
    test('drilldown state persists across page refreshes', async () => {
      // Setup initial dashboard with drill-down
      const { unmount } = render(
        <MetricsDashboard
          data={mockDashboardData.completeDataset}
          persistFilters={true}
          persistDrilldowns={true}
          dataTestId="metrics-dashboard"
        />
      );
      
      // Click to drill down on a metric
      const metricCard = screen.getByText('Sleep Quality');
      fireEvent.click(metricCard);
      
      // Drill-down view should be visible
      expect(screen.getByTestId('metric-drilldown')).toBeInTheDocument();
      
      // Check localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const storedValue = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(storedValue.activeDrilldowns).toContain('sleep_quality');
      
      // Unmount to simulate page refresh
      unmount();
      
      // Render dashboard again
      render(
        <MetricsDashboard
          data={mockDashboardData.completeDataset}
          persistFilters={true}
          persistDrilldowns={true}
          dataTestId="metrics-dashboard"
        />
      );
      
      // Drill-down should be automatically restored
      await waitFor(() => {
        expect(screen.getByTestId('metric-drilldown')).toBeInTheDocument();
        expect(screen.getByText('Sleep Quality Trends')).toBeInTheDocument();
      });
    });
  });
});
