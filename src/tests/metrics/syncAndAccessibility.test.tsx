import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetricsSync } from '@/lib/metrics/metricsSync';
import { MetricsSyncManager } from '@/components/metrics/MetricsSyncManager';
import { MetricsDashboard } from '@/components/dashboard/MetricsDashboard';
import { mockSyncData } from '../mocks/syncDataMock';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { mockDashboardData } from '../mocks/dashboardDataMock';

// Add axe accessibility matcher
expect.extend(toHaveNoViolations);

// Mock the BroadcastChannel API
class MockBroadcastChannel {
  constructor(name) {
    this.name = name;
    this.onmessage = null;
    MockBroadcastChannel.channels = MockBroadcastChannel.channels || {};
    MockBroadcastChannel.channels[name] = MockBroadcastChannel.channels[name] || [];
    MockBroadcastChannel.channels[name].push(this);
  }

  postMessage(message) {
    const channels = MockBroadcastChannel.channels[this.name] || [];
    setTimeout(() => {
      channels.forEach(channel => {
        if (channel !== this && channel.onmessage) {
          channel.onmessage({ data: message });
        }
      });
    }, 0);
  }

  close() {
    const channels = MockBroadcastChannel.channels[this.name] || [];
    const index = channels.indexOf(this);
    if (index !== -1) {
      channels.splice(index, 1);
    }
  }
}

// Mock IndexedDB
const mockIDBFactory = {
  open: jest.fn(() => ({
    result: {
      createObjectStore: jest.fn(),
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          put: jest.fn(),
          get: jest.fn(() => ({ result: mockSyncData.cachedMetrics })),
          getAll: jest.fn(() => ({ result: Object.values(mockSyncData.cachedMetrics) }))
        }))
      }))
    },
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null
  }))
};

// Setup mocks before tests
beforeAll(() => {
  // Mock BroadcastChannel
  global.BroadcastChannel = MockBroadcastChannel;
  
  // Mock IndexedDB
  global.indexedDB = mockIDBFactory;
  
  // Mock window.matchMedia for responsive tests
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  
  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
});

