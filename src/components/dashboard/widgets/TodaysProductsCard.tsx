"use client";

/**
 * Today's Products Checklist Widget
 *
 * Interactive checklist for today's assigned products with usage logging.
 * Design: Glassmorphism cards with purple gradient accents (unified with onboarding/settings).
 */

import { useState, memo, useMemo, useEffect } from 'react';
import { ProductWithUsage, ProductUsageRequest } from '@/hooks/useProducts';
import { FetchError } from '@/lib/fetcher';
import { showToast } from '@/lib/toast';
import { Check, Flame, Loader2, Package, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodaysProductsCardProps {
  products: ProductWithUsage[] | undefined;
  isLoading: boolean;
  error: FetchError | undefined;
  onLogUsage: (request: ProductUsageRequest) => Promise<any>;
  isLoggingUsage: boolean;
}

// Streak milestone thresholds for celebrations
const STREAK_MILESTONES = [7, 30, 100];

export const TodaysProductsCard = memo(function TodaysProductsCard({
  products,
  isLoading,
  error,
  onLogUsage,
  isLoggingUsage
}: TodaysProductsCardProps) {
  const [loggingProduct, setLoggingProduct] = useState<string | null>(null);
  const [showPerfectDayAnimation, setShowPerfectDayAnimation] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState<number | null>(null);

  const handleProductToggle = async (product: ProductWithUsage) => {
    if (isLoggingUsage || loggingProduct === product._id) return;

    setLoggingProduct(product._id);
    try {
      await onLogUsage({
        productId: product._id,
        date: new Date().toISOString().split('T')[0],
      });
      showToast.success(`${product.name} logged! ✅`);
    } catch (error) {
      console.error('Failed to log product usage:', error);
      showToast.error("Couldn't log product 😔");
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

  // Trigger perfect day celebration when all products completed
  useEffect(() => {
    if (totalProducts > 0 && completedCount === totalProducts && !showPerfectDayAnimation) {
      setShowPerfectDayAnimation(true);
      // Auto-hide after animation
      const timer = setTimeout(() => setShowPerfectDayAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [completedCount, totalProducts, showPerfectDayAnimation]);

  // Check for streak milestones
  useEffect(() => {
    if (complianceStreak > 0 && STREAK_MILESTONES.includes(complianceStreak)) {
      setShowStreakCelebration(complianceStreak);
      const timer = setTimeout(() => setShowStreakCelebration(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [complianceStreak]);

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6 transition-all duration-200">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-gray-700 rounded-lg"></div>
            <div className="h-6 bg-gray-700 rounded w-32"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-5 w-5 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-red-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-red-900/50 rounded-lg flex items-center justify-center">
            <Package className="h-4 w-4 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Today's Protocol</h3>
        </div>
        <p className="text-red-400 text-sm">
          Unable to load products. {error.message}
        </p>
      </div>
    );
  }



  return (
    <div className={cn(
      "relative bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-700/50 p-6 transition-all duration-200",
      showPerfectDayAnimation && "ring-2 ring-green-500/50 shadow-lg shadow-green-500/20"
    )}>
      {/* Streak Milestone Celebration */}
      {showStreakCelebration && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-amber-500/20 to-purple-600/20 animate-pulse" />
          <div className="absolute top-2 right-2 flex items-center gap-2 bg-amber-500 text-white px-3 py-1.5 rounded-full text-sm font-bold animate-bounce">
            <Sparkles className="h-4 w-4" />
            {showStreakCelebration} Day Streak!
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Check className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Today's Protocol</h3>
        </div>
        <div className="text-sm font-medium text-purple-400 bg-purple-900/30 px-2 py-1 rounded-md">
          {completedCount}/{totalProducts}
        </div>
      </div>

      {/* Progress Overview */}
      {totalProducts > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Daily Progress</span>
            <span className="text-sm font-bold text-white">
              {Math.round((completedCount / totalProducts) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalProducts) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="space-y-3 mb-4">
        {totalProducts === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-700/50 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-400 text-sm">
              No products assigned for today
            </p>
          </div>
        ) : (
          <>
            {/* Pending Products */}
            {todaysProducts.map((product) => (
              <div
                key={product._id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-700/50 hover:border-purple-500/50 hover:bg-gray-700/30 transition-all duration-200"
              >
                <button
                  onClick={() => handleProductToggle(product)}
                  disabled={isLoggingUsage || loggingProduct === product._id}
                  className={cn(
                    "flex-shrink-0 w-5 h-5 rounded border-2 border-gray-600 hover:border-purple-500 transition-colors disabled:opacity-50",
                    "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  )}
                >
                  {loggingProduct === product._id && (
                    <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {product.dosageInstructions} • {product.frequency}
                  </p>
                </div>
              </div>
            ))}

            {/* Completed Products */}
            {completedProducts.map((product) => (
              <div
                key={product._id}
                className="flex items-center gap-3 p-3 rounded-lg bg-green-900/20 border border-green-500/30"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-200 truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-green-400 truncate">
                    Completed today
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Compliance Streak */}
      {complianceStreak > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center">
              <Flame className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-300">
              Compliance streak
            </span>
          </div>
          <span className="text-lg font-bold text-amber-400">
            {complianceStreak} days
          </span>
        </div>
      )}

      {/* All Complete Message - Perfect Day Celebration */}
      {totalProducts > 0 && completedCount === totalProducts && (
        <div className={cn(
          "mt-4 p-4 rounded-lg text-center transition-all duration-500",
          showPerfectDayAnimation
            ? "bg-gradient-to-r from-purple-600/30 via-green-600/30 to-purple-600/30 border border-green-500/50"
            : "bg-green-900/20 border border-green-500/30"
        )}>
          <div className="flex items-center justify-center gap-2 mb-1">
            {showPerfectDayAnimation && <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />}
            <p className="text-sm font-medium text-green-200">
              All products completed for today!
            </p>
            {showPerfectDayAnimation && <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />}
          </div>
          <p className="text-xs text-green-400">
            Great job staying consistent with your protocol.
          </p>
        </div>
      )}
    </div>
  );
});