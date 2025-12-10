"use client";

/**
 * OnboardingWizard - Placeholder Component
 *
 * TODO: Implement full onboarding wizard with steps for:
 * - User profile setup
 * - Health goals selection
 * - Protocol preferences
 * - Initial biomarker baseline
 */

import { useState } from 'react';

export default function OnboardingWizard() {
  const [isComplete, setIsComplete] = useState(false);

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_state', JSON.stringify({ completed: true }));
    setIsComplete(true);
    // Reload to show dashboard
    window.location.reload();
  };

  if (isComplete) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Bioelectric Tracker
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Track your wellness journey with personalized insights and progress monitoring.
          </p>

          <button
            onClick={handleComplete}
            className="w-full px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200"
          >
            Get Started
          </button>

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Full onboarding wizard coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
