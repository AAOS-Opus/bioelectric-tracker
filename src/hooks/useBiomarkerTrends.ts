/**
 * useBiomarkerTrends Hook
 *
 * Fetches biomarker trend data for chart visualization.
 * Integrates with the BiomarkerCharts component.
 */

import useSWR from 'swr';
import { fetcher, swrConfig, handleSWRError, FetchError } from '@/lib/fetcher';

// Biomarker data point interface
export interface BiomarkerDataPoint {
  date: string;
  Energy?: number;
  Sleep?: number;
  Digestion?: number;
  Mood?: number;
  Focus?: number;
  Hydration?: number;
  Stress?: number;
  Pain?: number;
  [key: string]: string | number | undefined;
}

export interface BiomarkerTrendsResponse {
  data: BiomarkerDataPoint[];
  totalEntries: number;
  dateRange: {
    start: string;
    end: string;
  };
  availableBiomarkers: string[];
}

export interface UseBiomarkerTrendsReturn {
  data: BiomarkerDataPoint[];
  response: BiomarkerTrendsResponse | undefined;
  isLoading: boolean;
  error: FetchError | undefined;
  mutate: (data?: any, shouldRevalidate?: boolean) => Promise<any>;
  isValidating: boolean;
}

interface UseBiomarkerTrendsOptions {
  dateRange?: '7d' | '30d' | '90d';
  biomarkers?: string[];
}

/**
 * Hook to fetch biomarker trend data
 */
export function useBiomarkerTrends(
  options: UseBiomarkerTrendsOptions = {}
): UseBiomarkerTrendsReturn {
  const { dateRange = '30d', biomarkers } = options;

  // Build query parameters
  const params = new URLSearchParams({
    range: dateRange,
    ...(biomarkers && { biomarkers: biomarkers.join(',') })
  });

  const {
    data: response,
    error,
    mutate,
    isValidating,
  } = useSWR<BiomarkerTrendsResponse, FetchError>(
    `/api/biomarkers/trends?${params.toString()}`,
    fetcher,
    {
      ...swrConfig,
      onError: handleSWRError,
      // Refresh every 5 minutes for trend data
      refreshInterval: 300000,
      revalidateOnMount: true,
    }
  );

  return {
    data: response?.data || [],
    response,
    isLoading: !response && !error,
    error,
    mutate,
    isValidating,
  };
}

/**
 * Hook for real-time biomarker data
 */
export function useLiveBiomarkerTrends(
  options: UseBiomarkerTrendsOptions = {}
): UseBiomarkerTrendsReturn {
  const result = useBiomarkerTrends(options);

  // In a real implementation, this could include WebSocket connections
  // for real-time updates, or more frequent polling

  return {
    ...result,
    // Override with more frequent refresh for live data
    mutate: result.mutate,
  };
}

/**
 * Helper function to generate mock biomarker data for testing
 */
export function generateMockBiomarkerData(days: number = 30): BiomarkerDataPoint[] {
  const data: BiomarkerDataPoint[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const point: BiomarkerDataPoint = {
      date: date.toISOString().split('T')[0],
      Energy: Math.round(5 + Math.sin(i * 0.2) * 2 + Math.random() * 2),
      Sleep: Math.round(6 + Math.cos(i * 0.15) * 1.5 + Math.random() * 1.5),
      Digestion: Math.round(5.5 + Math.sin(i * 0.25) * 2 + Math.random() * 1.5),
      Mood: Math.round(6 + Math.sin(i * 0.3) * 2.5 + Math.random() * 1.5),
      Focus: Math.round(6.5 + Math.cos(i * 0.2) * 2 + Math.random() * 1.5),
      Hydration: Math.round(7 + Math.sin(i * 0.1) * 1.5 + Math.random()),
    };

    // Ensure values stay within 1-10 range
    Object.keys(point).forEach(key => {
      if (key !== 'date' && typeof point[key] === 'number') {
        point[key] = Math.max(1, Math.min(10, point[key] as number));
      }
    });

    data.push(point);
  }

  return data;
}