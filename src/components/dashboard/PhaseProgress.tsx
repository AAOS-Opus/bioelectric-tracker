"use client";

import { useState, useEffect, useRef, memo } from 'react';
import { format } from 'date-fns';
import { useCurrentPhase } from '@/hooks/useCurrentPhase';
import { useToast } from '@/components/ui/use-toast';

interface PhaseNode {
  phaseNumber: number;
  name: string;
  title: string;
  status: 'completed' | 'current' | 'upcoming';
  startDate?: string;
  endDate?: string;
  completionPercentage?: number;
  affirmation?: string;
  description?: string;
  icon?: string;
}

interface PhaseProgressProps {
  showCelebrations?: boolean;
  className?: string;
}

const PhaseProgress = memo(function PhaseProgress({
  showCelebrations = true,
  className = ''
}: PhaseProgressProps) {
  const { data: currentPhaseData, isLoading, error } = useCurrentPhase();
  const { toast } = useToast();
  const [phases, setPhases] = useState<PhaseNode[]>([]);
  const [previousPhaseNumber, setPreviousPhaseNumber] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Default phase structure (will be replaced with actual data when available)
  const defaultPhases: PhaseNode[] = [
    {
      phaseNumber: 1,
      name: "Foundation",
      title: "Phase 1: Foundation",
      status: 'upcoming',
      description: "Building the foundation for your wellness journey",
      affirmation: "I am committed to my health and wellbeing",
      icon: "🌱"
    },
    {
      phaseNumber: 2,
      name: "Integration",
      title: "Phase 2: Integration",
      status: 'upcoming',
      description: "Integrating new habits into daily routines",
      affirmation: "I embrace positive changes in my life",
      icon: "🔄"
    },
    {
      phaseNumber: 3,
      name: "Optimization",
      title: "Phase 3: Optimization",
      status: 'upcoming',
      description: "Optimizing protocols for maximum benefit",
      affirmation: "I am becoming the best version of myself",
      icon: "⚡"
    },
    {
      phaseNumber: 4,
      name: "Mastery",
      title: "Phase 4: Mastery",
      status: 'upcoming',
      description: "Achieving mastery and long-term success",
      affirmation: "I have mastered my wellness journey",
      icon: "🎯"
    }
  ];

  // Defensive guard to ensure defaultPhases is properly initialized
  const safeDefaultPhases = defaultPhases.filter(phase =>
    phase &&
    typeof phase.phaseNumber === 'number' &&
    phase.name &&
    phase.title
  );

  // Update phases based on current phase data
  useEffect(() => {
    if (currentPhaseData) {
      const currentPhase = currentPhaseData.phase;
      
      // Defensive guard to prevent crashes when currentPhase is undefined
      if (!currentPhase || currentPhase.phaseNumber === undefined) {
        console.warn("PhaseProgress: currentPhase is undefined in TEST_MODE");
        setPhases(safeDefaultPhases);
        setShowFallbackMessage(true);
        return;
      }
      
      setShowFallbackMessage(false);
      
      const updatedPhases = safeDefaultPhases.map(phase => {
        if (phase.phaseNumber < currentPhase.phaseNumber) {
          return { ...phase, status: 'completed' as const };
        } else if (phase.phaseNumber === currentPhase.phaseNumber) {
          return {
            ...phase,
            status: 'current' as const,
            startDate: currentPhase.startDate,
            endDate: currentPhase.endDate,
            completionPercentage: currentPhaseData.completionPercentage,
            affirmation: currentPhase.affirmation || phase.affirmation,
            description: currentPhase.description || phase.description
          };
        } else {
          return { ...phase, status: 'upcoming' as const };
        }
      });
      setPhases(updatedPhases);

      // Detect phase transition for celebration
      if (showCelebrations && previousPhaseNumber !== null &&
          currentPhase.phaseNumber > previousPhaseNumber) {
        triggerCelebration(currentPhase.phaseNumber);
      }
      setPreviousPhaseNumber(currentPhase.phaseNumber);
    } else {
      setPhases(safeDefaultPhases);
      setShowFallbackMessage(false);
    }
  }, [currentPhaseData, previousPhaseNumber, showCelebrations]);

  const triggerCelebration = (newPhaseNumber: number) => {
    setShowConfetti(true);
    toast({
      title: `🎉 Congratulations!`,
      description: `You've entered ${safeDefaultPhases[newPhaseNumber - 1]?.title}!`,
      variant: 'success',
      duration: 5000,
    });

    // Reset confetti after animation
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const PhaseTooltip = ({ phase }: { phase: PhaseNode }) => (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg shadow-lg z-10 min-w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
      <div className="text-center">
        <div className="font-semibold mb-1">{phase.title}</div>
        {phase.status === 'current' && phase.completionPercentage !== undefined && (
          <div className="text-xs mb-1">{phase.completionPercentage}% Complete</div>
        )}
        {phase.startDate && (
          <div className="text-xs mb-1">
            Started: {format(new Date(phase.startDate), 'MMM d, yyyy')}
          </div>
        )}
        {phase.endDate && (
          <div className="text-xs mb-1">
            Ends: {format(new Date(phase.endDate), 'MMM d, yyyy')}
          </div>
        )}
        {phase.description && (
          <div className="text-xs mb-1">{phase.description}</div>
        )}
        {phase.affirmation && (
          <div className="text-xs italic">"{phase.affirmation}"</div>
        )}
      </div>
      {/* Tooltip arrow */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
    </div>
  );

  const PhaseNode = ({ phase, index }: { phase: PhaseNode; index: number }) => {
    const isLast = index === phases.length - 1;

    return (
      <div className="flex-1 relative group">
        {/* Connecting line */}
        {!isLast && (
          <div className="hidden md:block absolute top-6 left-[calc(50%+1.5rem)] right-0 h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700"></div>
        )}

        {/* Mobile connecting line (vertical) */}
        {!isLast && (
          <div className="md:hidden absolute left-6 top-[calc(50%+1.5rem)] bottom-0 w-0.5 bg-gradient-to-b from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700"></div>
        )}

        <div className="flex flex-col md:flex-col items-center md:items-center text-center relative">
          {/* Phase circle/icon */}
          <div className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
            phase.status === 'completed'
              ? 'bg-green-500 border-green-500 text-white'
              : phase.status === 'current'
              ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
              : 'bg-gray-100 border-gray-300 text-gray-400 border-dashed dark:bg-gray-800 dark:border-gray-600'
          }`}>
            {phase.status === 'completed' ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : phase.status === 'current' ? (
              <div className="text-lg font-bold">
                {phase.phaseNumber}
              </div>
            ) : (
              <div className="text-sm font-medium">
                {phase.phaseNumber}
              </div>
            )}

            {/* Pulsing ring for current phase */}
            {phase.status === 'current' && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping"></div>
            )}
          </div>

          {/* Phase info */}
          <div className="mt-3 max-w-32">
            <div className={`text-sm font-semibold ${
              phase.status === 'completed' || phase.status === 'current'
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {phase.name}
            </div>
            <div className={`text-xs mt-1 ${
              phase.status === 'completed' || phase.status === 'current'
                ? 'text-gray-600 dark:text-gray-300'
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              Phase {phase.phaseNumber}
            </div>
            {phase.status === 'current' && phase.completionPercentage !== undefined && (
              <div className="text-xs mt-1 text-blue-600 dark:text-blue-400 font-medium">
                {phase.completionPercentage}% complete
              </div>
            )}
            {phase.icon && (
              <div className="text-lg mt-1">
                {phase.icon}
              </div>
            )}
          </div>

          {/* Tooltip */}
          <PhaseTooltip phase={phase} />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex justify-center items-center">
            <div className="flex space-x-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="mt-2 h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="mt-1 h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800 p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 text-sm">
            Unable to load phase progress
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Your Wellness Journey
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track your progress through the four phases of regeneration
        </p>
        {showFallbackMessage && (
          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Current phase not detected (TEST_MODE). Rendering mock timeline...
            </p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div
        ref={timelineRef}
        className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-4 overflow-x-auto md:overflow-visible overflow-y-auto md:overflow-y-visible max-h-96 md:max-h-none"
      >
        {phases.map((phase, index) => (
          <PhaseNode key={phase.phaseNumber} phase={phase} index={index} />
        ))}
      </div>

      {/* Confetti animation container */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎉</div>
        </div>
      )}

      {/* Progress summary */}
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {phases.filter(p => p.status === 'completed').length} of {phases.length} phases completed
          </p>
          {currentPhaseData && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {currentPhaseData.remainingDays > 0
                ? `${currentPhaseData.remainingDays} days remaining in current phase`
                : 'Current phase complete!'
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

export default PhaseProgress;