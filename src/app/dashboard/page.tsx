"use client";

/**
 * Dashboard Main Page
 *
 * Personalized overview of user's wellness journey with real-time data.
 * Features four core widgets in responsive grid layout.
 */

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useCurrentPhase } from '@/hooks/useCurrentPhase';
import { useProducts } from '@/hooks/useProducts';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useInsights } from '@/hooks/useInsights';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import {
  CurrentPhaseCard,
  TodaysProductsCard,
  UpcomingModalitiesCard,
  ProgressSummaryCard,
  ProductTracker,
  ModalitySession,
  ProgressNoteForm,
  BiomarkerCharts
} from '@/components/dashboard/widgets';
import PhaseProgress from '@/components/dashboard/PhaseProgress';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { InsightCards } from '@/components/insights/InsightCard';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

function DashboardContent() {
  const { data: session } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const currentPhase = useCurrentPhase();
  const products = useProducts();
  const notifications = useNotifications({ limit: 5 });
  const userProgress = useUserProgress();
  const insights = useInsights({ useMockData: true });

  // Check onboarding status
  useEffect(() => {
    const stored = localStorage.getItem('onboarding_state');
    const state = stored ? JSON.parse(stored) : null;
    const isCompleted = localStorage.getItem('onboarding_completed') === 'true';

    if (!isCompleted && !state?.completed) {
      setShowOnboarding(true);
    }
  }, []);

  // Show onboarding wizard if not completed
  if (showOnboarding) {
    return <OnboardingWizard />;
  }

  const userName = session?.user?.name || 'User';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome back, {userName}
              </h1>
              <p className="text-lg text-gray-400 mt-1">
                Let's keep the momentum going.
              </p>
            </div>

            {/* Actions Row */}
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {/* Notification Center */}
              <NotificationCenter />

              {/* Manual Refresh Button */}
              <button
                onClick={() => {
                  currentPhase.mutate();
                  products.mutate();
                  notifications.mutate();
                  userProgress.refresh();
                  insights.refreshInsights();
                }}
                aria-label="Refresh dashboard data"
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-purple-400 transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-sm sm:text-base"
                disabled={currentPhase.isValidating || products.isValidating || notifications.isValidating || userProgress.isValidating || insights.isLoading}
              >
                <svg
                  className={`w-4 h-4 ${(currentPhase.isValidating || products.isValidating || notifications.isValidating || userProgress.isValidating) ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="sr-only sm:not-sr-only">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Phase Progress Timeline */}
        <div className="mb-8">
          <PhaseProgress showCelebrations={true} />
        </div>

        {/* Product Tracker */}
        <div className="mb-8">
          <ProductTracker />
        </div>

        {/* Modality Session Logger */}
        <div className="mb-8">
          <ModalitySession />
        </div>

        {/* Progress Note Form */}
        <div className="mb-8">
          <ProgressNoteForm />
        </div>

        {/* Biomarker Charts */}
        <div className="mb-8">
          <BiomarkerCharts />
        </div>

        {/* Personal Insights */}
        <div className="mb-8">
          <InsightCards
            insights={insights.insights}
            onDismissInsight={insights.dismissInsight}
            title="Your Insights"
            className=""
          />
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Phase Card */}
          <CurrentPhaseCard
            data={currentPhase.data}
            isLoading={currentPhase.isLoading}
            error={currentPhase.error}
          />

          {/* Today's Products Checklist */}
          <TodaysProductsCard
            products={products.products}
            isLoading={products.isLoading}
            error={products.error}
            onLogUsage={products.logUsage}
            isLoggingUsage={products.isLoggingUsage}
          />

          {/* Upcoming Modalities */}
          <UpcomingModalitiesCard
            notifications={notifications.notifications}
            isLoading={notifications.isLoading}
            error={notifications.error}
          />

          {/* Recent Progress Summary */}
          <ProgressSummaryCard
            data={userProgress.data}
            isLoading={userProgress.isLoading}
            error={userProgress.error}
          />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    }>
      <ProtectedRoute>
        <DashboardContent />
      </ProtectedRoute>
    </Suspense>
  );
}