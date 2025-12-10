/**
 * useInsights Hook
 *
 * React hook for generating and managing user insights
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  generateUserInsights,
  generateMockInsights,
  InsightReport,
  Insight,
  InsightEngineInput
} from '@/lib/insights';
import { getCachedInsights, getInsightCache } from '@/lib/insights-cache';

interface UseInsightsOptions {
  useMockData?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // minutes
  useCache?: boolean; // Enable caching
  forceRefresh?: boolean; // Bypass cache
}

interface UseInsightsReturn {
  insights: Insight[];
  report: InsightReport | null;
  isLoading: boolean;
  error: string | null;
  refreshInsights: () => Promise<void>;
  dismissInsight: (insight: Insight) => void;
  lastUpdated: Date | null;
}

export function useInsights(options: UseInsightsOptions = {}): UseInsightsReturn {
  const {
    useMockData = true, // Default to mock data for development
    autoRefresh = false,
    refreshInterval = 60, // 1 hour
    useCache = true, // Enable caching by default
    forceRefresh = false
  } = options;

  const { data: session } = useSession();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [report, setReport] = useState<InsightReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Use useRef to maintain stable reference for dismissed insights
  const dismissedInsightsRef = useRef<Set<string>>(new Set());
  const dismissedInsights = dismissedInsightsRef.current;

  /**
   * Fetch user data for insight generation
   */
  const fetchUserData = async (): Promise<InsightEngineInput | null> => {
    if (useMockData) {
      return null; // Will use mock data generator
    }

    try {
      // In a real implementation, fetch from multiple endpoints
      const [productUsage, modalities, progressNotes] = await Promise.all([
        fetch('/api/products/usage-history').then(res => res.json()),
        fetch('/api/modalities/sessions').then(res => res.json()),
        fetch('/api/progress/notes').then(res => res.json())
      ]);

      return {
        productUsageHistory: productUsage,
        modalitySessions: modalities,
        progressNotes: progressNotes,
        userPreferences: {
          wakeTime: '07:00',
          sleepTime: '22:30'
        }
      };
    } catch (err) {
      console.error('Failed to fetch user data for insights:', err);
      return null;
    }
  };

  /**
   * Generate insights (with caching support)
   */
  const generateInsights = useCallback(async () => {
    if (!session?.user?.email && !useMockData) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userId = session?.user?.email || 'demo-user';
      let insightReport: InsightReport;

      if (useCache && !forceRefresh) {
        // Try to get cached insights first
        insightReport = await getCachedInsights(userId, async () => {
          if (useMockData) {
            return await generateMockInsights(userId);
          } else {
            const userData = await fetchUserData();
            if (!userData) {
              throw new Error('Failed to fetch user data');
            }
            return await generateUserInsights(userId, userData);
          }
        });
      } else {
        // Generate fresh insights
        if (forceRefresh && useCache) {
          // Clear cache for this user
          getInsightCache().invalidate(userId);
        }

        if (useMockData) {
          insightReport = await generateMockInsights(userId);
        } else {
          const userData = await fetchUserData();
          if (!userData) {
            throw new Error('Failed to fetch user data');
          }
          insightReport = await generateUserInsights(userId, userData);
        }

        // Cache the fresh results
        if (useCache) {
          getInsightCache().set(userId, insightReport);
        }
      }

      // Filter out dismissed insights using stable reference
      const activeInsights = insightReport.insights.filter(insight => {
        const insightKey = `${insight.type}-${insight.title}`;
        return !dismissedInsights.has(insightKey);
      });

      setReport(insightReport);
      setInsights(activeInsights);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to generate insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.email, useMockData, useCache, forceRefresh]); // Removed dismissedInsights from deps

  /**
   * Refresh insights manually
   */
  const refreshInsights = useCallback(async () => {
    await generateInsights();
  }, [generateInsights]);

  /**
   * Dismiss an insight
   */
  const dismissInsight = useCallback((insight: Insight) => {
    const insightKey = `${insight.type}-${insight.title}`;
    dismissedInsights.add(insightKey);
    setInsights(prev => prev.filter(i => i !== insight));
  }, [dismissedInsights]);

  /**
   * Load insights on mount and when dependencies change
   */
  useEffect(() => {
    generateInsights();
  }, [generateInsights]);

  /**
   * Auto-refresh setup
   */
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      generateInsights();
    }, refreshInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, generateInsights]);

  return {
    insights,
    report,
    isLoading,
    error,
    refreshInsights,
    dismissInsight,
    lastUpdated
  };
}

/**
 * Hook for single insight type
 */
export function useInsightsByType(type: Insight['type'], options: UseInsightsOptions = {}) {
  const { insights, ...rest } = useInsights(options);

  const filteredInsights = insights.filter(insight => insight.type === type);

  return {
    insights: filteredInsights,
    ...rest
  };
}

/**
 * Hook for insight statistics
 */
export function useInsightStats(options: UseInsightsOptions = {}) {
  const { insights, report, ...rest } = useInsights(options);

  const stats = {
    total: insights.length,
    byType: insights.reduce((acc, insight) => {
      acc[insight.type] = (acc[insight.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    avgConfidence: insights.length > 0
      ? insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length
      : 0,
    totalDataPoints: insights.reduce((sum, insight) => sum + (insight.dataPoints || 0), 0),
    analysisWindow: report?.analysisWindow
  };

  return {
    insights,
    report,
    stats,
    ...rest
  };
}