"use client";

/**
 * Today's Products Checklist Widget
 *
 * Interactive checklist for today's assigned products with usage logging.
 */

import { useState, memo, useMemo } from 'react';
import { ProductWithUsage, ProductUsageRequest } from '@/hooks/useProducts';
import { FetchError } from '@/lib/fetcher';
import { showToast } from '@/lib/toast';

interface TodaysProductsCardProps {
  products: ProductWithUsage[] | undefined;
  isLoading: boolean;
  error: FetchError | undefined;
  onLogUsage: (request: ProductUsageRequest) => Promise<any>;
  isLoggingUsage: boolean;
}

export const TodaysProductsCard = memo(function TodaysProductsCard({
  products,
  isLoading,
  error,
  onLogUsage,
  isLoggingUsage
}: TodaysProductsCardProps) {
  const [loggingProduct, setLoggingProduct] = useState<string | null>(null);

  const handleProductToggle = async (product: ProductWithUsage) => {
    if (isLoggingUsage || loggingProduct === product._id) return;

    setLoggingProduct(product._id);
    try {
      await onLogUsage({
        productId: product._id,
        date: new Date().toISOString().split('T')[0],
      });
      showToast.success(`${product.name} logged!`);
    } catch (error) {
      console.error('Failed to log product usage:', error);
      showToast.error('Failed to log product usage');
    } finally {
      setLoggingProduct(null);
    }
  };

  const { todaysProducts, completedProducts, totalProducts, completedCount, complianceStreak } = useMemo(() => {
    const todaysProducts = products?.filter(product => !product.usage.todayCompleted) || [];
    const completedProducts = products?.filter(product => product.usage.todayCompleted) || [];
    const totalProducts = products?.length || 0;
    const completedCount = completedProducts.length;
    const complianceStreak = completedProducts.length > 0 ? completedProducts[0].usage.streakDays : 0;

    return { todaysProducts, completedProducts, totalProducts, completedCount, complianceStreak };
  }, [products]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Protocol</h3>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm">
          Unable to load products. {error.message}
        </p>
      </div>
    );
  }



  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Protocol</h3>
        </div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {completedCount}/{totalProducts}
        </div>
      </div>

      {/* Progress Overview */}
      {totalProducts > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Progress</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {Math.round((completedCount / totalProducts) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalProducts) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="space-y-3 mb-4">
        {totalProducts === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No products assigned for today
            </p>
          </div>
        ) : (
          <>
            {/* Pending Products */}
            {todaysProducts.map((product) => (
              <div
                key={product._id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <button
                  onClick={() => handleProductToggle(product)}
                  disabled={isLoggingUsage || loggingProduct === product._id}
                  className="flex-shrink-0 w-5 h-5 rounded border border-gray-300 dark:border-gray-600 hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50"
                >
                  {loggingProduct === product._id ? (
                    <svg className="w-5 h-5 text-green-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : null}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {product.dosageInstructions} • {product.frequency}
                  </p>
                </div>
              </div>
            ))}

            {/* Completed Products */}
            {completedProducts.map((product) => (
              <div
                key={product._id}
                className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 truncate">
                    Completed today ✓
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Compliance Streak */}
      {complianceStreak > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Compliance streak
            </span>
          </div>
          <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {complianceStreak} days
          </span>
        </div>
      )}

      {/* All Complete Message */}
      {totalProducts > 0 && completedCount === totalProducts && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            🎉 All products completed for today!
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Great job staying consistent with your protocol.
          </p>
        </div>
      )}
    </div>
  );
});