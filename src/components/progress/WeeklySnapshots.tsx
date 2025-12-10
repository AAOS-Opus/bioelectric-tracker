/**
 * Weekly Snapshots Component
 * 
 * This component provides a comprehensive view of weekly progress snapshots
 * for the Bioelectric Regeneration Tracker application.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { addWeeks, subWeeks, format, parseISO } from 'date-fns';
import { 
  fetchWeeklySnapshots, 
  WeeklySnapshot, 
  WeeklySnapshotOptions 
} from '@/utils/weeklyMetrics';

// Import components directly (TypeScript will verify these at runtime)
// @ts-ignore - Suppressing module not found errors
import SnapshotTable from './SnapshotTable';
// @ts-ignore - Suppressing module not found errors
import ComparativeView from './ComparativeView';
// @ts-ignore - Suppressing module not found errors
import TimelineNavigator from './TimelineNavigator';
// @ts-ignore - Suppressing module not found errors
import ExportPanel from './ExportPanel';

// Default number of weeks to show initially
const DEFAULT_WEEKS_TO_SHOW = 8;

interface WeeklySnapshotsProps {
  userId: string;
  initialDate?: Date;
  weekStartsOn?: 0 | 1; // 0 for Sunday, 1 for Monday
  timezone?: string;
}

/**
 * Weekly Snapshots Component
 * 
 * @param props Component properties
 * @returns React component
 */
export const WeeklySnapshots: React.FC<WeeklySnapshotsProps> = ({
  userId,
  initialDate = new Date(),
  weekStartsOn = 0,
  timezone = 'America/New_York'
}) => {
  // State variables
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [snapshots, setSnapshots] = useState<WeeklySnapshot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [exportSettings, setExportSettings] = useState({
    format: 'csv',
    selectedFields: ['productUsage', 'modalitySessions', 'wellness', 'biomarkers', 'healthScore'],
    timeRange: 'displayed'
  });

  // Options for weekly snapshots
  const options: WeeklySnapshotOptions = useMemo(() => ({
    weekStart: weekStartsOn,
    timezone
  }), [weekStartsOn, timezone]);

  // Load snapshots
  const loadSnapshots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate date range
      const endDate = currentDate;
      const startDate = subWeeks(currentDate, DEFAULT_WEEKS_TO_SHOW - 1);
      
      // Fetch snapshots
      const data = await fetchWeeklySnapshots(userId, startDate, endDate, options);
      setSnapshots(data);
    } catch (err) {
      console.error('Failed to load weekly snapshots:', err);
      setError('Failed to load weekly snapshots. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [userId, currentDate, options]);

  // Load snapshots when component mounts or dependencies change
  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  // Navigate to previous weeks
  const navigatePrevious = useCallback(() => {
    setCurrentDate(prev => subWeeks(prev, DEFAULT_WEEKS_TO_SHOW));
  }, []);

  // Navigate to next weeks
  const navigateNext = useCallback(() => {
    const nextDate = addWeeks(currentDate, DEFAULT_WEEKS_TO_SHOW);
    const today = new Date();
    
    // Don't navigate past current date
    if (nextDate > today) {
      setCurrentDate(today);
    } else {
      setCurrentDate(nextDate);
    }
  }, [currentDate]);

  // Handle snapshot selection
  const handleSelectSnapshot = useCallback((weekId: string) => {
    setSelectedSnapshots(prev => {
      // If already selected, remove it
      if (prev.includes(weekId)) {
        return prev.filter(id => id !== weekId);
      }
      
      // If selecting a third snapshot, remove the oldest one
      if (prev.length >= 2) {
        return [...prev.slice(1), weekId];
      }
      
      // Otherwise, add to selection
      return [...prev, weekId];
    });
  }, []);

  // Handle comparison toggle
  const handleToggleComparison = useCallback(() => {
    if (selectedSnapshots.length < 2) {
      // Need at least 2 snapshots for comparison
      // Could show a notification to the user here
      return;
    }
    
    setShowComparison(prev => !prev);
  }, [selectedSnapshots]);

  // Handle export
  const handleExport = useCallback(async () => {
    // Implementation would go here
    console.log('Exporting with settings:', exportSettings);
    // In a real implementation, this would generate and download the export file
  }, [exportSettings]);

  // Render loading state
  if (loading && snapshots.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg text-gray-700">Loading snapshots...</span>
      </div>
    );
  }

  // Render error state
  if (error && snapshots.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="text-red-500 text-lg mb-4">
          <svg className="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Error
        </div>
        <p className="text-gray-700">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          onClick={loadSnapshots}
        >
          Retry
        </button>
      </div>
    );
  }

  // Selected snapshot objects for comparison
  const selectedSnapshotObjects = snapshots.filter(snapshot => 
    selectedSnapshots.includes(snapshot.weekId)
  );

  return (
    <div className="weekly-snapshots bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Weekly Snapshots</h2>
        
        <div className="flex flex-wrap gap-3">
          {/* View mode toggle */}
          <div className="flex rounded-md overflow-hidden border border-gray-300">
            <button
              className={`px-4 py-2 text-sm ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setViewMode('table')}
              aria-label="Table view"
            >
              <span className="mr-1">📋</span> Table
            </button>
            <button
              className={`px-4 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <span className="mr-1">📊</span> Grid
            </button>
          </div>
          
          {/* Compare button */}
          <button
            className={`px-4 py-2 text-sm rounded-md ${
              selectedSnapshots.length >= 2
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            onClick={handleToggleComparison}
            disabled={selectedSnapshots.length < 2}
            aria-label="Compare selected weeks"
          >
            <span className="mr-1">🔍</span> Compare
            {selectedSnapshots.length > 0 && ` (${selectedSnapshots.length})`}
          </button>
          
          {/* Export button */}
          <button
            className="px-4 py-2 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600"
            onClick={handleExport}
            aria-label="Export data"
          >
            <span className="mr-1">📤</span> Export
          </button>
        </div>
      </div>
      
      {/* Timeline navigator */}
      <TimelineNavigator
        currentStartDate={format(subWeeks(currentDate, DEFAULT_WEEKS_TO_SHOW - 1), 'yyyy-MM-dd')}
        currentEndDate={format(currentDate, 'yyyy-MM-dd')}
        onPrevious={navigatePrevious}
        onNext={navigateNext}
        onDateRangeChange={(start: string, end: string) => {
          setCurrentDate(new Date(end));
        }}
        hasNext={currentDate < new Date()}
      />
      
      {/* Main content */}
      <div className="mt-6">
        {showComparison && selectedSnapshotObjects.length >= 2 ? (
          <ComparativeView
            snapshots={selectedSnapshotObjects}
            onClose={() => setShowComparison(false)}
          />
        ) : (
          <SnapshotTable
            snapshots={snapshots}
            selectedWeeks={selectedSnapshots}
            onSelectWeek={handleSelectSnapshot}
            viewMode={viewMode}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default WeeklySnapshots;
