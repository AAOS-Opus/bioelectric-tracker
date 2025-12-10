"use client";

/**
 * ModalitySession Component
 *
 * Comprehensive bioelectric and scalar healing session logger with timer functionality,
 * structured inputs, and meaningful reflection prompts.
 */

import { useState, useEffect, useRef } from 'react';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useToast } from '@/components/ui/use-toast';
import { postFetcher } from '@/lib/fetcher';

// Supported modality types
const MODALITY_TYPES = [
  { value: 'scalar', label: 'Scalar', icon: '⚡' },
  { value: 'mwo', label: 'MWO (Multi-Wave Oscillator)', icon: '🌊' },
  { value: 'spooky-remote', label: 'Spooky Remote', icon: '👻' },
  { value: 'biocharger', label: 'BioCharger', icon: '⚡' },
  { value: 'rife', label: 'Rife', icon: '🔬' },
  { value: 'pemf', label: 'PEMF (Pulsed Electromagnetic Field)', icon: '🧲' },
  { value: 'other', label: 'Other (Custom)', icon: '✨' },
];

// Affirmations for different states
const AFFIRMATIONS = [
  "Thank you for taking this time to heal.",
  "Your consistency creates coherence.",
  "Each session strengthens your vitality.",
  "You are investing in your highest potential.",
  "Healing happens in the present moment.",
];

interface SessionData {
  modality: string;
  customModality?: string;
  duration: number;
  startTime: string;
  intentions?: string;
  experience?: string;
}

interface ModalitySessionProps {
  className?: string;
  onSessionLogged?: (session: SessionData) => void;
}

