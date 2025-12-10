"use client";

import { memo, useMemo } from 'react';
import { format } from 'date-fns';
import { CurrentPhaseData } from '@/hooks/useCurrentPhase';
import { FetchError } from '@/lib/fetcher';
import { Calendar, Target, Zap, AlertCircle, Info, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CurrentPhaseCardProps {
  data: CurrentPhaseData | undefined;
  isLoading: boolean;
  error: FetchError | undefined;
}

export const CurrentPhaseCard = memo(function CurrentPhaseCard({ data, isLoading, error }: CurrentPhaseCardProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6 transition-all duration-200">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-700 rounded w-32"></div>
            <div className="h-4 bg-gray-700 rounded w-16"></div>
          </div>
          <div className="h-8 bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-full mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-24"></div>
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
          <h3 className="text-lg font-semibold text-white">Your Current Phase</h3>
        </div>
        <p className="text-red-400 text-sm">
          Unable to load phase data. {error.message}
        </p>
        <p className="text-gray-500 text-xs mt-1">
          Please check your connection and try again.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center">
            <Info className="h-4 w-4 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Your Current Phase</h3>
        </div>
        <p className="text-gray-400 text-sm">
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
    <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6 transition-all duration-200 hover:border-purple-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Target className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Your Current Phase</h3>
        </div>
        <span className="text-sm font-medium text-purple-400 bg-purple-900/30 px-2 py-1 rounded-md">
          Phase {phase.phaseNumber}
        </span>
      </div>

      {/* Phase Name */}
      <h4 className="text-2xl font-bold text-white mb-4">
        {phase.name}
      </h4>

      {/* Date Range */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Calendar className="h-4 w-4" />
        <span>
          {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Progress</span>
          <span className="text-sm font-bold text-white">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${Math.min(completionPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Remaining Days */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {remainingDays > 0 ? (
            <span>{remainingDays} days remaining</span>
          ) : remainingDays === 0 ? (
            <span className="text-amber-400 font-medium">Last day!</span>
          ) : (
            <span className="text-green-400 font-medium">Phase completed!</span>
          )}
        </div>

        {phase.affirmation && (
          <button
            className={cn(
              "text-xs font-medium px-3 py-1.5 rounded-lg transition-all",
              "text-purple-400 hover:text-purple-300 bg-purple-900/30 hover:bg-purple-900/50",
              "focus:outline-none focus:ring-2 focus:ring-purple-500"
            )}
            title={phase.affirmation}
          >
            View Affirmation
          </button>
        )}
      </div>

      {/* Phase Description */}
      {phase.description && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <p className="text-sm text-gray-400 leading-relaxed">
            {phase.description}
          </p>
        </div>
      )}

      {/* Affirmation (if exists) */}
      {phase.affirmation && (
        <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Quote className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-purple-200 italic">
              {phase.affirmation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});