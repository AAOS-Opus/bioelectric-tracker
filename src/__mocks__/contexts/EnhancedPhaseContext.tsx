/**
 * Mock Enhanced Phase Context for testing advanced phase settings functionality
 */
import React, { createContext, useContext, useState } from 'react';
import { enhancedPhasesMock, EnhancedPhase } from '../../__tests__/fixtures/enhanced-phases';

interface EnhancedPhaseContextType {
  phases: EnhancedPhase[];
  loading: boolean;
  error: string | null;
  currentPhase: EnhancedPhase | null;
  updatePhase: (phaseId: string, updates: Partial<EnhancedPhase>) => Promise<void>;
  completePhase: (phaseId: string) => Promise<void>;
  transitionToNextPhase: (phaseId: string) => Promise<void>;
  updatePhaseTimeline: (phaseId: string, startDate: string, endDate: string) => Promise<void>;
  updatePhaseAffirmation: (phaseId: string, affirmation: string) => Promise<void>;
  updatePhaseGoals: (phaseId: string, goals: EnhancedPhase['goals']) => Promise<void>;
  updateCustomizationSettings: (phaseId: string, settings: EnhancedPhase['customizationSettings']) => Promise<void>;
  updateNotificationSettings: (phaseId: string, settings: EnhancedPhase['notificationSettings']) => Promise<void>;
  addGoal: (phaseId: string, goal: Omit<EnhancedPhase['goals'][0], 'id'>) => Promise<void>;
  updateGoalProgress: (phaseId: string, goalId: string, progress: number | { streak?: number; value?: number }) => Promise<void>;
  lockPhase: (phaseId: string, until?: string) => Promise<void>;
  unlockPhase: (phaseId: string) => Promise<void>;
  detectTimelineGaps: () => { startPhase: EnhancedPhase; endPhase: EnhancedPhase; gapDays: number }[];
  getPhaseHistory: (phaseId: string) => EnhancedPhase['history'];
  archivePhaseData: (phaseId: string) => Promise<void>;
  generateComparativeReport: (phaseIds: string[]) => Promise<any>;
}

const defaultContext: EnhancedPhaseContextType = {
  phases: [],
  loading: true,
  error: null,
  currentPhase: null,
  updatePhase: async () => {},
  completePhase: async () => {},
  transitionToNextPhase: async () => {},
  updatePhaseTimeline: async () => {},
  updatePhaseAffirmation: async () => {},
  updatePhaseGoals: async () => {},
  updateCustomizationSettings: async () => {},
  updateNotificationSettings: async () => {},
  addGoal: async () => {},
  updateGoalProgress: async () => {},
  lockPhase: async () => {},
  unlockPhase: async () => {},
  detectTimelineGaps: () => [],
  getPhaseHistory: () => ({ versionLog: [], previousAffirmations: [] }),
  archivePhaseData: async () => {},
  generateComparativeReport: async () => ({}),
};

export const EnhancedPhaseContext = createContext<EnhancedPhaseContextType>(defaultContext);

export const useEnhancedPhase = () => useContext(EnhancedPhaseContext);