export default function ModalitySession({ className = '', onSessionLogged }: ModalitySessionProps) {
  const { mutate: refreshProgress } = useUserProgress();
  const { toast } = useToast();

  // Form state
  const [modality, setModality] = useState('scalar');
  const [customModality, setCustomModality] = useState('');
  const [duration, setDuration] = useState(30);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0); // Round to nearest minute
    return now.toISOString().slice(0, 16); // Format for datetime-local input
  });
  const [intentions, setIntentions] = useState('');
  const [experience, setExperience] = useState('');

  // Timer state
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [showExperienceForm, setShowExperienceForm] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAffirmation, setCurrentAffirmation] = useState(0);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Rotate affirmations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAffirmation(prev => (prev + 1) % AFFIRMATIONS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Timer logic
  useEffect(() => {
    if (isTimerActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Timer completed
            setIsTimerActive(false);
            setShowExperienceForm(true);
            toast({
              title: "🌀 Session Complete!",
              description: "Log your experience below to complete the session.",
              variant: 'success',
              duration: 5000,
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTimerActive, timeRemaining, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSelectedModality = () => {
    return MODALITY_TYPES.find(m => m.value === modality);
  };

  const validateForm = () => {
    const errors = [];

    if (!modality) {
      errors.push('Modality type is required');
    }

    if (modality === 'other' && !customModality.trim()) {
      errors.push('Custom modality name is required');
    }

    if (duration < 15 || duration > 120) {
      errors.push('Duration must be between 15 and 120 minutes');
    }

    if (!startTime) {
      errors.push('Start time is required');
    }

    return errors;
  };

  const handleStartTimer = () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setShowValidationErrors(true);
      toast({
        title: "Please fix the following errors:",
        description: errors.join(', '),
        variant: 'destructive',
        duration: 4000,
      });
      return;
    }

    setTimeRemaining(duration * 60);
    setIsTimerActive(true);
    setTimerStartTime(new Date());
    setShowValidationErrors(false);

    toast({
      title: `🧘 ${getSelectedModality()?.label} Session Started`,
      description: `${duration} minutes of healing time begins now.`,
      variant: 'success',
      duration: 3000,
    });
  };

  const handleStopTimer = () => {
    setIsTimerActive(false);
    setTimeRemaining(0);
    setShowExperienceForm(true);

    // Update start time to when timer actually started
    if (timerStartTime) {
      setStartTime(timerStartTime.toISOString().slice(0, 16));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      setShowValidationErrors(true);
      toast({
        title: "Please fix the following errors:",
        description: errors.join(', '),
        variant: 'destructive',
        duration: 4000,
      });
      return;
    }

    setIsSubmitting(true);
    setShowValidationErrors(false);

    try {
      const sessionData: SessionData = {
        modality: modality === 'other' ? customModality : modality,
        duration,
        startTime: new Date(startTime).toISOString(),
        intentions: intentions.trim() || undefined,
        experience: experience.trim() || undefined,
      };

      // Submit to API
      await postFetcher('/api/modalities/log-session', sessionData);

      // Success feedback
      toast({
        title: "✨ Session Logged Successfully",
        description: `Your ${sessionData.modality} session has been recorded.`,
        variant: 'success',
        duration: 4000,
      });

      // Reset form
      setIntentions('');
      setExperience('');
      setShowExperienceForm(false);
      setDuration(30);
      setStartTime(() => {
        const now = new Date();
        now.setSeconds(0, 0);
        return now.toISOString().slice(0, 16);
      });

      // Refresh user progress data
      refreshProgress();

      // Callback for parent component
      onSessionLogged?.(sessionData);

    } catch (error) {
      console.error('Failed to log session:', error);
      toast({
        title: "Failed to Log Session",
        description: "Please try again. Check your connection.",
        variant: 'destructive',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedModalityData = getSelectedModality();
  const progressPercentage = duration > 0 ? ((duration * 60 - timeRemaining) / (duration * 60)) * 100 : 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
          <span className="text-2xl">🧘</span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Modality Session Logger
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track your bioelectric and scalar healing sessions
          </p>
        </div>
      </div>

      {/* Active Timer Display */}
      {isTimerActive && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">{selectedModalityData?.icon}</span>
              <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-200">
                {selectedModalityData?.label} Session Active
              </h4>
            </div>

            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-2">
              {formatTime(timeRemaining)}
            </div>

            <div className="w-full bg-purple-200 dark:bg-purple-700 rounded-full h-3 mb-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <button
              onClick={handleStopTimer}
              className="px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors"
            >
              End Session Early
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Modality Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Modality Type *
          </label>
          <select
            value={modality}
            onChange={(e) => setModality(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              showValidationErrors && !modality ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={isTimerActive}
          >
            {MODALITY_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>

          {/* Custom Modality Input */}
          {modality === 'other' && (
            <div className="mt-3">
              <input
                type="text"
                value={customModality}
                onChange={(e) => setCustomModality(e.target.value)}
                placeholder="Enter custom modality name"
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  showValidationErrors && modality === 'other' && !customModality.trim() ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={isTimerActive}
              />
            </div>
          )}
        </div>

        {/* Duration Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Duration: {duration} minutes
          </label>
          <input
            type="range"
            min="15"
            max="120"
            step="5"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            disabled={isTimerActive}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>15 min</span>
            <span>60 min</span>
            <span>120 min</span>
          </div>
        </div>

        {/* Date/Time Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Session Start Time *
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              showValidationErrors && !startTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={isTimerActive}
          />
        </div>

        {/* Intentions Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What is your intention for this session?
          </label>
          <textarea
            value={intentions}
            onChange={(e) => setIntentions(e.target.value)}
            placeholder="Release tension, increase clarity, boost energy..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            disabled={isTimerActive}
          />
        </div>

        {/* Experience Notes (shown after timer or always visible) */}
        {(showExperienceForm || !isTimerActive) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Describe your experience
            </label>
            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Felt warmth in spine, mind calmed, energy increased..."
              rows={3}
              maxLength={1000}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {experience.length}/1000 characters
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isTimerActive && !showExperienceForm && (
            <button
              type="button"
              onClick={handleStartTimer}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 font-medium"
            >
              🕐 Start Session Timer
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isTimerActive}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-500 hover:to-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Logging...
              </span>
            ) : (
              "📝 Log Session"
            )}
          </button>
        </div>
      </form>

      {/* Affirmation */}
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 italic transition-opacity duration-500">
          {AFFIRMATIONS[currentAffirmation]}
        </p>
      </div>

      {/* Session Guidelines */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          💡 Session Tips
        </h4>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Create a quiet, comfortable space</li>
          <li>• Set clear intentions before beginning</li>
          <li>• Stay hydrated during and after sessions</li>
          <li>• Note any sensations, emotions, or insights</li>
        </ul>
      </div>

      {/* Custom Styles for Range Slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8B5CF6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8B5CF6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}