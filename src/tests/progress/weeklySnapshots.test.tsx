/**
 * Weekly Snapshots Component Tests
 * 
 * This file contains tests for the Weekly Snapshots feature and related components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WeeklySnapshots } from '@/components/progress/WeeklySnapshots';
import { SnapshotTable } from '@/components/progress/SnapshotTable';
import { ComparativeView } from '@/components/progress/ComparativeView';
import { TimelineNavigator } from '@/components/progress/TimelineNavigator';
import { ExportPanel } from '@/components/progress/ExportPanel';
import { exportSnapshots } from '@/utils/exportUtils';
import { WeeklySnapshot } from '@/utils/weeklyMetrics';

// Mock the export utils module
jest.mock('@/utils/exportUtils', () => ({
  exportSnapshots: jest.fn(),
  downloadFile: jest.fn()
}));

// Mock API calls
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/progress',
      query: {},
      asPath: '/progress'
    };
  }
}));

// Mock data for testing
const mockSnapshots: WeeklySnapshot[] = [
  {
    weekId: 'week-2023-01',
    startDate: '2023-01-01',
    endDate: '2023-01-07',
    phaseNumber: 1,
    phaseName: 'Detoxification',
    productUsage: {
      adherenceRate: 95,
      totalProducts: 42,
      missedProducts: 2,
      streakDays: 7
    },
    modalitySessions: {
      adherenceRate: 100,
      totalSessions: 14,
      totalMinutes: 420,
      completedModalities: {
        'Spooky Scalar': 7,
        'MWO': 7
      }
    },
    wellness: {
      energyLevel: 7,
      sleepQuality: 8,
      painLevel: 3,
      mentalClarity: 7,
      symptomSeverity: 4
    },
    biomarkers: {
      available: true,
      data: {
        'Liver Enzymes (ALT)': { value: 25, unit: 'U/L', status: 'normal' },
        'Liver Enzymes (AST)': { value: 22, unit: 'U/L', status: 'normal' },
        'CRP': { value: 2.1, unit: 'mg/L', status: 'elevated' }
      }
    },
    healthScore: {
      overall: 78,
      improvement: 5
    }
  },
  {
    weekId: 'week-2023-02',
    startDate: '2023-01-08',
    endDate: '2023-01-14',
    phaseNumber: 1,
    phaseName: 'Detoxification',
    productUsage: {
      adherenceRate: 97,
      totalProducts: 42,
      missedProducts: 1,
      streakDays: 7
    },
    modalitySessions: {
      adherenceRate: 100,
      totalSessions: 14,
      totalMinutes: 420,
      completedModalities: {
        'Spooky Scalar': 7,
        'MWO': 7
      }
    },
    wellness: {
      energyLevel: 8,
      sleepQuality: 8,
      painLevel: 2,
      mentalClarity: 8,
      symptomSeverity: 3
    },
    biomarkers: {
      available: false,
      data: {}
    },
    healthScore: {
      overall: 82,
      improvement: 4
    }
  }
];

describe('Weekly Snapshots Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WeeklySnapshots Component', () => {
    it('renders the main component correctly', () => {
      render(<WeeklySnapshots />);
      expect(screen.getByText(/Weekly Progress Snapshots/i)).toBeInTheDocument();
    });

    it('displays loading state while fetching snapshots', () => {
      // Mock the fetch to be slow
      jest.spyOn(global, 'fetch').mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          json: () => Promise.resolve({ snapshots: mockSnapshots })
        } as Response), 100))
      );

      render(<WeeklySnapshots />);
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('displays error message when fetching fails', async () => {
      // Mock fetch failure
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Failed to fetch'));

      render(<WeeklySnapshots />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error loading snapshots/i)).toBeInTheDocument();
      });
    });
  });

  describe('SnapshotTable Component', () => {
    it('renders table with correct headers', () => {
      render(<SnapshotTable snapshots={mockSnapshots} onSelectSnapshot={jest.fn()} />);
      
      expect(screen.getByText(/Week/i)).toBeInTheDocument();
      expect(screen.getByText(/Product Adherence/i)).toBeInTheDocument();
      expect(screen.getByText(/Modality Sessions/i)).toBeInTheDocument();
      expect(screen.getByText(/Health Score/i)).toBeInTheDocument();
    });

    it('handles sorting by column', () => {
      render(<SnapshotTable snapshots={mockSnapshots} onSelectSnapshot={jest.fn()} />);
      
      const healthScoreHeader = screen.getByText(/Health Score/i);
      fireEvent.click(healthScoreHeader);
      
      // Verify sort indicator appears
      const sortIcon = screen.getByTestId('sort-icon-healthScore');
      expect(sortIcon).toBeInTheDocument();
    });

    it('calls onSelectSnapshot when a row is clicked', () => {
      const mockSelectFn = jest.fn();
      render(<SnapshotTable snapshots={mockSnapshots} onSelectSnapshot={mockSelectFn} />);
      
      // Click on the first row
      const firstRow = screen.getByText('week-2023-01').closest('tr');
      fireEvent.click(firstRow!);
      
      expect(mockSelectFn).toHaveBeenCalledWith(mockSnapshots[0]);
    });
  });

  describe('ComparativeView Component', () => {
    it('renders correctly with selected snapshots', () => {
      render(
        <ComparativeView 
          snapshots={[mockSnapshots[0], mockSnapshots[1]]} 
          onClose={jest.fn()} 
        />
      );
      
      expect(screen.getByText(/Comparing 2 Weeks/i)).toBeInTheDocument();
      expect(screen.getByText(/week-2023-01/i)).toBeInTheDocument();
      expect(screen.getByText(/week-2023-02/i)).toBeInTheDocument();
    });

    it('shows metrics change indicators', () => {
      render(
        <ComparativeView 
          snapshots={[mockSnapshots[0], mockSnapshots[1]]} 
          onClose={jest.fn()} 
        />
      );
      
      // Health score improved from 78 to 82
      expect(screen.getByTestId('health-score-change')).toHaveTextContent(/\+4%/i);
    });

    it('calls onClose when close button is clicked', () => {
      const mockCloseFn = jest.fn();
      render(
        <ComparativeView 
          snapshots={[mockSnapshots[0], mockSnapshots[1]]} 
          onClose={mockCloseFn} 
        />
      );
      
      const closeButton = screen.getByLabelText(/Close comparative view/i);
      fireEvent.click(closeButton);
      
      expect(mockCloseFn).toHaveBeenCalled();
    });
  });

  describe('TimelineNavigator Component', () => {
    it('renders with correct date range', () => {
      render(
        <TimelineNavigator 
          currentStartDate="2023-01-01"
          currentEndDate="2023-01-14"
          onPrevious={jest.fn()}
          onNext={jest.fn()}
          onDateRangeChange={jest.fn()}
          hasNext={false}
        />
      );
      
      expect(screen.getByText(/Jan 1, 2023 - Jan 14, 2023/i)).toBeInTheDocument();
    });

    it('calls onPrevious when previous button is clicked', () => {
      const mockPrevFn = jest.fn();
      render(
        <TimelineNavigator 
          currentStartDate="2023-01-01"
          currentEndDate="2023-01-14"
          onPrevious={mockPrevFn}
          onNext={jest.fn()}
          onDateRangeChange={jest.fn()}
          hasNext={false}
        />
      );
      
      const prevButton = screen.getByLabelText(/Previous time period/i);
      fireEvent.click(prevButton);
      
      expect(mockPrevFn).toHaveBeenCalled();
    });

    it('disables next button when hasNext is false', () => {
      render(
        <TimelineNavigator 
          currentStartDate="2023-01-01"
          currentEndDate="2023-01-14"
          onPrevious={jest.fn()}
          onNext={jest.fn()}
          onDateRangeChange={jest.fn()}
          hasNext={false}
        />
      );
      
      const nextButton = screen.getByLabelText(/Next time period/i);
      expect(nextButton).toBeDisabled();
    });

    it('opens date picker when date range is clicked', () => {
      render(
        <TimelineNavigator 
          currentStartDate="2023-01-01"
          currentEndDate="2023-01-14"
          onPrevious={jest.fn()}
          onNext={jest.fn()}
          onDateRangeChange={jest.fn()}
          hasNext={false}
        />
      );
      
      const dateRangeButton = screen.getByText(/Jan 1, 2023 - Jan 14, 2023/i);
      fireEvent.click(dateRangeButton);
      
      expect(screen.getByText(/Select Date Range/i)).toBeInTheDocument();
    });
  });

  describe('ExportPanel Component', () => {
    it('renders with default export options', () => {
      render(
        <ExportPanel 
          snapshots={mockSnapshots}
          onClose={jest.fn()}
          onExport={jest.fn()}
        />
      );
      
      expect(screen.getByText(/Export Weekly Snapshots/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/CSV/i)).toBeChecked();
      expect(screen.getByText(/Currently Displayed \(2 weeks\)/i)).toBeInTheDocument();
    });

    it('updates options when user changes selections', () => {
      render(
        <ExportPanel 
          snapshots={mockSnapshots}
          onClose={jest.fn()}
          onExport={jest.fn()}
        />
      );
      
      // Change format to PDF
      const pdfOption = screen.getByLabelText(/PDF/i);
      fireEvent.click(pdfOption);
      
      // PDF-specific options should appear
      expect(screen.getByText(/Include Charts/i)).toBeInTheDocument();
    });

    it('calls onExport with correct options when export button is clicked', () => {
      const mockExportFn = jest.fn();
      render(
        <ExportPanel 
          snapshots={mockSnapshots}
          onClose={jest.fn()}
          onExport={mockExportFn}
        />
      );
      
      // Click export button
      const exportButton = screen.getByText(/Export$/i);
      fireEvent.click(exportButton);
      
      expect(mockExportFn).toHaveBeenCalledWith('csv', expect.objectContaining({
        timeRange: 'displayed',
        exportFormat: 'csv'
      }));
    });
  });

  describe('Export Utilities', () => {
    it('calls exportSnapshots with correct parameters', async () => {
      const mockOptions = {
        timeRange: 'displayed',
        includeFields: {
          productUsage: true,
          modalitySessions: true,
          wellness: true,
          biomarkers: true,
          healthScore: true
        },
        exportFormat: 'csv',
        includeCharts: false,
        fileName: 'test-export'
      };
      
      await exportSnapshots(mockSnapshots, mockOptions as any);
      
      expect(exportSnapshots).toHaveBeenCalledWith(mockSnapshots, mockOptions);
    });
  });
});
