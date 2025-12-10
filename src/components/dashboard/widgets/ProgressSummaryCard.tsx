"use client";

import { memo } from 'react';
import { UserProgressData } from '@/hooks/useUserProgress';
import { FetchError } from '@/lib/fetcher';
import { BarChart3, AlertCircle, AlertTriangle, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressSummaryCardProps {
  data: UserProgressData | undefined;
  isLoading: boolean;
  error: FetchError | undefined;
}

export const ProgressSummaryCard = memo(function ProgressSummaryCard({ data, isLoading, error }: ProgressSummaryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6 transition-all duration-200">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-gray-700 rounded-lg"></div>
            <div className="h-6 bg-gray-700 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-6 bg-gray-700 rounded w-8 mx-auto mb-1"></div>
                <div className="h-3 bg-gray-700 rounded w-16 mx-auto"></div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-700 rounded w-20"></div>
                <div className="h-4 bg-gray-700 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-red-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-red-900/50 rounded-lg flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Your Progress</h3>
        </div>
        <p className="text-red-400 text-sm">
          Unable to load progress data. {error.message}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Your Progress</h3>
        </div>
        <p className="text-gray-400 text-sm">
          No progress data available yet. Start your journey!
        </p>
      </div>
    );
  }

  const {
    productCompliance,
    modalityStats,
    biomarkerTrends,
    streaks
  } = data;

  // Calculate days since last journal entry (mock for now)
  const daysSinceLastEntry = 2; // This would come from actual data
  const isStaleData = daysSinceLastEntry > 3;

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6 transition-all duration-200 hover:border-purple-500/30">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">Your Progress</h3>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Compliance Rate */}
        <div className="text-center p-3 bg-gray-700/30 rounded-lg">
          <div className="text-2xl font-bold text-purple-400">
            {productCompliance?.last7Days?.percentage || 0}%
          </div>
          <div className="text-xs text-gray-400">
            7-day compliance
          </div>
        </div>

        {/* Modality Sessions */}
        <div className="text-center p-3 bg-gray-700/30 rounded-lg">
          <div className="text-2xl font-bold text-blue-400">
            {modalityStats?.last7Days?.sessions || 0}
          </div>
          <div className="text-xs text-gray-400">
            Sessions this week
          </div>
        </div>

        {/* Current Streak */}
        <div className="text-center p-3 bg-gray-700/30 rounded-lg">
          <div className="text-2xl font-bold text-green-400">
            {streaks?.currentCompliance || 0}
          </div>
          <div className="text-xs text-gray-400">
            Current streak
          </div>
        </div>

        {/* Biomarker Entries */}
        <div className="text-center p-3 bg-gray-700/30 rounded-lg">
          <div className="text-2xl font-bold text-amber-400">
            {biomarkerTrends?.totalEntries || 0}
          </div>
          <div className="text-xs text-gray-400">
            Total entries
          </div>
        </div>
      </div>

      {/* Biomarker Trends */}
      {biomarkerTrends?.recentChanges && biomarkerTrends.recentChanges.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Recent Biomarker Trends</h4>
          <div className="space-y-2">
            {biomarkerTrends.recentChanges.slice(0, 3).map((change, index) => (
              <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-700/20 rounded-lg">
                <span className="text-gray-400">{change.name}</span>
                <div className="flex items-center gap-2">
                  {change.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : change.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-white font-medium">
                    {change.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modality Stats */}
      {modalityStats && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Activity Summary</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm p-2 bg-gray-700/20 rounded-lg">
              <span className="text-gray-400">Total minutes this week</span>
              <span className="text-white font-medium">
                {modalityStats.last7Days?.minutes || 0} min
              </span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-gray-700/20 rounded-lg">
              <span className="text-gray-400">Average intensity</span>
              <span className="text-white font-medium">
                {modalityStats.averageIntensity?.toFixed(1) || '0.0'}/10
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stale Data Warning */}
      {isStaleData && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <p className="text-sm text-amber-200">
              Last entry: {daysSinceLastEntry} days ago
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button className={cn(
          "flex-1 text-sm font-medium px-3 py-2 rounded-lg transition-all",
          "text-purple-400 bg-purple-900/30 hover:bg-purple-900/50 hover:text-purple-300",
          "focus:outline-none focus:ring-2 focus:ring-purple-500"
        )}>
          View Details
        </button>
        <button className={cn(
          "flex-1 text-sm font-medium px-3 py-2 rounded-lg transition-all",
          "text-gray-400 bg-gray-700/50 hover:bg-gray-700 hover:text-gray-300",
          "focus:outline-none focus:ring-2 focus:ring-gray-500"
        )}>
          Add Entry
        </button>
      </div>

      {/* Achievement Badge (if any) */}
      {streaks && streaks.currentCompliance >= 7 && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg">
            <Award className="h-5 w-5 text-green-400" />
            <span className="text-sm font-medium text-green-300">
              Week streak achieved!
            </span>
          </div>
        </div>
      )}
    </div>
  );
});