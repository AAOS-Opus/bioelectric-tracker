/**
 * InsightCache Module
 *
 * Provides caching functionality for insights to avoid recomputation
 * and improve performance.
 */

import { InsightReport, Insight } from './insights';

interface CachedInsight {
  report: InsightReport;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface InsightCacheOptions {
  ttl?: number; // Default TTL in milliseconds (24 hours)
  maxSize?: number; // Maximum number of cached entries
  storageKey?: string; // LocalStorage key prefix
}

export class InsightCache {
  private cache = new Map<string, CachedInsight>();
  private options: Required<InsightCacheOptions>;

  constructor(options: InsightCacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 24 * 60 * 60 * 1000, // 24 hours
      maxSize: options.maxSize || 50,
      storageKey: options.storageKey || 'insight_cache'
    };

    // Load cache from localStorage if available
    this.loadFromStorage();
  }

  /**
   * Generate cache key for a user
   */
  private getCacheKey(userId: string): string {
    const today = new Date().toISOString().split('T')[0];
    return `${userId}_${today}`;
  }

  /**
   * Check if cached insight is still valid
   */
  private isValid(cached: CachedInsight): boolean {
    const now = Date.now();
    return (now - cached.timestamp) < cached.ttl;
  }

  /**
   * Get cached insights for a user
   */
  get(userId: string): InsightReport | null {
    const key = this.getCacheKey(userId);
    const cached = this.cache.get(key);

    if (!cached || !this.isValid(cached)) {
      this.cache.delete(key);
      return null;
    }

    return cached.report;
  }

  /**
   * Cache insights for a user
   */
  set(userId: string, report: InsightReport): void {
    const key = this.getCacheKey(userId);
    const cached: CachedInsight = {
      report,
      timestamp: Date.now(),
      ttl: this.options.ttl
    };

    // Ensure cache size limit
    if (this.cache.size >= this.options.maxSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, cached);
    this.saveToStorage();
  }

  /**
   * Invalidate cache for a user
   */
  invalidate(userId: string): void {
    const key = this.getCacheKey(userId);
    this.cache.delete(key);
    this.saveToStorage();
  }

  /**
   * Clear all cached insights
   */
  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const cached of this.cache.values()) {
      if (this.isValid(cached)) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheHitRate: validEntries / Math.max(this.cache.size, 1),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage of cache
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    for (const [key, cached] of this.cache.entries()) {
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(cached).length * 2;
    }
    return size; // bytes
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.options.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();

        // Only load valid entries
        for (const [key, cached] of Object.entries(data)) {
          const cachedInsight = cached as CachedInsight;
          if ((now - cachedInsight.timestamp) < cachedInsight.ttl) {
            this.cache.set(key, cachedInsight);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load insight cache from storage:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = Object.fromEntries(this.cache.entries());
      localStorage.setItem(this.options.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save insight cache to storage:', error);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const keysToDelete: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      if (!this.isValid(cached)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      this.saveToStorage();
    }
  }
}

// Global cache instance
let globalInsightCache: InsightCache | null = null;

/**
 * Get the global insight cache instance
 */
export function getInsightCache(): InsightCache {
  if (!globalInsightCache) {
    globalInsightCache = new InsightCache({
      ttl: 12 * 60 * 60 * 1000, // 12 hours
      maxSize: 25,
      storageKey: 'wellness_insights'
    });

    // Clean up expired entries every hour
    setInterval(() => {
      globalInsightCache?.cleanup();
    }, 60 * 60 * 1000);
  }

  return globalInsightCache;
}

/**
 * Helper to get cached insights or generate new ones
 */
export async function getCachedInsights(
  userId: string,
  generateFn: () => Promise<InsightReport>
): Promise<InsightReport> {
  const cache = getInsightCache();

  // Try to get from cache first
  const cached = cache.get(userId);
  if (cached) {
    return cached;
  }

  // Generate new insights
  const report = await generateFn();

  // Cache the results
  cache.set(userId, report);

  return report;
}

/**
 * Enhanced insight prioritization with historical context
 */
export function prioritizeWithHistory(
  insights: Insight[],
  userId: string,
  historicalInsights: Insight[] = []
): Insight[] {
  // Track which insight types were shown recently
  const recentTypes = new Set(
    historicalInsights
      .filter(insight => {
        // Only consider insights from last 3 days
        const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
        return Date.now() - threeDaysAgo < 3 * 24 * 60 * 60 * 1000;
      })
      .map(insight => insight.type)
  );

  // Boost priority for new insight types
  const prioritized = insights.map(insight => ({
    ...insight,
    priority: insight.confidence * (recentTypes.has(insight.type) ? 0.7 : 1.3)
  }));

  // Sort by priority and add slight randomization
  return prioritized
    .sort((a, b) => {
      if (Math.abs(b.priority - a.priority) < 0.1) {
        return Math.random() - 0.5; // Randomize similar priorities
      }
      return b.priority - a.priority;
    })
    .map(({ priority, ...insight }) => insight); // Remove priority field
}