/**
 * useUserProgress Hook
 *
 * Fetches comprehensive user progress metrics and analytics data.
 * Provides detailed dashboard metrics with retry logic and manual refresh capability.
 */

import useSWR from 'swr';
import { fetcher, swrConfig, handleSWRError, FetchError } from '@/lib/fetcher';

// User progress data structure based on /api/user/progress endpoint
export interface UserProgressData {
  user: {
    name: string;
    email: string;
    joinDate: string;
    currentPhase: number;
    complianceStreak: number;
  };
  currentPhase: {
    phaseNumber: number;
    name: string;
    startDate: string;
    endDate: string;
    completionPercentage: number;
    remainingDays: number;
  };
  productCompliance: {
    today: {
      completed: number;
      total: number;
      percentage: number;
    };
    last7Days: {
      completed: number;
      total: number;
      percentage: number;
      dailyBreakdown: Array<{
        date: string;
        completed: number;
        total: number;
      }>;
    };
    last30Days: {
      completed: number;
      total: number;
      percentage: number;
    };
  };
  modalityStats: {
    totalSessions: number;
    totalMinutes: number;
    averageIntensity: number;
    last7Days: {
      sessions: number;
      minutes: number;
      dailyBreakdown: Array<{
        date: string;
        sessions: number;
        minutes: number;
      }>;
    };
    last30Days: {
      sessions: number;
      minutes: number;
    };
  };
  biomarkerTrends: {
    totalEntries: number;
    recentChanges: Array<{
      name: string;
      value: number;
      change: number;
      trend: 'up' | 'down' | 'stable';
      date: string;
    }>;
    categoryBreakdown: Record<string, {
      count: number;
      averageValue: number;
      trend: 'up' | 'down' | 'stable';
    }>;
  };
  streaks: {
    currentCompliance: number;
    longestCompliance: number;
    currentJournal: number;
    longestJournal: number;
  };
  achievements: {
    totalUnlocked: number;
    recent: Array<{
      id: string;
      name: string;
      description: string;
      unlockedAt: string;
    }>;
  };
}

export interface UseUserProgressReturn {
  data: UserProgressData | undefined;
  isLoading: boolean;
  error: FetchError | undefined;
  mutate: (data?: any, shouldRevalidate?: boolean) => Promise<any>;
  isValidating: boolean;
  refresh: () => Promise<any>;
}

/**
 * Hook to fetch comprehensive user progress data
 */
export function useUserProgress(): UseUserProgressReturn {
  const {
    data,
    error,
    mutate,
    isValidating,
  } = useSWR<UserProgressData, FetchError>(
    '/api/user/progress',
    fetcher,
    {
      ...swrConfig,
      onError: handleSWRError,
      // Dashboard data needs frequent updates
      refreshInterval: 180000, // 3 minutes
      // Ensure fresh data on mount
      revalidateOnMount: true,
      // Retry more aggressively for important dashboard data
      errorRetryCount: 5,
      errorRetryInterval: 2000,
    }
  );

  // Manual refresh function
  const refresh = () => mutate(undefined, true);

  return {
    data,
    isLoading: !data && !error,
    error,
    mutate,
    isValidating,
    refresh,
  };
}

/**
 * Hook for specific progress metrics (lighter payload)
 */
export function useProgressMetrics() {
  const {
    data,
    error,
    mutate,
    isValidating,
  } = useSWR<Pick<UserProgressData, 'productCompliance' | 'streaks' | 'currentPhase'>, FetchError>(
    '/api/user/progress?metrics=compliance,streaks,phase',
    fetcher,
    {
      ...swrConfig,
      onError: handleSWRError,
      refreshInterval: 300000, // 5 minutes for metrics
    }
  );

  return {
    data,
    isLoading: !data && !error,
    error,
    mutate,
    isValidating,
  };
}

/**
 * Hook for biomarker trends only
 */
export function useBiomarkerTrends() {
  const {
    data,
    error,
    mutate,
    isValidating,
  } = useSWR<UserProgressData['biomarkerTrends'], FetchError>(
    '/api/biomarkers/trends',
    fetcher,
    {
      ...swrConfig,
      onError: handleSWRError,
      refreshInterval: 600000, // 10 minutes for biomarker trends
    }
  );

  return {
    data,
    isLoading: !data && !error,
    error,
    mutate,
    isValidating,
  };
}