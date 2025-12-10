"use client";

/**
 * ProductTracker Component
 *
 * Interactive product tracking interface with time-based grouping,
 * quick notes, celebration animations, and compliance tracking.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Loader2, Check, AlertCircle, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useProducts, ProductWithUsage, ProductUsageRequest } from '@/hooks/useProducts';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useToast } from '@/components/ui/use-toast';

// Extended product interface with time-based grouping
interface ProductWithTime extends ProductWithUsage {
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  notes?: string;
}

// Group configuration
const TIME_GROUPS = [
  { key: 'morning' as const, title: 'Morning Protocol', icon: '🌅', emoji: '☀️' },
  { key: 'afternoon' as const, title: 'Afternoon Protocol', icon: '☀️', emoji: '🌤️' },
  { key: 'evening' as const, title: 'Evening Protocol', icon: '🌙', emoji: '🌟' }
];

interface ProductTrackerProps {
  className?: string;
}

interface UndoAction {
  productId: string;
  timeoutId: NodeJS.Timeout;
  originalState: boolean;
}

export default function ProductTracker({ className = '' }: ProductTrackerProps) {
  const { products: rawProducts, isLoading, error, logUsage, isLoggingUsage } = useProducts();
  const { data: progressData } = useUserProgress();
  const { toast } = useToast();

  // State management
  const [products, setProducts] = useState<ProductWithTime[]>([]);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [productNotes, setProductNotes] = useState<Record<string, string>>({});
  const [loggingProduct, setLoggingProduct] = useState<string | null>(null);
  const [completedGroups, setCompletedGroups] = useState<Set<string>>(new Set());
  const [undoActions, setUndoActions] = useState<Map<string, UndoAction>>(new Map());
  const [showConfetti, setShowConfetti] = useState<string | null>(null);

  const confettiRef = useRef<HTMLDivElement>(null);

  // Transform products and add time-based grouping (mock for now)
  // FIXED: Memoize productNotes keys to prevent unnecessary re-renders
  const productNotesKeys = useMemo(() => Object.keys(productNotes), [productNotes]);
  
  useEffect(() => {
    if (rawProducts) {
      const productsWithTime: ProductWithTime[] = rawProducts.map((product, index) => ({
        ...product,
        timeOfDay: ['morning', 'afternoon', 'evening'][index % 3] as 'morning' | 'afternoon' | 'evening',
        notes: productNotes[product._id] || ''
      }));
      setProducts(productsWithTime);
    }
  }, [rawProducts, productNotes]);

  // FIXED: Use useRef to track previous completed groups to avoid circular dependency
  const prevCompletedGroupsRef = useRef<Set<string>>(new Set());
  
  // Check for completed groups - FIXED: Removed completedGroups from dependency array
  useEffect(() => {
    const newCompletedGroups = new Set<string>();
    const prevCompletedGroups = prevCompletedGroupsRef.current;

    TIME_GROUPS.forEach(group => {
      const groupProducts = products.filter(p => p.timeOfDay === group.key);
      if (groupProducts.length > 0 && groupProducts.every(p => p.usage.todayCompleted)) {
        newCompletedGroups.add(group.key);

        // Trigger celebration if this is a new completion
        // FIXED: Compare against ref instead of state to avoid circular dependency
        if (!prevCompletedGroups.has(group.key)) {
          triggerGroupCelebration(group.key);
        }
      }
    });

    // FIXED: Only update state if there's actually a change (deep equality check)
    const hasChanged = newCompletedGroups.size !== prevCompletedGroups.size ||
      Array.from(newCompletedGroups).some(group => !prevCompletedGroups.has(group));
    
    if (hasChanged) {
      setCompletedGroups(newCompletedGroups);
      prevCompletedGroupsRef.current = newCompletedGroups;
    }
  }, [products]); // FIXED: Removed completedGroups from dependencies

  // FIXED: Memoize triggerGroupCelebration to prevent unnecessary re-renders
  const triggerGroupCelebration = useCallback((groupKey: string) => {
    const group = TIME_GROUPS.find(g => g.key === groupKey);
    if (!group) return;

    setShowConfetti(groupKey);
    toast({
      title: `${group.title} complete! 🎉`,
      description: `Amazing work on your ${groupKey} routine!`,
      variant: 'success',
      duration: 4000,
    });

    // Reset confetti after animation
    setTimeout(() => setShowConfetti(null), 3000);
  }, [toast]); // FIXED: Add toast to dependencies since it's used inside

  // FIXED: Memoize handleProductToggle to prevent unnecessary re-renders
  const handleProductToggle = useCallback(async (product: ProductWithTime) => {
    if (isLoggingUsage || loggingProduct === product._id) return;

    // Check if there's an undo action for this product
    const undoAction = undoActions.get(product._id);
    if (undoAction) {
      clearTimeout(undoAction.timeoutId);
      setUndoActions(prev => {
        const newMap = new Map(prev);
        newMap.delete(product._id);
        return newMap;
      });

      // If unchecking, just return to original state
      if (product.usage.todayCompleted) {
        return;
      }
    }

    if (product.usage.todayCompleted) {
      // Unchecking - set up undo window
      const timeoutId = setTimeout(async () => {
        setUndoActions(prev => {
          const newMap = new Map(prev);
          newMap.delete(product._id);
          return newMap;
        });
      }, 5000);

      setUndoActions(prev => new Map(prev.set(product._id, {
        productId: product._id,
        timeoutId,
        originalState: true
      })));

      // Optimistically update to unchecked
      setProducts(prev => prev.map(p =>
        p._id === product._id
          ? { ...p, usage: { ...p.usage, todayCompleted: false } }
          : p
      ));

      toast({
        title: "Product unchecked ↩️",
        description: "Tap 'Undo' within 5 seconds to restore.",
        variant: 'default',
        duration: 5000,
        action: (
          <button
            onClick={() => {
              clearTimeout(timeoutId);
              setUndoActions(prev => {
                const newMap = new Map(prev);
                newMap.delete(product._id);
                return newMap;
              });
              setProducts(prev => prev.map(p =>
                p._id === product._id
                  ? { ...p, usage: { ...p.usage, todayCompleted: true } }
                  : p
              ));
              toast({ title: "Restored! ✓", variant: 'success', duration: 2000 });
            }}
            className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
          >
            Undo
          </button>
        )
      });

      return;
    }

    // Checking - log usage
    setLoggingProduct(product._id);
    try {
      const request: ProductUsageRequest = {
        productId: product._id,
        date: new Date().toISOString().split('T')[0],
        notes: productNotes[product._id] || undefined
      };

      await logUsage(request);

      // Show success animation and toast
      toast({
        title: `${product.name} logged! ✅`,
        description: "Keep up the great work!",
        variant: 'success',
        duration: 3000,
      });

    } catch (error) {
      console.error('Failed to log product usage:', error);
      toast({
        title: "Couldn't log product 😔",
        description: "Please check your connection and try again.",
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setLoggingProduct(null);
    }
  }, [isLoggingUsage, loggingProduct, undoActions, logUsage, productNotes, toast]); // FIXED: Add all dependencies

  // FIXED: Memoize handleNoteChange to prevent unnecessary re-renders
  const handleNoteChange = useCallback((productId: string, note: string) => {
    setProductNotes(prev => ({ ...prev, [productId]: note }));
  }, []); // No dependencies needed as it only uses the setter

  // FIXED: Memoize handleNoteSubmit to prevent unnecessary re-renders
  const handleNoteSubmit = useCallback(async (productId: string) => {
    const note = productNotes[productId];
    if (!note?.trim()) return;

    try {
      // Update note via API (would need PATCH endpoint)
      // For now, we'll store locally
      toast({
        title: "Note saved",
        description: "Your note has been recorded.",
        variant: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  }, [productNotes, toast]); // FIXED: Add dependencies

  // FIXED: Memoize handleTakeAllGroup to prevent unnecessary re-renders
  const handleTakeAllGroup = useCallback(async (groupKey: string) => {
    const groupProducts = products.filter(p =>
      p.timeOfDay === groupKey && !p.usage.todayCompleted
    );

    if (groupProducts.length === 0) return;

    setLoggingProduct('batch-' + groupKey);

    try {
      // Log all products in parallel
      await Promise.all(groupProducts.map(product =>
        logUsage({
          productId: product._id,
          date: new Date().toISOString().split('T')[0],
          notes: productNotes[product._id] || undefined
        })
      ));

      toast({
        title: `🚀 ${TIME_GROUPS.find(g => g.key === groupKey)?.title} Complete!`,
        description: `Logged ${groupProducts.length} products at once.`,
        variant: 'success',
        duration: 4000,
      });

    } catch (error) {
      console.error('Failed to batch log products:', error);
      toast({
        title: "Batch logging failed",
        description: "Some products may not have been logged.",
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setLoggingProduct(null);
    }
  }, [products, loggingProduct, logUsage, productNotes, toast]); // FIXED: Add dependencies

  // FIXED: Memoize computed values to prevent unnecessary recalculations
  const weeklyCompliance = useMemo(() => {
    if (!progressData?.productCompliance?.last7Days?.percentage) return null;
    return Math.round(progressData.productCompliance.last7Days.percentage);
  }, [progressData?.productCompliance?.last7Days?.percentage]);

  const dailyCompletion = useMemo(() => {
    if (products.length === 0) return 0;
    const completed = products.filter(p => p.usage.todayCompleted).length;
    return Math.round((completed / products.length) * 100);
  }, [products]);

  // FIXED: Pre-calculate all group products at component top level to comply with React Hooks Rules
  const allGroupProducts = useMemo(() => {
    return TIME_GROUPS.reduce((acc, group) => {
      acc[group.key] = products.filter(p => p.timeOfDay === group.key);
      return acc;
    }, {} as Record<string, ProductWithTime[]>);
  }, [products]);

  // FIXED: Pre-calculate all pending products for each group at component top level
  const allPendingProducts = useMemo(() => {
    return TIME_GROUPS.reduce((acc, group) => {
      const groupProducts = allGroupProducts[group.key] || [];
      acc[group.key] = groupProducts.filter(p => !p.usage.todayCompleted);
      return acc;
    }, {} as Record<string, ProductWithTime[]>);
  }, [allGroupProducts]);

  // FIXED: Memoize ProductCheckbox component to prevent unnecessary re-renders
  const ProductCheckbox = useMemo(() => ({ product, isLoading: itemLoading }: { product: ProductWithTime; isLoading: boolean }) => (
    <button
      onClick={() => handleProductToggle(product)}
      disabled={itemLoading}
      className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
        product.usage.todayCompleted
          ? 'bg-green-500 border-green-500 text-white scale-105 shadow-md'
          : 'border-gray-300 dark:border-gray-600 hover:border-green-400 hover:scale-105'
      } ${itemLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {itemLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : product.usage.todayCompleted ? (
        <Check className="w-4 h-4 animate-pulse" />
      ) : null}
    </button>
  ), [handleProductToggle]); // FIXED: Add handleProductToggle as dependency

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
          {TIME_GROUPS.map((group, i) => (
            <div key={group.key} className="mb-6">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3"></div>
              <div className="space-y-3">
                {[1, 2].map(j => (
                  <div key={j} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg mx-auto mb-3 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-red-600 dark:text-red-400 text-sm">
            Unable to load product tracker. {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <PlusCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Products Assigned
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Your protocol hasn't been set up yet. Contact your practitioner to get started.
          </p>
        </div>
      </div>
    );
  }

  // FIXED: These are now memoized values, no need to call functions

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Daily Product Tracker
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track your wellness protocol throughout the day
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {dailyCompletion}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Today's progress
          </div>
        </div>
      </div>

      {/* Daily Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Daily Completion
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {products.filter(p => p.usage.todayCompleted).length} / {products.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-500 to-purple-400 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${dailyCompletion}%` }}
          ></div>
        </div>
      </div>

      {/* Product Groups */}
      <div className="space-y-6">
        {TIME_GROUPS.map(group => {
          // FIXED: Use pre-calculated group products instead of calling hooks inside map
          const groupProducts = allGroupProducts[group.key] || [];
          
          if (groupProducts.length === 0) return null;

          const isGroupComplete = completedGroups.has(group.key);
          
          // FIXED: Use pre-calculated pending products instead of calling hooks inside map
          const pendingProducts = allPendingProducts[group.key] || [];

          return (
            <div key={group.key} className="relative">
              {/* Group Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{group.icon}</div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {group.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {groupProducts.filter(p => p.usage.todayCompleted).length} of {groupProducts.length} completed
                    </p>
                  </div>
                </div>

                {/* Take All Button */}
                {pendingProducts.length > 0 && (
                  <button
                    onClick={() => handleTakeAllGroup(group.key)}
                    disabled={loggingProduct === `batch-${group.key}`}
                    className="px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {loggingProduct === `batch-${group.key}` ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Logging...
                      </span>
                    ) : (
                      `Take All (${pendingProducts.length})`
                    )}
                  </button>
                )}
              </div>

              {/* Products List */}
              <div className="space-y-3">
                {groupProducts.map(product => {
                  const isExpanded = expandedProduct === product._id;
                  const itemLoading = loggingProduct === product._id;

                  return (
                    <div
                      key={product._id}
                      className={`p-4 rounded-lg border transition-all duration-200 ${
                        product.usage.todayCompleted
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <ProductCheckbox product={product} isLoading={itemLoading} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className={`font-medium truncate ${
                              product.usage.todayCompleted
                                ? 'text-green-800 dark:text-green-200'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {product.name}
                            </h5>
                            <button
                              onClick={() => setExpandedProduct(isExpanded ? null : product._id)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          <p className={`text-sm mt-1 ${
                            product.usage.todayCompleted
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {product.dosageInstructions} • {product.frequency}
                          </p>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {product.description}
                              </p>
                            </div>

                            {/* Quick Notes */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                📝 Quick Note (optional)
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={productNotes[product._id] || ''}
                                  onChange={(e) => handleNoteChange(product._id, e.target.value)}
                                  onBlur={() => handleNoteSubmit(product._id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleNoteSubmit(product._id);
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  placeholder="How did you feel after taking this?"
                                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Group Completion Celebration */}
              {isGroupComplete && (
                <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl animate-bounce">{group.emoji}</span>
                    <p className="text-green-800 dark:text-green-200 font-medium">
                      🎉 {group.title} complete! Amazing work!
                    </p>
                    <span className="text-2xl animate-bounce animation-delay-150">{group.emoji}</span>
                  </div>
                </div>
              )}

              {/* Confetti Effect */}
              {showConfetti === group.key && (
                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                  <div className="text-4xl animate-ping">🎉</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly Compliance Summary */}
      {weeklyCompliance !== null && (
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Weekly Compliance
            </h4>
            <span className={`text-lg font-bold ${
              weeklyCompliance >= 80 ? 'text-green-600 dark:text-green-400' :
              weeklyCompliance >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {weeklyCompliance}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                weeklyCompliance >= 80 ? 'bg-green-500' :
                weeklyCompliance >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${weeklyCompliance}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {weeklyCompliance >= 80
              ? "Excellent consistency! Keep up the great work! 🌟"
              : weeklyCompliance >= 60
              ? "Good progress! Try to be more consistent this week. 💪"
              : "Let's focus on building a stronger routine. You've got this! 🚀"
            }
          </p>
        </div>
      )}

      {/* 100% Daily Completion Celebration */}
      {dailyCompletion === 100 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-center">
            <div className="text-3xl mb-2">🎉✨🎉</div>
            <h4 className="text-lg font-bold text-purple-800 dark:text-purple-200 mb-1">
              Perfect Day Achieved!
            </h4>
            <p className="text-purple-600 dark:text-purple-400 text-sm">
              You've completed your entire daily protocol. Your health is your wealth! 💎
            </p>
          </div>
        </div>
      )}
    </div>
  );
}