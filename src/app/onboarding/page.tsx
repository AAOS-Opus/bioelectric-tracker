'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, ChevronRight, ChevronLeft, Check, Zap, Shield, Heart, Star, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Phase data matching the API
const PHASES = [
  {
    number: 1,
    name: 'Phase 1: Foundation',
    description: 'Building the foundation for your wellness journey. Focus on basic detoxification and preparing your body.',
    duration: '30 days',
    icon: Shield,
    color: 'from-blue-500 to-blue-600'
  },
  {
    number: 2,
    name: 'Phase 2: Bioelectric Regeneration',
    description: 'Advanced cellular repair and bioelectric regeneration. Deep detox and energy optimization.',
    duration: '30 days',
    icon: Zap,
    color: 'from-purple-500 to-purple-600'
  },
  {
    number: 3,
    name: 'Phase 3: Cellular Optimization',
    description: 'Optimizing cellular function and energy production. Enhanced mitochondrial support.',
    duration: '30 days',
    icon: Heart,
    color: 'from-green-500 to-green-600'
  },
  {
    number: 4,
    name: 'Phase 4: Complete Regeneration',
    description: 'Achieving complete liver and colon regeneration. Final phase of the protocol.',
    duration: '30 days',
    icon: Star,
    color: 'from-amber-500 to-amber-600'
  }
];

type WizardStep = 'welcome' | 'phase' | 'preferences' | 'complete';

