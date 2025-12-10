"use client";

/**
 * InsightCard Component
 *
 * Renders personalized insights with icon, title, message, and suggestion.
 * Part of the reflection ritual - showing users what they're becoming.
 */

import { useState } from 'react';
import { Insight } from '@/lib/insights';

interface InsightCardProps {
  insight: Insight;
  className?: string;
  onDismiss?: (insight: Insight) => void;
  showConfidence?: boolean;
}

export default function InsightCard({
  insight,
  className = '',
  onDismiss,
  showConfidence = false
}: InsightCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.(insight);
  };

  if (isDismissed) return null;

  // Get card styling based on insight type
  const getCardStyling = (type: Insight['type']) => {
    const styles = {
      'product-consistency': 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800',
      'energy-modality': 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800',
      'sleep-protocol': 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800',
      'mood-variability': 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800',
      'improvement-trend': 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-rose-200 dark:border-rose-800',
      'routine-drift': 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-800'
    };
    return styles[type] || styles['routine-drift'];
  };

  const getIconStyling = (type: Insight['type']) => {
    const styles = {
      'product-consistency': 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
      'energy-modality': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      'sleep-protocol': 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
      'mood-variability': 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      'improvement-trend': 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
      'routine-drift': 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300'
    };
    return styles[type] || styles['routine-drift'];
  };

  return (
    <div className={`relative rounded-xl border-2 p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${getCardStyling(insight.type)} ${className}`}>
      {/* Dismiss Button */}
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          aria-label="Dismiss insight"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Header with Icon */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-medium ${getIconStyling(insight.type)}`}>
          {insight.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {insight.title}
          </h3>
          {showConfidence && insight.confidence && (
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Confidence: {Math.round(insight.confidence * 100)}%
              </div>
              {insight.dataPoints && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  • {insight.dataPoints} data points
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {insight.message}
        </p>
      </div>

      {/* Suggestion */}
      <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Suggestion
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {insight.suggestion}
            </p>
          </div>
        </div>
      </div>

      {/* Confidence Indicator (Visual) */}
      {insight.confidence && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out"
            style={{ width: `${insight.confidence * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * InsightCards Container Component
 */
interface InsightCardsProps {
  insights: Insight[];
  className?: string;
  onDismissInsight?: (insight: Insight) => void;
  showConfidence?: boolean;
  title?: string;
}

export function InsightCards({
  insights,
  className = '',
  onDismissInsight,
  showConfidence = false,
  title = "Your Insights"
}: InsightCardsProps) {
  if (insights.length === 0) {
    return (
      <div className={`rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500 text-4xl">
          🧠
        </div>
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
          Gathering Insights
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Continue logging your progress to unlock personalized insights about your healing journey.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Personalized reflections on your wellness journey
          </p>
        </div>
      )}

      <div className="space-y-6">
        {insights.map((insight, index) => (
          <InsightCard
            key={`${insight.type}-${index}`}
            insight={insight}
            onDismiss={onDismissInsight}
            showConfidence={showConfidence}
          />
        ))}
      </div>
    </div>
  );
}