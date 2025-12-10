/**
 * Comparative View Component
 * 
 * This component provides a side-by-side comparison of multiple weekly snapshots,
 * highlighting differences and trends.
 */

import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { WeeklySnapshot } from '@/utils/weeklyMetrics';
import { MicroBarChart, MicroSparklineChart } from './MicroCharts';
import './ComparativeView.css';

interface ComparativeViewProps {
  snapshots: WeeklySnapshot[];
  onClose: () => void;
}

/**
 * ComparativeView Component
 * 
 * @param props Component properties
 * @returns React component
 */
const ComparativeView: React.FC<ComparativeViewProps> = ({
  snapshots,
  onClose
}) => {
  // Sort snapshots by date (newest first)
  const sortedSnapshots = useMemo(() => {
    return [...snapshots].sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [snapshots]);
  
  // Calculate deltas between snapshots
  const deltaData = useMemo(() => {
    if (sortedSnapshots.length < 2) return null;
    
    const newest = sortedSnapshots[0];
    const oldest = sortedSnapshots[sortedSnapshots.length - 1];
    
    // Calculate percentage changes
    const calculatePercentChange = (newValue: number, oldValue: number) => {
      if (oldValue === 0) return newValue > 0 ? Infinity : 0;
      return ((newValue - oldValue) / oldValue) * 100;
    };
    
    // Calculate absolute changes
    const calculateAbsoluteChange = (newValue: number, oldValue: number) => {
      return newValue - oldValue;
    };
    
    return {
      timePeriod: {
        start: format(parseISO(oldest.startDate), 'MMM d, yyyy'),
        end: format(parseISO(newest.endDate), 'MMM d, yyyy'),
        totalWeeks: sortedSnapshots.length
      },
      productUsage: {
        adherenceRateChange: calculatePercentChange(
          newest.productUsage.adherenceRate,
          oldest.productUsage.adherenceRate
        ),
        totalProductsChange: calculateAbsoluteChange(
          newest.productUsage.totalProducts,
          oldest.productUsage.totalProducts
        ),
        streakDaysChange: calculateAbsoluteChange(
          newest.productUsage.streakDays,
          oldest.productUsage.streakDays
        )
      },
      modalitySessions: {
        adherenceRateChange: calculatePercentChange(
          newest.modalitySessions.adherenceRate,
          oldest.modalitySessions.adherenceRate
        ),
        totalSessionsChange: calculateAbsoluteChange(
          newest.modalitySessions.totalSessions,
          oldest.modalitySessions.totalSessions
        ),
        totalMinutesChange: calculateAbsoluteChange(
          newest.modalitySessions.totalMinutes,
          oldest.modalitySessions.totalMinutes
        )
      },
      wellness: {
        energyLevelChange: calculateAbsoluteChange(
          newest.wellness.energyLevel,
          oldest.wellness.energyLevel
        ),
        sleepQualityChange: calculateAbsoluteChange(
          newest.wellness.sleepQuality,
          oldest.wellness.sleepQuality
        ),
        painLevelChange: calculateAbsoluteChange(
          newest.wellness.painLevel,
          oldest.wellness.painLevel
        ),
        mentalClarityChange: calculateAbsoluteChange(
          newest.wellness.mentalClarity,
          oldest.wellness.mentalClarity
        )
      },
      healthScore: {
        overallChange: calculateAbsoluteChange(
          newest.healthScore.overall,
          oldest.healthScore.overall
        ),
        overallPercentChange: calculatePercentChange(
          newest.healthScore.overall,
          oldest.healthScore.overall
        )
      }
    };
  }, [sortedSnapshots]);
  
  // Helper to format change values with indicators
  const formatChange = (value: number, unit: string = '', invert: boolean = false) => {
    if (value === 0) {
      return <span className="text-gray-500">No change</span>;
    }
    
    // For values where lower is better (like pain), we invert the indicator
    let isPositive = invert ? value < 0 : value > 0;
    let displayValue = Math.abs(value).toFixed(1);
    
    // Handle infinity case (division by zero)
    if (!isFinite(value)) {
      return <span className="text-green-500">New metric</span>;
    }
    
    if (isPositive) {
      return <span className="text-green-500">↑ {displayValue}{unit}</span>;
    } else {
      return <span className="text-red-500">↓ {displayValue}{unit}</span>;
    }
  };
  
  // If we don't have enough snapshots, show a message
  if (sortedSnapshots.length < 2) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Comparative View</h3>
        <p className="text-gray-600 mb-4">
          At least two snapshots are required for comparison. Please select another snapshot.
        </p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    );
  }
  
  // Extract the first and last snapshots
  const newest = sortedSnapshots[0];
  const oldest = sortedSnapshots[sortedSnapshots.length - 1];
  
  // Get all snapshot dates for timeline visualization
  const allDates = sortedSnapshots.map(s => ({
    weekId: s.weekId,
    startDate: format(parseISO(s.startDate), 'MMM d'),
    endDate: format(parseISO(s.endDate), 'MMM d, yyyy')
  }));
  
  return (
    <div className="comparative-view bg-white rounded-lg shadow-lg overflow-hidden" role="region" aria-label="Weekly snapshot comparison">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-blue-50 border-b border-blue-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Comparative Analysis
          </h2>
          <p className="text-sm text-gray-600">
            {deltaData?.timePeriod.start} to {deltaData?.timePeriod.end} ({deltaData?.timePeriod.totalWeeks} weeks)
          </p>
        </div>
        <button
          className="p-2 rounded-full hover:bg-blue-100"
          onClick={onClose}
          aria-label="Close comparison view"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Timeline visualization */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-24 text-sm font-medium text-gray-500">Timeline:</div>
          <div className="relative flex-1 h-8">
            {/* Timeline track */}
            <div className="timeline-container">
              <div className="absolute inset-0 flex items-center">
                <div className="timeline-bar"></div>
              </div>
              
              {/* Timeline points */}
              {allDates.map((date, index) => {
                const isEndpoint = index === 0 || index === allDates.length - 1;
                const positionPercent = index * (100 / (allDates.length - 1));
                // Round to the nearest available position class (0, 10, 20, 25, 33, 40, 50, etc.)
                let positionClass = 'position-0';
                if (positionPercent <= 5) positionClass = 'position-0';
                else if (positionPercent <= 15) positionClass = 'position-10';
                else if (positionPercent <= 22.5) positionClass = 'position-20';
                else if (positionPercent <= 29) positionClass = 'position-25';
                else if (positionPercent <= 36.5) positionClass = 'position-33';
                else if (positionPercent <= 45) positionClass = 'position-40';
                else if (positionPercent <= 55) positionClass = 'position-50';
                else if (positionPercent <= 63) positionClass = 'position-60';
                else if (positionPercent <= 68) positionClass = 'position-66';
                else if (positionPercent <= 72.5) positionClass = 'position-70';
                else if (positionPercent <= 77.5) positionClass = 'position-75';
                else if (positionPercent <= 85) positionClass = 'position-80';
                else if (positionPercent <= 95) positionClass = 'position-90';
                else positionClass = 'position-100';
                
                return (
                  <div 
                    key={date.weekId}
                    className={`timeline-point ${positionClass}`}
                  >
                    <div className={`timeline-marker ${isEndpoint ? 'timeline-point-start' : 'timeline-point-middle'}`}></div>
                    <div className="timeline-date">
                      {date.startDate}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main comparison content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - Oldest snapshot */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Initial: {format(parseISO(oldest.startDate), 'MMM d')} - {format(parseISO(oldest.endDate), 'MMM d, yyyy')}
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white rounded p-3 shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Health Score</h4>
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-gray-900">{oldest.healthScore.overall}</div>
                  <div className="ml-3">
                    <MicroSparklineChart 
                      data={[oldest.healthScore.overall - 5, oldest.healthScore.overall - 2, oldest.healthScore.overall]} 
                      width={60} 
                      height={30} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded p-3 shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Product Usage</h4>
                <div className="flex items-center mb-2">
                  <div className="mini-progress-bar">
                    <div 
                      className={`mini-progress-fill progress-width-${Math.round(oldest.productUsage.adherenceRate / 5) * 5}`}
                    ></div>
                  </div>
                  <span className="text-lg font-medium">{oldest.productUsage.adherenceRate}%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Total Products:</span>
                    <span className="ml-1 font-medium">{oldest.productUsage.totalProducts}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Streak:</span>
                    <span className="ml-1 font-medium">{oldest.productUsage.streakDays} days</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded p-3 shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Wellness Metrics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Energy</div>
                    <div className="text-lg font-medium">{oldest.wellness.energyLevel}/10</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Sleep</div>
                    <div className="text-lg font-medium">{oldest.wellness.sleepQuality}/10</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Pain</div>
                    <div className="text-lg font-medium">{oldest.wellness.painLevel}/10</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Mental Clarity</div>
                    <div className="text-lg font-medium">{oldest.wellness.mentalClarity}/10</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Newest snapshot */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Current: {format(parseISO(newest.startDate), 'MMM d')} - {format(parseISO(newest.endDate), 'MMM d, yyyy')}
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white rounded p-3 shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Health Score</h4>
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-gray-900">{newest.healthScore.overall}</div>
                  <div className="ml-3">
                    {deltaData && formatChange(deltaData.healthScore.overallChange, ' points')}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded p-3 shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Product Usage</h4>
                <div className="flex items-center mb-2">
                  <div className="mini-progress-bar">
                    <div 
                      className={`mini-progress-fill progress-width-${Math.round(newest.productUsage.adherenceRate / 5) * 5}`}
                    ></div>
                  </div>
                  <span className="text-lg font-medium">{newest.productUsage.adherenceRate}%</span>
                  <span className="ml-2">
                    {deltaData && formatChange(deltaData.productUsage.adherenceRateChange, '%')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Total Products:</span>
                    <span className="ml-1 font-medium">{newest.productUsage.totalProducts}</span>
                    <span className="ml-1 text-xs">
                      {deltaData && formatChange(deltaData.productUsage.totalProductsChange, '')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Streak:</span>
                    <span className="ml-1 font-medium">{newest.productUsage.streakDays} days</span>
                    <span className="ml-1 text-xs">
                      {deltaData && formatChange(deltaData.productUsage.streakDaysChange, ' days')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded p-3 shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Wellness Metrics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Energy</div>
                    <div className="text-lg font-medium">{newest.wellness.energyLevel}/10</div>
                    <div className="text-xs">
                      {deltaData && formatChange(deltaData.wellness.energyLevelChange, '')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Sleep</div>
                    <div className="text-lg font-medium">{newest.wellness.sleepQuality}/10</div>
                    <div className="text-xs">
                      {deltaData && formatChange(deltaData.wellness.sleepQualityChange, '')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Pain</div>
                    <div className="text-lg font-medium">{newest.wellness.painLevel}/10</div>
                    <div className="text-xs">
                      {deltaData && formatChange(deltaData.wellness.painLevelChange, '', true)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Mental Clarity</div>
                    <div className="text-lg font-medium">{newest.wellness.mentalClarity}/10</div>
                    <div className="text-xs">
                      {deltaData && formatChange(deltaData.wellness.mentalClarityChange, '')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Summary of changes */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Summary of Changes</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Health Score Change */}
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm text-gray-500 mb-1">Health Score</div>
              <div className="flex items-center">
                <span className="text-xl font-bold">
                  {deltaData && (deltaData.healthScore.overallChange > 0 ? '+' : '')}{deltaData?.healthScore.overallChange.toFixed(1)}
                </span>
                <span className="ml-2 text-sm">
                  {deltaData && formatChange(deltaData.healthScore.overallPercentChange, '%')}
                </span>
              </div>
            </div>
            
            {/* Product Adherence */}
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm text-gray-500 mb-1">Product Adherence</div>
              <div className="flex items-center">
                <span className="text-xl font-bold">
                  {deltaData && (deltaData.productUsage.adherenceRateChange > 0 ? '+' : '')}{deltaData?.productUsage.adherenceRateChange.toFixed(1)}%
                </span>
                <span className="ml-2">
                  {deltaData && (
                    deltaData.productUsage.adherenceRateChange > 5 ? '🎯 Great improvement!' :
                    deltaData.productUsage.adherenceRateChange > 0 ? '👍 Improving' :
                    deltaData.productUsage.adherenceRateChange < 0 ? '⚠️ Declining' : '➡️ Stable'
                  )}
                </span>
              </div>
            </div>
            
            {/* Modality Sessions */}
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm text-gray-500 mb-1">Modality Sessions</div>
              <div className="flex items-center">
                <span className="text-xl font-bold">
                  {deltaData && (deltaData.modalitySessions.totalSessionsChange > 0 ? '+' : '')}{deltaData?.modalitySessions.totalSessionsChange}
                </span>
                <span className="ml-1 text-gray-500">sessions</span>
                <span className="ml-2">
                  {deltaData && (
                    deltaData.modalitySessions.totalSessionsChange > 3 ? '🔥 Great progress!' :
                    deltaData.modalitySessions.totalSessionsChange > 0 ? '👍 More active' :
                    deltaData.modalitySessions.totalSessionsChange < 0 ? '⚠️ Less active' : '➡️ Stable'
                  )}
                </span>
              </div>
            </div>
            
            {/* Overall Wellness */}
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm text-gray-500 mb-1">Wellness Trend</div>
              <div className="flex items-center">
                {deltaData && (
                  <span className="text-lg font-medium">
                    {deltaData.wellness.energyLevelChange > 0 && deltaData.wellness.sleepQualityChange > 0 ? 
                      '📈 Improving' : 
                      deltaData.wellness.energyLevelChange < 0 && deltaData.wellness.sleepQualityChange < 0 ?
                      '📉 Declining' : 
                      '↔️ Mixed results'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer with recommendations */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          {(deltaData && deltaData.productUsage && deltaData.productUsage.adherenceRateChange !== undefined && deltaData.productUsage.adherenceRateChange < 0) && (
            <li>Focus on improving product adherence to get back on track</li>
          )}
          {(deltaData && deltaData.modalitySessions && deltaData.modalitySessions.adherenceRateChange !== undefined && deltaData.modalitySessions.adherenceRateChange < 0) && (
            <li>Schedule more consistent modality sessions throughout the week</li>
          )}
          {(deltaData && deltaData.wellness && deltaData.wellness.sleepQualityChange !== undefined && deltaData.wellness.sleepQualityChange < 0) && (
            <li>Prioritize sleep quality to improve overall results</li>
          )}
          {(deltaData && deltaData.wellness && deltaData.wellness.energyLevelChange !== undefined && deltaData.wellness.energyLevelChange < 0) && (
            <li>Evaluate energy levels and consider adjusting your protocol</li>
          )}
          {(deltaData && deltaData.healthScore && deltaData.healthScore.overallChange !== undefined && deltaData.healthScore.overallChange > 5) && (
            <li>Great improvement! Continue with your current protocol</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ComparativeView;
