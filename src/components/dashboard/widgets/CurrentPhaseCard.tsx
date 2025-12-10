"use client";

import { memo, useMemo } from 'react';
import { CurrentPhaseData } from '@/hooks/useCurrentPhase';
import { FetchError } from '@/lib/fetcher';

interface CurrentPhaseCardProps {
  data: CurrentPhaseData | undefined;
  isLoading: boolean;
  error: FetchError | undefined;
}

export const CurrentPhaseCard = memo(function CurrentPhaseCard({ data, isLoading, error }: CurrentPhaseCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Current Phase</h3>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm">
          Unable to load phase data. {error.message}
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
          Please check your connection and try again.
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
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Current Phase</h3>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No phase data available. Your journey is about to begin!
        </p>
      </div>
    );
  }

  const { phase, completionPercentage, remainingDays } = data;

  if (!phase?.startDate || !phase?.endDate) return null;

  const { startDate, endDate } = useMemo(() => ({
    startDate: new Date(phase.startDate),
    endDate: new Date(phase.endDate)
  }), [phase.startDate, phase.endDate]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Current Phase</h3>
        </div>
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
          Phase {phase.phaseNumber}
        </span>
      </div>

      {/* Phase Name */}
      <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {phase.name}
      </h4>

      {/* Date Range */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
        <span>
          {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2.5 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${Math.min(completionPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Remaining Days */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {remainingDays > 0 ? (
            <span>{remainingDays} days remaining</span>
          ) : remainingDays === 0 ? (
            <span className="text-orange-600 dark:text-orange-400 font-medium">Last day!</span>
          ) : (
            <span className="text-green-600 dark:text-green-400 font-medium">Phase completed!</span>
          )}
        </div>

        {phase.affirmation && (
          <button
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            title={phase.affirmation}
          >
            View Affirmation
          </button>
        )}
      </div>

      {/* Phase Description */}
      {phase.description && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {phase.description}
          </p>
        </div>
      )}

      {/* Affirmation (if exists) */}
      {phase.affirmation && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 italic text-center">
            "{phase.affirmation}"
          </p>
        </div>
      )}
    </div>
  );
});