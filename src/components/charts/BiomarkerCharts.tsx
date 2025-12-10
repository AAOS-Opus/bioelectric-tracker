"use client";

/**
 * BiomarkerCharts Component
 *
 * Interactive multi-line trend visualization for biomarker data using Recharts.
 * Transforms raw time-series data into meaningful self-reflection insights.
 */

import { useState, useMemo, useRef, memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';

// Biomarker configuration with WCAG AA compliant colors (3:1 contrast against dark bg)
const BIOMARKER_CONFIG = {
  Energy: { color: '#fbbf24', emoji: '⚡', label: 'Energy' },        // amber-400 (brighter)
  Sleep: { color: '#818cf8', emoji: '😴', label: 'Sleep Quality' },  // indigo-400 (brighter for contrast)
  Digestion: { color: '#34d399', emoji: '🍽️', label: 'Digestion' }, // emerald-400 (brighter)
  Mood: { color: '#f472b6', emoji: '🙂', label: 'Mood' },            // pink-400 (brighter)
  Focus: { color: '#a78bfa', emoji: '🎯', label: 'Focus' },          // violet-400 (brighter for contrast)
  Hydration: { color: '#22d3ee', emoji: '💧', label: 'Hydration' },  // cyan-400 (brighter)
  Stress: { color: '#f87171', emoji: '😰', label: 'Stress Level' },  // red-400 (brighter)
  Pain: { color: '#fb923c', emoji: '🤕', label: 'Pain Level' },      // orange-400 (brighter)
};

type BiomarkerKey = keyof typeof BIOMARKER_CONFIG;

interface BiomarkerDataPoint {
  date: string;
  [key: string]: string | number;
}

interface TrendData {
  biomarker: BiomarkerKey;
  slope: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentChange: number;
  stdDev: number;
  insight: string;
}

interface InsightCard {
  type: 'improvement' | 'decline' | 'stable' | 'volatile';
  biomarker: BiomarkerKey;
  message: string;
  emoji: string;
  color: string;
}

interface BiomarkerChartsProps {
  className?: string;
  data?: BiomarkerDataPoint[];
  maxBiomarkers?: number;
  isLoading?: boolean;
}

const BiomarkerCharts = memo(function BiomarkerCharts({
  className = '',
  data = [],
  maxBiomarkers = 6,
  isLoading = false
}: BiomarkerChartsProps) {
  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
              </div>
            </div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>

          {/* Controls Skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-1">
              <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>

          {/* Pills Skeleton */}
          <div className="mb-6">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>

          {/* Chart Area Skeleton */}
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6"></div>

          {/* Insights Skeleton */}
          <div>
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // State management
  const [selectedBiomarkers, setSelectedBiomarkers] = useState<Set<BiomarkerKey>>(
    new Set(['Energy', 'Sleep', 'Mood'])
  );
  const [dateRange, setDateRange] = useState<'7d' | '30d'>('7d');
  const [showExport, setShowExport] = useState(false);

  const chartRef = useRef<HTMLDivElement>(null);

  // Generate mock data if none provided
  const mockData = useMemo(() => {
    if (data.length > 0) return data;

    const days = dateRange === '7d' ? 7 : 30;
    const mockPoints: BiomarkerDataPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const point: BiomarkerDataPoint = { date };

      Object.keys(BIOMARKER_CONFIG).forEach(biomarker => {
        // Generate realistic biomarker trends
        const baseValue = 5 + Math.sin(i * 0.3) * 2; // Gentle wave pattern
        const noise = (Math.random() - 0.5) * 2; // Random variation
        const trend = i < days / 2 ? (days - i) * 0.1 : 0; // Improvement over time

        let value = Math.round(Math.max(1, Math.min(10, baseValue + noise + trend)));

        // Biomarker-specific adjustments
        if (biomarker === 'Stress' || biomarker === 'Pain') {
          value = 11 - value; // Invert for stress/pain (lower is better)
        }

        point[biomarker] = value;
      });

      mockPoints.push(point);
    }

    return mockPoints;
  }, [data, dateRange]);

  // Filter data by date range
  const filteredData = useMemo(() => {
    const days = dateRange === '7d' ? 7 : 30;
    const cutoffDate = subDays(new Date(), days);

    return mockData.filter(point => {
      const pointDate = parseISO(point.date);
      return pointDate >= cutoffDate;
    });
  }, [mockData, dateRange]);

  // Calculate trends for selected biomarkers
  const trendAnalysis = useMemo((): TrendData[] => {
    if (filteredData.length < 2) return [];

    return Array.from(selectedBiomarkers).map(biomarker => {
      const values = filteredData
        .map(point => point[biomarker] as number)
        .filter(val => !isNaN(val));

      if (values.length < 2) {
        return {
          biomarker,
          slope: 0,
          trend: 'stable' as const,
          percentChange: 0,
          stdDev: 0,
          insight: 'Insufficient data'
        };
      }

      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      const slope = (lastValue - firstValue) / values.length;
      const percentChange = ((lastValue - firstValue) / firstValue) * 100;

      // Calculate standard deviation
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      // Determine trend
      let trend: 'increasing' | 'decreasing' | 'stable';
      if (Math.abs(percentChange) < 5) {
        trend = 'stable';
      } else {
        trend = percentChange > 0 ? 'increasing' : 'decreasing';
      }

      // Generate insight
      let insight = '';
      if (Math.abs(percentChange) >= 15) {
        insight = trend === 'increasing' ? 'Improving' : 'Declining';
      } else if (stdDev < 0.8) {
        insight = 'Stable';
      } else {
        insight = 'Fluctuating';
      }

      return {
        biomarker,
        slope,
        trend,
        percentChange,
        stdDev,
        insight
      };
    });
  }, [filteredData, selectedBiomarkers]);

  // Generate insight cards
  const insightCards = useMemo((): InsightCard[] => {
    return trendAnalysis.map(trend => {
      const config = BIOMARKER_CONFIG[trend.biomarker];
      let type: InsightCard['type'];
      let message: string;
      let color: string;

      if (Math.abs(trend.percentChange) >= 15) {
        if (trend.percentChange > 0) {
          type = 'improvement';
          message = `${config.label} improved ${Math.abs(trend.percentChange).toFixed(0)}% this period`;
          color = 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
        } else {
          type = 'decline';
          message = `${config.label} declined ${Math.abs(trend.percentChange).toFixed(0)}% this period`;
          color = 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
        }
      } else if (trend.stdDev < 0.8) {
        type = 'stable';
        message = `${config.label} stability detected (±${trend.stdDev.toFixed(1)})`;
        color = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      } else {
        type = 'volatile';
        message = `${config.label} fluctuating — consider deeper tracking`;
        color = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      }

      return {
        type,
        biomarker: trend.biomarker,
        message,
        emoji: config.emoji,
        color
      };
    });
  }, [trendAnalysis]);

  const handleBiomarkerToggle = (biomarker: BiomarkerKey) => {
    setSelectedBiomarkers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(biomarker)) {
        newSet.delete(biomarker);
      } else if (newSet.size < maxBiomarkers) {
        newSet.add(biomarker);
      }
      return newSet;
    });
  };

  const getTrendIcon = (trend: TrendData) => {
    if (Math.abs(trend.percentChange) < 5) return '➖';
    return trend.percentChange > 0 ? '🔼' : '🔽';
  };

  const getTrendColor = (trend: TrendData) => {
    if (Math.abs(trend.percentChange) < 5) return 'text-gray-500 dark:text-gray-400';
    return trend.percentChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const handleExportChart = () => {
    // Simple export functionality
    if (chartRef.current) {
      // In a real implementation, you'd use html2canvas or similar
      console.log('Exporting chart...');
      setShowExport(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
        <p className="font-medium text-gray-900 dark:text-white mb-2">
          {format(parseISO(label || ''), 'MMM dd, yyyy')}
        </p>
        {payload.map((entry, index) => {
          const biomarker = entry.dataKey as BiomarkerKey;
          const config = BIOMARKER_CONFIG[biomarker];
          const prevValue = index > 0 ? payload[index - 1].value : entry.value;
          const delta = (entry.value as number) - (prevValue as number);

          return (
            <div key={biomarker} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-sm">{config.emoji} {config.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{entry.value}</span>
                {Math.abs(delta) > 0 && (
                  <span className={`text-xs ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({delta > 0 ? '+' : ''}{delta.toFixed(1)})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📈</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Biomarker Trends
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track your wellness patterns over time
            </p>
          </div>
        </div>

        {/* Export Button */}
        <div className="relative">
          <button
            onClick={() => setShowExport(!showExport)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Export chart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          {showExport && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
              <button
                onClick={handleExportChart}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
              >
                📊 Download as Image
              </button>
              <button
                onClick={() => setShowExport(false)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
              >
                📋 Copy Data
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Date Range Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setDateRange('7d')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${dateRange === '7d'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setDateRange('30d')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${dateRange === '30d'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            30 Days
          </button>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          {selectedBiomarkers.size}/{maxBiomarkers} biomarkers selected
        </div>
      </div>

      {/* Biomarker Toggles */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Select Biomarkers
        </h4>
        <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
          {Object.entries(BIOMARKER_CONFIG).map(([key, config]) => {
            const biomarker = key as BiomarkerKey;
            const isSelected = selectedBiomarkers.has(biomarker);
            const trend = trendAnalysis.find(t => t.biomarker === biomarker);

            return (
              <button
                key={key}
                onClick={() => handleBiomarkerToggle(biomarker)}
                disabled={!isSelected && selectedBiomarkers.size >= maxBiomarkers}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${isSelected
                  ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${!isSelected && selectedBiomarkers.size >= maxBiomarkers ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => { }}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{config.emoji}</span>
                  <span>{config.label}</span>
                </div>
                {trend && isSelected && (
                  <div className={`flex items-center gap-1 ${getTrendColor(trend)}`}>
                    <span className="text-xs">{getTrendIcon(trend)}</span>
                    <span className="text-xs">
                      {Math.abs(trend.percentChange).toFixed(0)}%
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Container */}
      <div ref={chartRef} className="h-80 mb-6">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis
                domain={[1, 10]}
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {BIOMARKER_CONFIG[value as BiomarkerKey]?.emoji} {value}
                  </span>
                )}
              />
              {Array.from(selectedBiomarkers).map(biomarker => (
                <Line
                  key={biomarker}
                  type="monotone"
                  dataKey={biomarker}
                  stroke={BIOMARKER_CONFIG[biomarker].color}
                  strokeWidth={3}
                  dot={{ fill: BIOMARKER_CONFIG[biomarker].color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p>No biomarker data available</p>
              <p className="text-sm">Start tracking to see your trends</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Insight Cards */}
      {insightCards.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Your Wellness Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insightCards.map((card, index) => (
              <div
                key={`${card.biomarker}-${index}`}
                className={`p-4 rounded-lg border ${card.color}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{card.emoji}</span>
                  <div>
                    <p className="font-medium mb-1">{card.message}</p>
                    {card.type === 'volatile' && (
                      <p className="text-xs opacity-80">
                        Consider adding notes to your daily entries for deeper insights.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Touch Hint */}
      <div className="mt-4 text-center md:hidden">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Tap and hold chart points for detailed values
        </p>
      </div>
    </div>
  );
});

export default BiomarkerCharts;