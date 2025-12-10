/**
 * useCurrentPhase Hook
 *
 * Fetches current phase data with associated products, modalities, and progress.
 * Provides real-time updates with SWR's stale-while-revalidate strategy.
 */

import useSWR from 'swr';
import { fetcher, swrConfig, handleSWRError, FetchError } from '@/lib/fetcher';
import { Phase } from '@/types/phase';

// Extended current phase interface with associated data
export interface CurrentPhaseData {
  phase: Phase;
  assignedProducts: Array<{
    _id: string;
    name: string;
    category: string;
    description: string;
    dosageInstructions: string;
    frequency: string;
  }>;
  assignedModalities: Array<{
    _id: string;
    name: string;
    category: string;
    description: string;
    duration: number;
    intensity: number;
  }>;
  progressNotes: Array<{
    _id: string;
    content: string;
    date: string;
    emotion: string;
    tags: string[];
  }>;
  completionPercentage: number;
  remainingDays: number;
  productCompletionCount: number;
  modalitySessionCount: number;
}

export interface UseCurrentPhaseReturn {
  data: CurrentPhaseData | undefined;
  isLoading: boolean;
  error: FetchError | undefined;
  mutate: (data?: any, shouldRevalidate?: boolean) => Promise<any>;
  isValidating: boolean;
}

/**
 * Hook to fetch current phase data
 */
export function useCurrentPhase(): UseCurrentPhaseReturn {
  const {
    data,
    error,
    mutate,
    isValidating,
  } = useSWR<CurrentPhaseData, FetchError>(
    '/api/phases/current',
    fetcher,
    {
      ...swrConfig,
      onError: handleSWRError,
      // Refresh more frequently for current phase
      refreshInterval: 300000, // 5 minutes
      // Keep data fresh
      revalidateOnMount: true,
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
 * Hook variation that only returns basic phase info (lighter payload)
 */
export function useCurrentPhaseBasic() {
  const {
    data,
    error,
    mutate,
    isValidating,
  } = useSWR<Pick<CurrentPhaseData, 'phase' | 'completionPercentage' | 'remainingDays'>, FetchError>(
    '/api/phases/current?basic=true',
    fetcher,
    {
      ...swrConfig,
      onError: handleSWRError,
      refreshInterval: 600000, // 10 minutes for basic info
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