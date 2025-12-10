/**
 * useProducts Hook
 *
 * Fetches product data and usage information with optimistic updates.
 * Supports product usage logging with immediate UI updates.
 */

import useSWR, { mutate as globalMutate } from 'swr';
import { fetcher, postFetcher, swrConfig, handleSWRError, FetchError } from '@/lib/fetcher';
import { useCallback, useState } from 'react';

// Product data structure with usage information
export interface ProductWithUsage {
  _id: string;
  name: string;
  category: string;
  description: string;
  dosageInstructions: string;
  frequency: string;
  phaseNumbers: number[];
  usage: {
    todayCompleted: boolean;
    weeklyCompletions: number;
    monthlyCompletions: number;
    lastCompletedDate?: string;
    streakDays: number;
  };
}

export interface ProductUsageRequest {
  productId: string;
  date?: string; // ISO date string, defaults to today
  notes?: string;
  dosage?: string;
}

export interface ProductUsageResponse {
  success: boolean;
  usage: {
    date: string;
    productId: string;
    status: 'completed';
  };
  streakDays: number;
  celebration?: {
    type: 'streak' | 'milestone';
    message: string;
    value: number;
  };
}

export interface UseProductsReturn {
  products: ProductWithUsage[] | undefined;
  isLoading: boolean;
  error: FetchError | undefined;
  mutate: (data?: any, shouldRevalidate?: boolean) => Promise<any>;
  isValidating: boolean;
  logUsage: (request: ProductUsageRequest) => Promise<ProductUsageResponse>;
  isLoggingUsage: boolean;
}

/**
 * Hook to fetch products for current phase with usage information
 */
export function useProducts(): UseProductsReturn {
  const {
    data: phaseData,
    error,
    mutate,
    isValidating,
  } = useSWR<{ assignedProducts: ProductWithUsage[] }, FetchError>(
    '/api/phases/current?include=products',
    fetcher,
    {
      ...swrConfig,
      onError: handleSWRError,
      // Refresh product data regularly for usage updates
      refreshInterval: 300000, // 5 minutes
      revalidateOnMount: true,
    }
  );

  // Extract products from nested response structure
  const products = phaseData?.assignedProducts;

  // Track usage logging state
  const [isLoggingUsage, setIsLoggingUsage] = useState(false);

  // Optimistic product usage logging
  const logUsage = useCallback(async (request: ProductUsageRequest): Promise<ProductUsageResponse> => {
    if (!products) throw new Error('Products not loaded');

    setIsLoggingUsage(true);

    try {
      // Optimistic update
      const productId = request.productId;
      const today = request.date || new Date().toISOString().split('T')[0];

      const optimisticProducts = products.map(product => {
        if (product._id === productId) {
          return {
            ...product,
            usage: {
              ...product.usage,
              todayCompleted: true,
              lastCompletedDate: today,
              streakDays: product.usage.streakDays + 1,
            }
          };
        }
        return product;
      });

      // Update local data immediately with nested structure
      mutate({ assignedProducts: optimisticProducts }, false);

      // Send API request
      const response = await postFetcher('/api/products/log-usage', request);

      // Update with real data
      mutate();

      // Also refresh related data
      globalMutate('/api/user/progress');
      globalMutate('/api/phases/current');

      return response;
    } catch (error) {
      // Revert optimistic update on error
      mutate();
      throw error;
    } finally {
      setIsLoggingUsage(false);
    }
  }, [products, mutate]);

  return {
    products,
    isLoading: !phaseData && !error,
    error,
    mutate,
    isValidating,
    logUsage,
    isLoggingUsage,
  };
}

/**
 * Hook for all products (not just current phase)
 */
export function useAllProducts() {
  const {
    data: products,
    error,
    mutate,
    isValidating,
  } = useSWR<ProductWithUsage[], FetchError>(
    '/api/products',
    fetcher,
    {
      ...swrConfig,
      onError: handleSWRError,
      refreshInterval: 600000, // 10 minutes for all products
    }
  );

  return {
    products,
    isLoading: !products && !error,
    error,
    mutate,
    isValidating,
  };
}

/**
 * Hook for a specific product
 */
export function useProduct(productId: string) {
  const {
    data: product,
    error,
    mutate,
    isValidating,
  } = useSWR<ProductWithUsage, FetchError>(
    productId ? `/api/products/${productId}` : null,
    fetcher,
    {
      ...swrConfig,
      onError: handleSWRError,
    }
  );

  return {
    product,
    isLoading: !product && !error,
    error,
    mutate,
    isValidating,
  };
}