describe('Cross-Device Synchronization & Accessibility', () => {
  
  describe('Data Synchronization', () => {
    test('propagates data changes across devices within 200ms', async () => {
      const syncManager1 = new MetricsSync('device1');
      const syncManager2 = new MetricsSync('device2');
      
      // Setup listeners
      const mockOnSync = jest.fn();
      syncManager2.onSync(mockOnSync);
      
      // First device updates data
      const startTime = performance.now();
      await syncManager1.syncMetrics(mockSyncData.metricsToSync);
      
      // Wait for propagation
      await waitFor(() => {
        expect(mockOnSync).toHaveBeenCalled();
      });
      
      const endTime = performance.now();
      const propagationTime = endTime - startTime;
      
      // Should propagate within 200ms
      expect(propagationTime).toBeLessThan(200);
      
      // Data should match what was sent
      const syncedData = mockOnSync.mock.calls[0][0];
      expect(syncedData.metrics).toEqual(mockSyncData.metricsToSync);
      expect(syncedData.sourceDevice).toBe('device1');
    });
    
    test('caches results for offline analysis', async () => {
      const syncManager = new MetricsSync('test-device');
      
      // Simulate storing data for offline use
      await syncManager.cacheMetricsForOffline(mockSyncData.metricsToCache);
      
      // Verify data was cached
      const cachedData = await syncManager.getCachedMetrics();
      expect(cachedData).toEqual(mockSyncData.metricsToCache);
      
      // Should include timestamp
      Object.values(cachedData).forEach(metric => {
        expect(metric).toHaveProperty('cachedAt');
      });
    });
    
    test('implements optimistic UI during offline exploration', async () => {
      // Mock the sync component with online/offline capability
      const { container } = render(
        <MetricsSyncManager
          initialMetrics={mockSyncData.initialMetrics}
          isOnline={true}
          dataTestId="sync-manager"
        />
      );
      
      // Get references to UI elements
      const statusIndicator = screen.getByTestId('sync-status');
      expect(statusIndicator).toHaveTextContent('Online');
      
      // Switch to offline mode
      const { rerender } = render(
        <MetricsSyncManager
          initialMetrics={mockSyncData.initialMetrics}
          isOnline={false}
          dataTestId="sync-manager"
        />
      );
      
      // Status should update
      expect(screen.getByTestId('sync-status')).toHaveTextContent('Offline');
      
      // Add a metric while offline
      await act(async () => {
        fireEvent.click(screen.getByText('Add Test Metric'));
      });
      
      // New metric should appear in UI with "pending" indicator
      expect(screen.getByTestId('pending-sync')).toBeInTheDocument();
      
      // Go back online
      rerender(
        <MetricsSyncManager
          initialMetrics={mockSyncData.initialMetrics}
          isOnline={true}
          dataTestId="sync-manager"
        />
      );
      
      // Status should update to syncing
      expect(screen.getByTestId('sync-status')).toHaveTextContent('Syncing');
      
      // Wait for sync to complete
      await waitFor(() => {
        expect(screen.getByTestId('sync-status')).toHaveTextContent('Online');
      });
      
      // Pending indicator should be gone
      expect(screen.queryByTestId('pending-sync')).not.toBeInTheDocument();
    });
    
    test('maintains state continuity between devices', async () => {
      const syncManager1 = new MetricsSync('device1');
      const syncManager2 = new MetricsSync('device2');
      
      // Set filters on first device
      const filterState = {
        activeMetrics: ['sleep_quality', 'energy_level'],
        dateRange: {
          start: '2025-03-01',
          end: '2025-03-15'
        },
        view: 'detailed'
      };
      
      await syncManager1.syncUiState(filterState);
      
      // Get state on second device
      const mockOnStateSync = jest.fn();
      syncManager2.onUiStateChange(mockOnStateSync);
      
      // Wait for propagation
      await waitFor(() => {
        expect(mockOnStateSync).toHaveBeenCalled();
      });
      
      // State should match
      const syncedState = mockOnStateSync.mock.calls[0][0];
      expect(syncedState).toEqual(filterState);
    });
  });
  
  describe('Accessibility Testing', () => {
    test('renders with proper responsive breakpoints', async () => {
      // Mobile viewport
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 640px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
      
      const { container, unmount } = render(
        <MetricsDashboard
          data={mockDashboardData.completeDataset}
          dataTestId="mobile-dashboard"
        />
      );
      
      // Should have mobile view class
      expect(screen.getByTestId('mobile-dashboard')).toHaveClass('mobile-view');
      
      // Should use progressive disclosure pattern
      const expandableCards = container.querySelectorAll('.expandable-card');
      expect(expandableCards.length).toBeGreaterThan(0);
      
      unmount();
      
      // Tablet viewport
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(min-width: 641px) and (max-width: 1024px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
      
      const { container: tabletContainer, unmount: tabletUnmount } = render(
        <MetricsDashboard
          data={mockDashboardData.completeDataset}
          dataTestId="tablet-dashboard"
        />
      );
      
      // Should have tablet view class
      expect(screen.getByTestId('tablet-dashboard')).toHaveClass('tablet-view');
      
      // Should have simplified multidimensional views
      const simplifiedCharts = tabletContainer.querySelectorAll('.simplified-chart');
      expect(simplifiedCharts.length).toBeGreaterThan(0);
      
      tabletUnmount();
      
      // Desktop viewport
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(min-width: 1025px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
      
      render(
        <MetricsDashboard
          data={mockDashboardData.completeDataset}
          dataTestId="desktop-dashboard"
        />
      );
      
      // Should have desktop view class
      expect(screen.getByTestId('desktop-dashboard')).toHaveClass('desktop-view');
      
      // Should have full-featured dashboard
      expect(screen.getByTestId('metrics-grid')).toHaveClass('full-grid');
    });
    
    test('handles high-contrast mode correctly', async () => {
      // Simulate high-contrast mode
      const { container } = render(
        <MetricsDashboard
          data={mockDashboardData.completeDataset}
          highContrast={true}
          dataTestId="high-contrast-dashboard"
        />
      );
      
      // Should have high-contrast class
      expect(screen.getByTestId('high-contrast-dashboard')).toHaveClass('high-contrast-mode');
      
      // Charts should use high-contrast colors
      const highContrastElements = container.querySelectorAll('.high-contrast-element');
      expect(highContrastElements.length).toBeGreaterThan(0);
    });
    
    test('supports reduced motion settings', async () => {
      // Simulate prefers-reduced-motion
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
      
      const { container } = render(
        <MetricsDashboard
          data={mockDashboardData.completeDataset}
          dataTestId="reduced-motion-dashboard"
        />
      );
      
      // Should have reduced-motion class
      expect(screen.getByTestId('reduced-motion-dashboard')).toHaveClass('reduced-motion');
      
      // Animations should be disabled
      const transitionElements = container.querySelectorAll('.transition-element');
      
      // Check CSS for animations
      const hasNoAnimations = Array.from(transitionElements).every(el => {
        const style = window.getComputedStyle(el);
        return style.getPropertyValue('animation') === 'none' || 
               style.getPropertyValue('transition') === 'none';
      });
      
      expect(hasNoAnimations).toBe(true);
    });
    
    test('supports keyboard navigation across visualizations', async () => {
      const user = userEvent.setup();
      
      render(
        <MetricsDashboard
          data={mockDashboardData.completeDataset}
          dataTestId="keyboard-nav-dashboard"
        />
      );
      
      // Focus should start at the first interactive element
      const firstCard = screen.getByText('Health Index');
      expect(firstCard).toBeInTheDocument();
      
      // Tab to the first chart
      await user.tab();
      
      // Ensure focus moves as expected
      await waitFor(() => {
        expect(document.activeElement).toHaveAttribute('aria-label', expect.stringMatching(/chart/i));
      });
      
      // Continue tabbing to navigation controls
      await user.tab();
      await user.tab();
      
      const dateRangeSelector = screen.getByLabelText(/date range/i);
      expect(dateRangeSelector).toHaveFocus();
      
      // Test keyboard interaction with chart
      const chart = screen.getByTestId('main-chart');
      chart.focus();
      
      // Arrow keys should navigate data points
      await user.keyboard('{ArrowRight}');
      
      // Should highlight a data point
      await waitFor(() => {
        const highlightedPoint = screen.getByTestId('highlighted-point');
        expect(highlightedPoint).toBeInTheDocument();
      });
    });
    
    test('provides alt-text and tabular fallbacks for charts', async () => {
      const { container } = render(
        <MetricsDashboard
          data={mockDashboardData.completeDataset}
          dataTestId="a11y-dashboard"
        />
      );
      
      // Find charts
      const charts = container.querySelectorAll('[role="img"]');
      
      // Each chart should have appropriate alt text
      charts.forEach(chart => {
        expect(chart).toHaveAttribute('aria-label');
        expect(chart.getAttribute('aria-label')).not.toBe('');
      });
      
      // Charts should have tabular data available
      const tableButtons = screen.getAllByText(/view as table/i);
      expect(tableButtons.length).toBeGreaterThan(0);
      
      // Click to show table
      fireEvent.click(tableButtons[0]);
      
      // Table should appear
      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
        
        // Table should have headers and data
        const headers = screen.getAllByRole('columnheader');
        const cells = screen.getAllByRole('cell');
        
        expect(headers.length).toBeGreaterThan(0);
        expect(cells.length).toBeGreaterThan(0);
      });
    });
    
    test('passes accessibility checks with axe', async () => {
      const { container } = render(
        <MetricsDashboard
          data={mockDashboardData.completeDataset}
          dataTestId="axe-dashboard"
        />
      );
      
      // Run axe accessibility test
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
