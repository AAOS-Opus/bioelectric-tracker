/**
 * Snapshot Table Component
 * 
 * This component renders a responsive table of weekly snapshots
 * with sortable columns, expandable rows, and selection capability.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { WeeklySnapshot } from '@/utils/weeklyMetrics';
import { MicroSparklineChart } from '@/components/progress/MicroCharts';
import './SnapshotTable.css';

// Define sorting options
type SortField = 'date' | 'productAdherence' | 'modalityAdherence' | 'healthScore';
type SortDirection = 'ascending' | 'descending' | 'none';

interface SnapshotTableProps {
  snapshots: WeeklySnapshot[];
  selectedWeeks: string[];
  onSelectWeek: (weekId: string) => void;
  viewMode: 'table' | 'grid';
  loading?: boolean;
}

/**
 * Snapshot Table Component
 * 
 * @param props Component properties
 * @returns React component
 */
export const SnapshotTable: React.FC<SnapshotTableProps> = ({
  snapshots,
  selectedWeeks,
  onSelectWeek,
  viewMode,
  loading = false
}) => {
  // State for sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('ascending');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // Handle sorting clicks
  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(sortDirection === 'ascending' ? 'descending' : 'ascending');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection('ascending');
    }
  };

  // Sort snapshots
  const sortedSnapshots = useMemo(() => {
    if (!snapshots.length) return [];
    
    return [...snapshots].sort((a, b) => {
      let aValue, bValue;
      
      // Determine values to compare based on sortField
      switch (sortField) {
        case 'date':
          aValue = new Date(a.startDate).getTime();
          bValue = new Date(b.startDate).getTime();
          break;
        case 'productAdherence':
          aValue = a.productUsage.adherenceRate;
          bValue = b.productUsage.adherenceRate;
          break;
        case 'modalityAdherence':
          aValue = a.modalitySessions.adherenceRate;
          bValue = b.modalitySessions.adherenceRate;
          break;
        case 'healthScore':
          aValue = a.healthScore.overall;
          bValue = b.healthScore.overall;
          break;
        default:
          aValue = new Date(a.startDate).getTime();
          bValue = new Date(b.startDate).getTime();
      }
      
      // Apply sort direction
      const modifier = sortDirection === 'ascending' ? 1 : -1;
      return (aValue > bValue ? 1 : -1) * modifier;
    });
  }, [snapshots, sortField, sortDirection]);

  // Toggle expanded row
  const toggleExpandRow = (weekId: string) => {
    setExpandedRows(prev => {
      if (prev.includes(weekId)) {
        return prev.filter(id => id !== weekId);
      } else {
        return [...prev, weekId];
      }
    });
  };

  // Reset expanded rows when snapshots change
  useEffect(() => {
    setExpandedRows([]);
  }, [snapshots]);
  
  // Render loading overlay if loading more data
  const renderLoadingOverlay = () => {
    if (!loading) return null;
    
    return (
      <div className="loading-overlay" aria-busy="true">
        <div className="flex flex-col items-center">
          <div className="spinner"></div>
          <p className="mt-2 text-gray-600">Loading snapshots...</p>
        </div>
      </div>
    );
  };

  // Function to render table header with proper aria-sort attribute
  const renderTableHeader = () => {
    // Create specific function to get appropriate aria-sort attribute for each column
    const getAriaSortValue = (field: SortField): "ascending" | "descending" | "none" | "other" => {
      if (sortField !== field) {
        return "none";
      }
      return sortDirection === 'ascending' ? "ascending" : "descending";
    };

    // Create header cell props for each column to ensure type safety
    const dateHeaderProps = {
      scope: "col" as const,
      className: "py-3 px-4 cursor-pointer",
      onClick: () => handleSortClick('date'),
      'aria-sort': getAriaSortValue('date')
    };

    const healthScoreHeaderProps = {
      scope: "col" as const,
      className: "py-3 px-4 cursor-pointer",
      onClick: () => handleSortClick('healthScore'),
      'aria-sort': getAriaSortValue('healthScore')
    };

    const productHeaderProps = {
      scope: "col" as const,
      className: "py-3 px-4 cursor-pointer",
      onClick: () => handleSortClick('productAdherence'),
      'aria-sort': getAriaSortValue('productAdherence')
    };

    const modalityHeaderProps = {
      scope: "col" as const,
      className: "py-3 px-4 cursor-pointer",
      onClick: () => handleSortClick('modalityAdherence'),
      'aria-sort': getAriaSortValue('modalityAdherence')
    };

    return (
      <thead className="bg-gray-50">
        <tr>
          <th 
            scope="col" 
            className="w-8 py-3 px-4" 
          />
          <th {...dateHeaderProps}>
            <div className="flex items-center">
              <span>Date</span>
              <div className="ml-1 flex flex-col">
                <svg 
                  className={`w-2 h-2 ${sortField === 'date' && sortDirection === 'ascending' ? 'text-blue-600' : 'text-gray-400'}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <svg 
                  className={`w-2 h-2 ${sortField === 'date' && sortDirection === 'descending' ? 'text-blue-600' : 'text-gray-400'}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </th>
          <th {...healthScoreHeaderProps}>
            <div className="flex items-center">
              <span>Health Score</span>
              <div className="ml-1 flex flex-col">
                <svg 
                  className={`w-2 h-2 ${sortField === 'healthScore' && sortDirection === 'ascending' ? 'text-blue-600' : 'text-gray-400'}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <svg 
                  className={`w-2 h-2 ${sortField === 'healthScore' && sortDirection === 'descending' ? 'text-blue-600' : 'text-gray-400'}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </th>
          <th {...productHeaderProps}>
            <div className="flex items-center">
              <span>Product Usage</span>
              <div className="ml-1 flex flex-col">
                <svg 
                  className={`w-2 h-2 ${sortField === 'productAdherence' && sortDirection === 'ascending' ? 'text-blue-600' : 'text-gray-400'}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <svg 
                  className={`w-2 h-2 ${sortField === 'productAdherence' && sortDirection === 'descending' ? 'text-blue-600' : 'text-gray-400'}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </th>
          <th {...modalityHeaderProps}>
            <div className="flex items-center">
              <span>Modality Usage</span>
              <div className="ml-1 flex flex-col">
                <svg 
                  className={`w-2 h-2 ${sortField === 'modalityAdherence' && sortDirection === 'ascending' ? 'text-blue-600' : 'text-gray-400'}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <svg 
                  className={`w-2 h-2 ${sortField === 'modalityAdherence' && sortDirection === 'descending' ? 'text-blue-600' : 'text-gray-400'}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </th>
          <th scope="col" className="py-3 px-4">Actions</th>
        </tr>
      </thead>
    );
  };

  const getProgressWidthClass = (percentage: number) => {
    // Round to nearest 5%
    const rounded = Math.round(percentage / 5) * 5;
    return `progress-width-${rounded}`;
  };

  // Render table view
  const renderTable = () => {
    if (sortedSnapshots.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No weekly snapshots available.
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto relative">
        {renderLoadingOverlay()}
        <table className="w-full text-sm text-left text-gray-700" role="table">
          {renderTableHeader()}
          <tbody>
            {sortedSnapshots.map((snapshot) => {
              const isExpanded = expandedRows.includes(snapshot.weekId);
              const isSelected = selectedWeeks.includes(snapshot.weekId);
              
              // Format dates
              const startDateFormatted = format(parseISO(snapshot.startDate), 'MMM d');
              const endDateFormatted = format(parseISO(snapshot.endDate), 'MMM d, yyyy');
              
              // Add indicator for improvement or decline
              const renderTrend = (value: number) => {
                if (value > 0) {
                  return <span className="text-green-500 ml-1">↑ {value.toFixed(1)}%</span>;
                } else if (value < 0) {
                  return <span className="text-red-500 ml-1">↓ {Math.abs(value).toFixed(1)}%</span>;
                }
                return <span className="text-gray-500 ml-1">–</span>;
              };
              
              return (
                <React.Fragment key={snapshot.weekId}>
                  {isSelected ? (
                    <tr 
                      className="border-b cursor-pointer transition bg-blue-50"
                      onClick={() => onSelectWeek(snapshot.weekId)}
                      aria-selected="true"
                    >
                      <td className="py-3 px-4">
                        {isExpanded ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandRow(snapshot.weekId);
                            }}
                            className="p-1 rounded-full hover:bg-gray-200"
                            aria-expanded="true"
                            aria-label="Collapse row"
                          >
                            <svg 
                              className="w-4 h-4 text-gray-500 transition-transform transform rotate-180" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24" 
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandRow(snapshot.weekId);
                            }}
                            className="p-1 rounded-full hover:bg-gray-200"
                            aria-expanded="false"
                            aria-label="Expand row"
                          >
                            <svg 
                              className="w-4 h-4 text-gray-500 transition-transform transform" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24" 
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        <div>{startDateFormatted} - {endDateFormatted}</div>
                        <div className="text-xs text-gray-500">{snapshot.weekId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-20 progress-bar mr-2">
                            <div 
                              className={`progress-bar-blue ${getProgressWidthClass(snapshot.productUsage.adherenceRate)}`}
                            ></div>
                          </div>
                          <span>{snapshot.productUsage.adherenceRate}%</span>
                        </div>
                        <div className="text-xs mt-1">
                          <span className="text-gray-500">Streak:</span> {snapshot.productUsage.streakDays} days
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-20 progress-bar mr-2">
                            <div 
                              className={`progress-bar-green ${getProgressWidthClass(snapshot.modalitySessions.adherenceRate)}`}
                            ></div>
                          </div>
                          <span>{snapshot.modalitySessions.adherenceRate}%</span>
                        </div>
                        <div className="flex items-center text-xs mt-1">
                          <span className="text-gray-500 mr-1">Sessions:</span> 
                          <span>{snapshot.modalitySessions.totalSessions}</span>
                          <span className="text-gray-500 mx-1">|</span>
                          <span className="text-gray-500 mr-1">Time:</span> 
                          <span>{snapshot.modalitySessions.totalMinutes} min</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="font-bold text-lg">{snapshot.healthScore.overall}</div>
                          {renderTrend(snapshot.healthScore.improvement)}
                        </div>
                        <div className="mt-1">
                          <MicroSparklineChart 
                            data={[85, 87, 82, 90, snapshot.healthScore.overall]} 
                            height={20} 
                            width={60}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Phase {snapshot.phaseNumber}: {snapshot.phaseName}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr 
                      className="border-b cursor-pointer transition hover:bg-gray-50"
                      onClick={() => onSelectWeek(snapshot.weekId)}
                      aria-selected="false"
                    >
                      <td className="py-3 px-4">
                        {isExpanded ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandRow(snapshot.weekId);
                            }}
                            className="p-1 rounded-full hover:bg-gray-200"
                            aria-expanded="true"
                            aria-label="Collapse row"
                          >
                            <svg 
                              className="w-4 h-4 text-gray-500 transition-transform transform rotate-180" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24" 
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandRow(snapshot.weekId);
                            }}
                            className="p-1 rounded-full hover:bg-gray-200"
                            aria-expanded="false"
                            aria-label="Expand row"
                          >
                            <svg 
                              className="w-4 h-4 text-gray-500 transition-transform transform" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24" 
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        <div>{startDateFormatted} - {endDateFormatted}</div>
                        <div className="text-xs text-gray-500">{snapshot.weekId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-20 progress-bar mr-2">
                            <div 
                              className={`progress-bar-blue ${getProgressWidthClass(snapshot.productUsage.adherenceRate)}`}
                            ></div>
                          </div>
                          <span>{snapshot.productUsage.adherenceRate}%</span>
                        </div>
                        <div className="text-xs mt-1">
                          <span className="text-gray-500">Streak:</span> {snapshot.productUsage.streakDays} days
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-20 progress-bar mr-2">
                            <div 
                              className={`progress-bar-green ${getProgressWidthClass(snapshot.modalitySessions.adherenceRate)}`}
                            ></div>
                          </div>
                          <span>{snapshot.modalitySessions.adherenceRate}%</span>
                        </div>
                        <div className="flex items-center text-xs mt-1">
                          <span className="text-gray-500 mr-1">Sessions:</span> 
                          <span>{snapshot.modalitySessions.totalSessions}</span>
                          <span className="text-gray-500 mx-1">|</span>
                          <span className="text-gray-500 mr-1">Time:</span> 
                          <span>{snapshot.modalitySessions.totalMinutes} min</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="font-bold text-lg">{snapshot.healthScore.overall}</div>
                          {renderTrend(snapshot.healthScore.improvement)}
                        </div>
                        <div className="mt-1">
                          <MicroSparklineChart 
                            data={[85, 87, 82, 90, snapshot.healthScore.overall]} 
                            height={20} 
                            width={60}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Phase {snapshot.phaseNumber}: {snapshot.phaseName}
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {/* Expanded row details */}
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="p-4">
                        <div className="expanded-details">
                          <div className="details-grid">
                            
                            {/* Wellness metrics */}
                            <div className="bg-white rounded-lg shadow p-4">
                              <h4 className="text-lg font-semibold mb-3">Wellness Metrics</h4>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="text-sm text-gray-500">Energy Level</div>
                                  <div className="text-lg font-medium">{snapshot.wellness.energyLevel}/10</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500">Sleep Quality</div>
                                  <div className="text-lg font-medium">{snapshot.wellness.sleepQuality}/10</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500">Pain Level</div>
                                  <div className="text-lg font-medium">{snapshot.wellness.painLevel}/10</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500">Mental Clarity</div>
                                  <div className="text-lg font-medium">{snapshot.wellness.mentalClarity}/10</div>
                                </div>
                              </div>
                              {snapshot.wellness.detoxSymptoms.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-sm text-gray-500">Detox Symptoms</div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {snapshot.wellness.detoxSymptoms.map((symptom, index) => (
                                      <span key={index} className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                        {symptom}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Product details */}
                            <div className="bg-white rounded-lg shadow p-4">
                              <h4 className="text-lg font-semibold mb-3">Product Usage</h4>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="text-sm text-gray-500">Adherence Rate</div>
                                  <div className="text-lg font-medium">{snapshot.productUsage.adherenceRate}%</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500">Total Products</div>
                                  <div className="text-lg font-medium">{snapshot.productUsage.totalProducts}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500">Missed Products</div>
                                  <div className="text-lg font-medium">{snapshot.productUsage.missedProducts}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-500">Streak Days</div>
                                  <div className="text-lg font-medium">{snapshot.productUsage.streakDays}</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Biomarkers if available */}
                            <div className="bg-white rounded-lg shadow p-4">
                              <h4 className="text-lg font-semibold mb-3">Biomarkers</h4>
                              {snapshot.biomarkers.available ? (
                                <div className="overflow-y-auto max-h-40">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th scope="col" className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Marker
                                        </th>
                                        <th scope="col" className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Value
                                        </th>
                                        <th scope="col" className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Change
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {snapshot.biomarkers.markers.map((marker, index) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                          <td className="px-3 py-1 whitespace-nowrap text-xs">
                                            <span 
                                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                marker.status === 'normal' ? 'bg-green-100 text-green-800' :
                                                marker.status === 'high' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                              }`}
                                            >
                                              {marker.name}
                                            </span>
                                          </td>
                                          <td className="px-3 py-1 whitespace-nowrap text-xs">
                                            {marker.value} {marker.unit}
                                          </td>
                                          <td className="px-3 py-1 whitespace-nowrap text-xs">
                                            {marker.change > 0 ? (
                                              <span className="text-green-500">↑ {marker.change.toFixed(1)}%</span>
                                            ) : marker.change < 0 ? (
                                              <span className="text-red-500">↓ {Math.abs(marker.change).toFixed(1)}%</span>
                                            ) : (
                                              <span className="text-gray-500">–</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 italic">
                                  No biomarker data available for this week.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Render grid view (card-based layout for mobile)
  const renderGrid = () => {
    if (sortedSnapshots.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No weekly snapshots available.
        </div>
      );
    }
    
    return (
      <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {renderLoadingOverlay()}
        {sortedSnapshots.map((snapshot) => {
          const isSelected = selectedWeeks.includes(snapshot.weekId);
          
          // Format dates
          const startDateFormatted = format(parseISO(snapshot.startDate), 'MMM d');
          const endDateFormatted = format(parseISO(snapshot.endDate), 'MMM d, yyyy');
          
          return (
            <div 
              key={snapshot.weekId}
              className={`relative bg-white border rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                isSelected ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onSelectWeek(snapshot.weekId)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{startDateFormatted} - {endDateFormatted}</h3>
                    <p className="text-xs text-gray-500">{snapshot.weekId}</p>
                  </div>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Phase {snapshot.phaseNumber}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Product Usage</p>
                    <div className="flex items-center">
                      <div className="w-20 progress-bar mr-2">
                        <div 
                          className={`progress-bar-blue ${getProgressWidthClass(snapshot.productUsage.adherenceRate)}`}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{snapshot.productUsage.adherenceRate}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Modality Sessions</p>
                    <div className="flex items-center">
                      <div className="w-20 progress-bar mr-2">
                        <div 
                          className={`progress-bar-green ${getProgressWidthClass(snapshot.modalitySessions.adherenceRate)}`}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{snapshot.modalitySessions.adherenceRate}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Health Score</p>
                    <div className="flex items-center">
                      <span className="text-xl font-bold">{snapshot.healthScore.overall}</span>
                      {snapshot.healthScore.improvement > 0 ? (
                        <span className="text-green-500 ml-1 text-sm">↑ {snapshot.healthScore.improvement.toFixed(1)}%</span>
                      ) : snapshot.healthScore.improvement < 0 ? (
                        <span className="text-red-500 ml-1 text-sm">↓ {Math.abs(snapshot.healthScore.improvement).toFixed(1)}%</span>
                      ) : (
                        <span className="text-gray-500 ml-1 text-sm">–</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <MicroSparklineChart 
                      data={[85, 87, 82, 90, snapshot.healthScore.overall]} 
                      height={30} 
                      width={80}
                    />
                  </div>
                </div>
              </div>
              
              {/* Card footer with wellness metrics */}
              <div className="bg-gray-50 px-4 py-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Energy: </span>
                  <span className="font-medium">{snapshot.wellness.energyLevel}/10</span>
                </div>
                <div>
                  <span className="text-gray-500">Sleep: </span>
                  <span className="font-medium">{snapshot.wellness.sleepQuality}/10</span>
                </div>
                <div>
                  <span className="text-gray-500">Pain: </span>
                  <span className="font-medium">{snapshot.wellness.painLevel}/10</span>
                </div>
                <div>
                  <span className="text-gray-500">Clarity: </span>
                  <span className="font-medium">{snapshot.wellness.mentalClarity}/10</span>
                </div>
              </div>
              
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 011.414-1.414L8 12.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      className="snapshot-table w-full"
      role="region" 
      aria-live="polite"
    >
      {loading ? (
        <div className="loading-overlay" aria-busy="true">
          <div className="flex flex-col items-center">
            <div className="spinner"></div>
            <p className="mt-2 text-gray-600">Loading snapshots...</p>
          </div>
        </div>
      ) : null}
      {viewMode === 'table' ? renderTable() : renderGrid()}
    </div>
  );
};

export default SnapshotTable;
