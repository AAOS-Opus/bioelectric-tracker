"use client";

import { memo } from 'react';
import { UserProgressData } from '@/hooks/useUserProgress';
import { FetchError } from '@/lib/fetcher';

interface ProgressSummaryCardProps {
  data: UserProgressData | undefined;
  isLoading: boolean;
  error: FetchError | undefined;
}

export const ProgressSummaryCard = memo(function ProgressSummaryCard({ data, isLoading, error }: ProgressSummaryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Progress</h3>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm">
          Unable to load progress data. {error.message}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Progress</h3>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Progress</h3>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Compliance Rate */}
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {productCompliance?.last7Days?.percentage || 0}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            7-day compliance
          </div>
        </div>

        {/* Modality Sessions */}
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {modalityStats?.last7Days?.sessions || 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Sessions this week
          </div>
        </div>

        {/* Current Streak */}
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {streaks?.currentCompliance || 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Current streak
          </div>
        </div>

        {/* Biomarker Entries */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {biomarkerTrends?.totalEntries || 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Total entries
          </div>
        </div>
      </div>

      {/* Biomarker Trends */}
      {biomarkerTrends?.recentChanges && biomarkerTrends.recentChanges.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Biomarker Trends</h4>
          <div className="space-y-2">
            {biomarkerTrends.recentChanges.slice(0, 3).map((change, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{change.name}</span>
                <div className="flex items-center gap-1">
                  <span className={`font-medium ${
                    change.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                    change.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {change.trend === 'up' ? '↑' : change.trend === 'down' ? '↓' : '→'}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
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
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Summary</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total minutes this week</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {modalityStats.last7Days?.minutes || 0} min
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Average intensity</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {modalityStats.averageIntensity?.toFixed(1) || '0.0'}/10
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stale Data Warning */}
      {isStaleData && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Last entry: {daysSinceLastEntry} days ago
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button className="flex-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
          View Details
        </button>
        <button className="flex-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
          Add Entry
        </button>
      </div>

      {/* Achievement Badge (if any) */}
      {streaks && streaks.currentCompliance >= 7 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2 text-sm text-green-700 dark:text-green-300">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">
              Week streak achieved! 🎉
            </span>
          </div>
        </div>
      )}
    </div>
  );
});