interface OnboardingFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  currentPhaseNumber: 1 | 2 | 3 | 4;
  preferences: {
    notifications: {
      email: boolean;
      inApp: boolean;
      sms: boolean;
    };
    theme: 'light' | 'dark' | 'system';
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();

  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<OnboardingFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    currentPhaseNumber: 1,
    preferences: {
      notifications: {
        email: true,
        inApp: true,
        sms: false
      },
      theme: 'system'
    }
  });

  // Pre-fill from session if available
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email
      }));
    }
  }, [session]);

  // Save wizard progress to server (FM-005/006 hardening)
  const saveWizardProgress = useCallback(async (step: WizardStep, data: Partial<OnboardingFormData>) => {
    try {
      await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, data })
      });
    } catch (err) {
      console.error('Failed to save wizard progress:', err);
      // Non-blocking - continue anyway
    }
  }, []);

  const handleNext = async () => {
    setError(null);

    // Validation per step
    if (currentStep === 'welcome') {
      // Save progress
      await saveWizardProgress('welcome', {});
      setCurrentStep('phase');
    } else if (currentStep === 'phase') {
      await saveWizardProgress('phase', { currentPhaseNumber: formData.currentPhaseNumber });
      setCurrentStep('preferences');
    } else if (currentStep === 'preferences') {
      // Validate name
      if (!formData.name.trim()) {
        setError('Please enter your name');
        return;
      }
      // Validate email if not from session
      if (!formData.email.trim()) {
        if (session?.user?.email) {
          setFormData(prev => ({ ...prev, email: session.user!.email! }));
        } else {
          setError('Please enter your email');
          return;
        }
      }
      // Validate password
      if (!formData.password) {
        setError('Please enter a password');
        return;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      await saveWizardProgress('preferences', { preferences: formData.preferences });
      setCurrentStep('complete');
    }
  };

  const handleBack = () => {
    if (currentStep === 'phase') setCurrentStep('welcome');
    else if (currentStep === 'preferences') setCurrentStep('phase');
    else if (currentStep === 'complete') setCurrentStep('preferences');
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          currentPhaseNumber: formData.currentPhaseNumber,
          preferences: formData.preferences
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to complete onboarding');
      }

      // Update localStorage with preferences (atomic with server write - FM-002)
      if (typeof window !== 'undefined') {
        const localPrefs = {
          ...formData.preferences,
          lastSyncedAt: new Date().toISOString(),
          serverId: result.user.id
        };
        localStorage.setItem('userPreferences', JSON.stringify(localPrefs));
        localStorage.setItem('onboardingComplete', 'true');
      }

      // Trigger session update if available
      if (updateSession) {
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: formData.name,
            currentPhaseNumber: formData.currentPhaseNumber
          }
        });
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { key: 'welcome', label: 'Welcome' },
    { key: 'phase', label: 'Phase' },
    { key: 'preferences', label: 'Preferences' },
    { key: 'complete', label: 'Complete' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    index < currentStepIndex
                      ? 'bg-purple-600 text-white'
                      : index === currentStepIndex
                      ? 'bg-purple-500 text-white ring-4 ring-purple-500/30'
                      : 'bg-gray-700 text-gray-400'
                  )}
                >
                  {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-12 sm:w-24 h-1 mx-2',
                      index < currentStepIndex ? 'bg-purple-600' : 'bg-gray-700'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            {steps.map(step => (
              <span key={step.key} className="w-8 text-center">{step.label}</span>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Step Content */}
          <div className="p-8">
            {currentStep === 'welcome' && (
              <WelcomeStep />
            )}

            {currentStep === 'phase' && (
              <PhaseStep
                selectedPhase={formData.currentPhaseNumber}
                onSelect={(phase) => setFormData(prev => ({ ...prev, currentPhaseNumber: phase }))}
              />
            )}

            {currentStep === 'preferences' && (
              <PreferencesStep
                formData={formData}
                onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                sessionEmail={session?.user?.email}
              />
            )}

            {currentStep === 'complete' && (
              <CompleteStep formData={formData} />
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-8 py-4 bg-gray-900/50 border-t border-gray-700/50 flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 'welcome' || isSubmitting}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                currentStep === 'welcome'
                  ? 'opacity-0 pointer-events-none'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {currentStep === 'complete' ? (
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className={cn(
                  'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all',
                  'bg-gradient-to-r from-purple-600 to-purple-500 text-white',
                  'hover:from-purple-500 hover:to-purple-400',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    Start Your Journey
                    <Zap className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className={cn(
                  'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all',
                  'bg-gradient-to-r from-purple-600 to-purple-500 text-white',
                  'hover:from-purple-500 hover:to-purple-400'
                )}
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
function WelcomeStep() {
  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
          <Zap className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome to Bioelectric Tracker
        </h1>
        <p className="text-gray-400 text-lg">
          Your journey to complete bioelectric regeneration begins here.
        </p>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-6 text-left">
        <h2 className="text-xl font-semibold text-white mb-4">The 4-Phase Protocol</h2>
        <p className="text-gray-400 mb-4">
          This comprehensive 120-day protocol guides you through complete liver and colon regeneration
          using bioelectric therapies, targeted supplementation, and wellness modalities.
        </p>
        <ul className="space-y-3 text-gray-300">
          <li className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <span><strong>Phase 1:</strong> Foundation - Prepare your body for regeneration</span>
          </li>
          <li className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <span><strong>Phase 2:</strong> Bioelectric Regeneration - Deep cellular repair</span>
          </li>
          <li className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span><strong>Phase 3:</strong> Cellular Optimization - Energy enhancement</span>
          </li>
          <li className="flex items-start gap-3">
            <Star className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <span><strong>Phase 4:</strong> Complete Regeneration - Final transformation</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

interface PhaseStepProps {
  selectedPhase: 1 | 2 | 3 | 4;
  onSelect: (phase: 1 | 2 | 3 | 4) => void;
}

function PhaseStep({ selectedPhase, onSelect }: PhaseStepProps) {
  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Select Your Starting Phase</h2>
        <p className="text-gray-400">
          Choose where you want to begin your protocol. Most users start with Phase 1.
        </p>
      </div>

      <div className="grid gap-4">
        {PHASES.map((phase) => {
          const Icon = phase.icon;
          const isSelected = selectedPhase === phase.number;

          return (
            <button
              key={phase.number}
              onClick={() => onSelect(phase.number as 1 | 2 | 3 | 4)}
              className={cn(
                'w-full p-4 rounded-xl border-2 transition-all text-left',
                isSelected
                  ? 'border-purple-500 bg-purple-900/30'
                  : 'border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50'
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br flex-shrink-0',
                  phase.color
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">{phase.name}</h3>
                    <span className="text-xs text-gray-500">{phase.duration}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{phase.description}</p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedPhase > 1 && (
        <p className="mt-4 text-sm text-amber-400 bg-amber-900/20 rounded-lg p-3">
          Note: Starting at a later phase is recommended only if you've previously completed earlier phases
          or have been advised by a healthcare professional.
        </p>
      )}
    </div>
  );
}

interface PreferencesStepProps {
  formData: OnboardingFormData;
  onChange: (updates: Partial<OnboardingFormData>) => void;
  sessionEmail?: string | null;
}

function PreferencesStep({ formData, onChange, sessionEmail }: PreferencesStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Your Preferences</h2>
        <p className="text-gray-400">
          Set up your profile and notification preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Enter your name"
            className={cn(
              'w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg',
              'text-white placeholder-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
            )}
          />
        </div>

        {/* Email (if not from session) */}
        {!sessionEmail && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="Enter your email"
              className={cn(
                'w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg',
                'text-white placeholder-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
              )}
            />
          </div>
        )}

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => onChange({ password: e.target.value })}
              placeholder="Create a password (min 8 characters)"
              className={cn(
                'w-full px-4 py-3 pr-12 bg-gray-900/50 border border-gray-700 rounded-lg',
                'text-white placeholder-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Confirm Password *
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => onChange({ confirmPassword: e.target.value })}
              placeholder="Confirm your password"
              className={cn(
                'w-full px-4 py-3 pr-12 bg-gray-900/50 border border-gray-700 rounded-lg',
                'text-white placeholder-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
                formData.confirmPassword && formData.password !== formData.confirmPassword && 'border-red-500'
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
          )}
        </div>

        {/* Notifications */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Notification Preferences
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.preferences.notifications.email}
                onChange={(e) => onChange({
                  preferences: {
                    ...formData.preferences,
                    notifications: { ...formData.preferences.notifications, email: e.target.checked }
                  }
                })}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-gray-300">Email notifications</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.preferences.notifications.inApp}
                onChange={(e) => onChange({
                  preferences: {
                    ...formData.preferences,
                    notifications: { ...formData.preferences.notifications, inApp: e.target.checked }
                  }
                })}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-gray-300">In-app notifications</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.preferences.notifications.sms}
                onChange={(e) => onChange({
                  preferences: {
                    ...formData.preferences,
                    notifications: { ...formData.preferences.notifications, sms: e.target.checked }
                  }
                })}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-gray-300">SMS reminders</span>
            </label>
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Theme Preference
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['light', 'dark', 'system'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => onChange({
                  preferences: { ...formData.preferences, theme }
                })}
                className={cn(
                  'px-4 py-2 rounded-lg border transition-all capitalize',
                  formData.preferences.theme === theme
                    ? 'border-purple-500 bg-purple-900/30 text-white'
                    : 'border-gray-700 bg-gray-800/30 text-gray-400 hover:border-gray-600'
                )}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CompleteStepProps {
  formData: OnboardingFormData;
}

function CompleteStep({ formData }: CompleteStepProps) {
  const selectedPhase = PHASES.find(p => p.number === formData.currentPhaseNumber);
  const Icon = selectedPhase?.icon || Zap;

  return (
    <div className="text-center">
      <div className="mb-6">
        <div className={cn(
          'w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 bg-gradient-to-br',
          selectedPhase?.color || 'from-purple-500 to-purple-600'
        )}>
          <Icon className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Ready to Begin!
        </h2>
        <p className="text-gray-400">
          Review your selections and start your bioelectric regeneration journey.
        </p>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-6 text-left space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-gray-700">
          <span className="text-gray-400">Name</span>
          <span className="text-white font-medium">{formData.name || 'Not set'}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-700">
          <span className="text-gray-400">Email</span>
          <span className="text-white font-medium">{formData.email || 'From session'}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-700">
          <span className="text-gray-400">Starting Phase</span>
          <span className="text-white font-medium">{selectedPhase?.name}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-700">
          <span className="text-gray-400">Email Notifications</span>
          <span className={formData.preferences.notifications.email ? 'text-green-400' : 'text-gray-500'}>
            {formData.preferences.notifications.email ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-700">
          <span className="text-gray-400">In-App Notifications</span>
          <span className={formData.preferences.notifications.inApp ? 'text-green-400' : 'text-gray-500'}>
            {formData.preferences.notifications.inApp ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-400">Theme</span>
          <span className="text-white font-medium capitalize">{formData.preferences.theme}</span>
        </div>
      </div>

      <p className="mt-6 text-sm text-gray-400">
        By continuing, you agree to track your wellness journey with us.
        Your data is stored securely and you can adjust preferences anytime.
      </p>
    </div>
  );
}