export const EnhancedPhaseProvider: React.FC<{
  children: React.ReactNode;
  initialPhases?: EnhancedPhase[];
  initialLoading?: boolean;
  initialError?: string | null;
  mockHandlers?: Partial<EnhancedPhaseContextType>;
}> = ({ 
  children, 
  initialPhases = enhancedPhasesMock,
  initialLoading = false,
  initialError = null,
  mockHandlers = {} 
}) => {
  const [phases, setPhases] = useState<EnhancedPhase[]>(initialPhases);
  const [loading, setLoading] = useState<boolean>(initialLoading);
  const [error, setError] = useState<string | null>(initialError);

  // Find current phase (first non-completed phase or last phase)
  const currentPhase = phases.find(p => !p.isCompleted) || phases[phases.length - 1] || null;

  const updatePhase = async (phaseId: string, updates: Partial<EnhancedPhase>) => {
    if (mockHandlers.updatePhase) {
      return mockHandlers.updatePhase(phaseId, updates);
    }

    setPhases(prev =>
      prev.map(phase =>
        phase._id === phaseId ? { ...phase, ...updates } : phase
      )
    );
  };

  const completePhase = async (phaseId: string) => {
    if (mockHandlers.completePhase) {
      return mockHandlers.completePhase(phaseId);
    }

    // Get the phase
    const phase = phases.find(p => p._id === phaseId);
    if (!phase) return;

    // Check if all transition requirements are met
    if (phase.transitionRequirements) {
      const allTasksCompleted = phase.transitionRequirements.tasks.every(task => task.isCompleted);
      const allBiomarkersInRange = phase.transitionRequirements.biomarkers?.every(
        bm => (bm.currentValue !== undefined) && 
             (bm.currentValue >= bm.targetRange[0] && bm.currentValue <= bm.targetRange[1])
      ) ?? true;
      const hasApproval = phase.transitionRequirements.practitionerApproval !== false;

      if (!allTasksCompleted || !allBiomarkersInRange || !hasApproval) {
        setError('Cannot complete phase: Some transition requirements are not met');
        return;
      }
    }

    // Mark as completed
    setPhases(prev =>
      prev.map(p =>
        p._id === phaseId ? { ...p, isCompleted: true } : p
      )
    );

    // Add to version log
    const now = new Date().toISOString();
    const updatedPhases = phases.map(p =>
      p._id === phaseId
        ? {
            ...p,
            isCompleted: true,
            history: {
              ...p.history,
              versionLog: [
                ...p.history.versionLog,
                {
                  date: now,
                  user: 'user-123',
                  changes: { isCompleted: { from: false, to: true } },
                  notes: 'Phase completed'
                }
              ]
            }
          }
        : p
    );
    setPhases(updatedPhases);
  };

  const transitionToNextPhase = async (phaseId: string) => {
    if (mockHandlers.transitionToNextPhase) {
      return mockHandlers.transitionToNextPhase(phaseId);
    }

    // Complete current phase
    await completePhase(phaseId);

    // Find next phase
    const currentPhase = phases.find(p => p._id === phaseId);
    if (!currentPhase) return;

    const nextPhase = phases.find(p => p.phaseNumber === currentPhase.phaseNumber + 1);
    if (!nextPhase) return;

    // Update next phase start date if needed to ensure no gap
    const currentEndDate = new Date(currentPhase.endDate);
    const nextStartDate = new Date(nextPhase.startDate);

    if (nextStartDate.getTime() > currentEndDate.getTime() + 86400000) {
      // There's a gap, adjust next phase start date
      const newStartDate = new Date(currentEndDate);
      newStartDate.setDate(newStartDate.getDate() + 1);
      await updatePhaseTimeline(nextPhase._id, newStartDate.toISOString(), nextPhase.endDate);
    }
  };

  const updatePhaseTimeline = async (phaseId: string, startDate: string, endDate: string) => {
    if (mockHandlers.updatePhaseTimeline) {
      return mockHandlers.updatePhaseTimeline(phaseId, startDate, endDate);
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      setError('Start date must be before end date');
      return;
    }

    // Get the phase
    const phaseIndex = phases.findIndex(p => p._id === phaseId);
    if (phaseIndex === -1) return;

    const phase = phases[phaseIndex];
    const prevPhase = phases.find(p => p.phaseNumber === phase.phaseNumber - 1);
    const nextPhase = phases.find(p => p.phaseNumber === phase.phaseNumber + 1);

    // Validate against previous and next phases
    if (prevPhase && new Date(startDate) <= new Date(prevPhase.startDate)) {
      setError('Start date must be after previous phase start date');
      return;
    }

    if (nextPhase && new Date(endDate) >= new Date(nextPhase.endDate)) {
      setError('End date must be before next phase end date');
      return;
    }

    // Update the timeline
    const updatedPhase = { 
      ...phase, 
      startDate, 
      endDate,
      history: {
        ...phase.history,
        versionLog: [
          ...phase.history.versionLog,
          {
            date: new Date().toISOString(),
            user: 'user-123',
            changes: { 
              startDate: { from: phase.startDate, to: startDate },
              endDate: { from: phase.endDate, to: endDate }
            },
            notes: 'Timeline updated'
          }
        ]
      }
    };

    // Update phases
    const updatedPhases = [...phases];
    updatedPhases[phaseIndex] = updatedPhase;

    // Adjust adjacent phases if needed
    if (prevPhase) {
      const prevPhaseIndex = phases.findIndex(p => p._id === prevPhase._id);
      const prevEndDate = new Date(startDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      updatedPhases[prevPhaseIndex] = {
        ...prevPhase,
        endDate: prevEndDate.toISOString(),
        history: {
          ...prevPhase.history,
          versionLog: [
            ...prevPhase.history.versionLog,
            {
              date: new Date().toISOString(),
              user: 'user-123',
              changes: { endDate: { from: prevPhase.endDate, to: prevEndDate.toISOString() } },
              notes: 'Timeline adjusted due to next phase change'
            }
          ]
        }
      };
    }

    if (nextPhase && new Date(endDate).getTime() + 86400000 > new Date(nextPhase.startDate).getTime()) {
      const nextPhaseIndex = phases.findIndex(p => p._id === nextPhase._id);
      const nextStartDate = new Date(endDate);
      nextStartDate.setDate(nextStartDate.getDate() + 1);
      updatedPhases[nextPhaseIndex] = {
        ...nextPhase,
        startDate: nextStartDate.toISOString(),
        history: {
          ...nextPhase.history,
          versionLog: [
            ...nextPhase.history.versionLog,
            {
              date: new Date().toISOString(),
              user: 'user-123',
              changes: { startDate: { from: nextPhase.startDate, to: nextStartDate.toISOString() } },
              notes: 'Timeline adjusted due to previous phase change'
            }
          ]
        }
      };
    }

    setPhases(updatedPhases);
  };

  const updatePhaseAffirmation = async (phaseId: string, affirmation: string) => {
    if (mockHandlers.updatePhaseAffirmation) {
      return mockHandlers.updatePhaseAffirmation(phaseId, affirmation);
    }

    // Get the phase
    const phase = phases.find(p => p._id === phaseId);
    if (!phase) return;

    // Store current affirmation in history
    const previousAffirmations = [
      ...phase.history.previousAffirmations,
      {
        text: phase.affirmation,
        activeFrom: phase.history.versionLog[0]?.date || phase.startDate,
        activeTo: new Date().toISOString()
      }
    ];

    // Update affirmation
    setPhases(prev =>
      prev.map(p =>
        p._id === phaseId
          ? {
              ...p,
              affirmation,
              history: {
                ...p.history,
                previousAffirmations,
                versionLog: [
                  ...p.history.versionLog,
                  {
                    date: new Date().toISOString(),
                    user: 'user-123',
                    changes: { affirmation: { from: p.affirmation, to: affirmation } },
                    notes: 'Affirmation updated'
                  }
                ]
              }
            }
          : p
      )
    );
  };

  const updatePhaseGoals = async (phaseId: string, goals: EnhancedPhase['goals']) => {
    if (mockHandlers.updatePhaseGoals) {
      return mockHandlers.updatePhaseGoals(phaseId, goals);
    }

    setPhases(prev =>
      prev.map(p =>
        p._id === phaseId
          ? {
              ...p,
              goals,
              history: {
                ...p.history,
                versionLog: [
                  ...p.history.versionLog,
                  {
                    date: new Date().toISOString(),
                    user: 'user-123',
                    changes: { goals: { from: p.goals, to: goals } },
                    notes: 'Goals updated'
                  }
                ]
              }
            }
          : p
      )
    );
  };

  const updateCustomizationSettings = async (phaseId: string, settings: EnhancedPhase['customizationSettings']) => {
    if (mockHandlers.updateCustomizationSettings) {
      return mockHandlers.updateCustomizationSettings(phaseId, settings);
    }

    setPhases(prev =>
      prev.map(p =>
        p._id === phaseId
          ? {
              ...p,
              customizationSettings: settings,
              history: {
                ...p.history,
                versionLog: [
                  ...p.history.versionLog,
                  {
                    date: new Date().toISOString(),
                    user: 'user-123',
                    changes: { customizationSettings: { from: p.customizationSettings, to: settings } },
                    notes: 'Customization settings updated'
                  }
                ]
              }
            }
          : p
      )
    );
  };

  const updateNotificationSettings = async (phaseId: string, settings: EnhancedPhase['notificationSettings']) => {
    if (mockHandlers.updateNotificationSettings) {
      return mockHandlers.updateNotificationSettings(phaseId, settings);
    }

    setPhases(prev =>
      prev.map(p =>
        p._id === phaseId
          ? {
              ...p,
              notificationSettings: settings,
              history: {
                ...p.history,
                versionLog: [
                  ...p.history.versionLog,
                  {
                    date: new Date().toISOString(),
                    user: 'user-123',
                    changes: { notificationSettings: { from: p.notificationSettings, to: settings } },
                    notes: 'Notification settings updated'
                  }
                ]
              }
            }
          : p
      )
    );
  };

  const addGoal = async (phaseId: string, goal: Omit<EnhancedPhase['goals'][0], 'id'>) => {
    if (mockHandlers.addGoal) {
      return mockHandlers.addGoal(phaseId, goal);
    }

    // Get the phase
    const phase = phases.find(p => p._id === phaseId);
    if (!phase) return;

    // Create new goal with ID
    const newGoal = {
      id: `goal${Date.now()}`,
      ...goal
    };

    // Update phase goals
    setPhases(prev =>
      prev.map(p =>
        p._id === phaseId
          ? {
              ...p,
              goals: [...p.goals, newGoal],
              history: {
                ...p.history,
                versionLog: [
                  ...p.history.versionLog,
                  {
                    date: new Date().toISOString(),
                    user: 'user-123',
                    changes: { goals: { from: p.goals, to: [...p.goals, newGoal] } },
                    notes: 'Goal added'
                  }
                ]
              }
            }
          : p
      )
    );
  };

  const updateGoalProgress = async (
    phaseId: string, 
    goalId: string, 
    progress: number | { streak?: number; value?: number }
  ) => {
    if (mockHandlers.updateGoalProgress) {
      return mockHandlers.updateGoalProgress(phaseId, goalId, progress);
    }

    // Get the phase
    const phase = phases.find(p => p._id === phaseId);
    if (!phase) return;

    // Get the goal
    const goalIndex = phase.goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return;

    const goal = phase.goals[goalIndex];
    let updatedGoal;

    if (typeof progress === 'number') {
      // Simple number update (for streak or value depending on goal type)
      if (goal.targetDays !== undefined) {
        updatedGoal = { ...goal, currentStreak: progress };
      } else {
        updatedGoal = { ...goal, currentValue: progress };
      }
    } else {
      // Object with specific fields to update
      updatedGoal = { ...goal };
      if (progress.streak !== undefined) {
        updatedGoal.currentStreak = progress.streak;
      }
      if (progress.value !== undefined) {
        updatedGoal.currentValue = progress.value;
      }
    }

    // Update milestones if any
    if (updatedGoal.milestones) {
      const progressValue = goal.targetDays !== undefined 
        ? updatedGoal.currentStreak 
        : updatedGoal.currentValue;
      
      updatedGoal.milestones = updatedGoal.milestones.map(milestone => ({
        ...milestone,
        achieved: milestone.achieved || (progressValue !== undefined && progressValue >= milestone.value)
      }));
    }

    // Update goals array
    const updatedGoals = [...phase.goals];
    updatedGoals[goalIndex] = updatedGoal;

    // Update phase
    setPhases(prev =>
      prev.map(p =>
        p._id === phaseId
          ? {
              ...p,
              goals: updatedGoals,
              history: {
                ...p.history,
                versionLog: [
                  ...p.history.versionLog,
                  {
                    date: new Date().toISOString(),
                    user: 'user-123',
                    changes: { goals: { from: p.goals, to: updatedGoals } },
                    notes: 'Goal progress updated'
                  }
                ]
              }
            }
          : p
      )
    );
  };

  const lockPhase = async (phaseId: string, until?: string) => {
    if (mockHandlers.lockPhase) {
      return mockHandlers.lockPhase(phaseId, until);
    }

    // Get the phase
    const phase = phases.find(p => p._id === phaseId);
    if (!phase) return;

    // Set lock
    const untilDate = until || new Date(Date.now() + 86400000 * 7).toISOString(); // Default 7 days

    setPhases(prev =>
      prev.map(p =>
        p._id === phaseId
          ? {
              ...p,
              adminSettings: {
                ...p.adminSettings,
                lockedBy: 'user-123',
                lockedUntil: untilDate,
                auditLog: [
                  ...(p.adminSettings?.auditLog || []),
                  {
                    date: new Date().toISOString(),
                    user: 'user-123',
                    action: 'Phase locked',
                    details: `Locked until ${untilDate}`
                  }
                ]
              }
            }
          : p
      )
    );
  };

  const unlockPhase = async (phaseId: string) => {
    if (mockHandlers.unlockPhase) {
      return mockHandlers.unlockPhase(phaseId);
    }

    // Get the phase
    const phase = phases.find(p => p._id === phaseId);
    if (!phase) return;

    setPhases(prev =>
      prev.map(p =>
        p._id === phaseId
          ? {
              ...p,
              adminSettings: {
                ...p.adminSettings,
                lockedBy: undefined,
                lockedUntil: undefined,
                auditLog: [
                  ...(p.adminSettings?.auditLog || []),
                  {
                    date: new Date().toISOString(),
                    user: 'user-123',
                    action: 'Phase unlocked',
                    details: 'Phase configuration unlocked'
                  }
                ]
              }
            }
          : p
      )
    );
  };

  const detectTimelineGaps = () => {
    if (mockHandlers.detectTimelineGaps) {
      return mockHandlers.detectTimelineGaps();
    }

    const gaps = [];
    const sortedPhases = [...phases].sort((a, b) => a.phaseNumber - b.phaseNumber);

    for (let i = 0; i < sortedPhases.length - 1; i++) {
      const currentPhase = sortedPhases[i];
      const nextPhase = sortedPhases[i + 1];

      const currentEndDate = new Date(currentPhase.endDate);
      const nextStartDate = new Date(nextPhase.startDate);

      // Add one day to current end date
      const expectedNextStart = new Date(currentEndDate);
      expectedNextStart.setDate(expectedNextStart.getDate() + 1);

      // Check if there's a gap (more than 1 day difference)
      if (nextStartDate > expectedNextStart) {
        const gapDays = Math.floor((nextStartDate.getTime() - expectedNextStart.getTime()) / (1000 * 60 * 60 * 24));
        gaps.push({
          startPhase: currentPhase,
          endPhase: nextPhase,
          gapDays
        });
      }
    }

    return gaps;
  };

  const getPhaseHistory = (phaseId: string) => {
    if (mockHandlers.getPhaseHistory) {
      return mockHandlers.getPhaseHistory(phaseId);
    }

    const phase = phases.find(p => p._id === phaseId);
    return phase?.history || { versionLog: [], previousAffirmations: [] };
  };

  const archivePhaseData = async (phaseId: string) => {
    if (mockHandlers.archivePhaseData) {
      return mockHandlers.archivePhaseData(phaseId);
    }

    // This would normally call an API to archive data
    // For the mock, we'll just update the audit log
    setPhases(prev =>
      prev.map(p =>
        p._id === phaseId
          ? {
              ...p,
              adminSettings: {
                ...p.adminSettings,
                auditLog: [
                  ...(p.adminSettings?.auditLog || []),
                  {
                    date: new Date().toISOString(),
                    user: 'user-123',
                    action: 'Phase data archived',
                    details: 'All phase data archived for historical reference'
                  }
                ]
              }
            }
          : p
      )
    );
  };

  const generateComparativeReport = async (phaseIds: string[]) => {
    if (mockHandlers.generateComparativeReport) {
      return mockHandlers.generateComparativeReport(phaseIds);
    }

    // Filter phases by IDs
    const reportPhases = phases.filter(p => phaseIds.includes(p._id));

    // Generate mock report
    return {
      id: `report-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      phases: reportPhases.map(p => ({
        phaseNumber: p.phaseNumber,
        name: p.name,
        startDate: p.startDate,
        endDate: p.endDate,
        duration: Math.floor((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24)),
        goalAchievement: p.goals.filter(g => 
          (g.targetDays && g.currentStreak !== undefined && g.currentStreak >= g.targetDays) || 
          (g.targetValue && g.currentValue !== undefined && g.currentValue >= g.targetValue)
        ).length / p.goals.length,
        intensity: p.customizationSettings.intensity
      })),
      comparison: {
        timeline: {
          totalDays: reportPhases.reduce((sum, p) => 
            sum + Math.floor((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24)), 0
          )
        },
        achievements: {
          goalCompletion: reportPhases.reduce((sum, p) => 
            sum + p.goals.filter(g => 
              (g.targetDays && g.currentStreak !== undefined && g.currentStreak >= g.targetDays) || 
              (g.targetValue && g.currentValue !== undefined && g.currentValue >= g.targetValue)
            ).length, 0
          )
        }
      }
    };
  };

  return (
    <EnhancedPhaseContext.Provider
      value={{
        phases,
        loading,
        error,
        currentPhase,
        updatePhase,
        completePhase,
        transitionToNextPhase,
        updatePhaseTimeline,
        updatePhaseAffirmation,
        updatePhaseGoals,
        updateCustomizationSettings,
        updateNotificationSettings,
        addGoal,
        updateGoalProgress,
        lockPhase,
        unlockPhase,
        detectTimelineGaps,
        getPhaseHistory,
        archivePhaseData,
        generateComparativeReport,
        ...mockHandlers
      }}
    >
      {children}
    </EnhancedPhaseContext.Provider>
  );
};
