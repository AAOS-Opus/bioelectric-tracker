// Type declarations for PhaseProgressContext
declare module '../../../contexts/PhaseProgressContext' {
  export interface Phase {
    _id: string;
    phaseNumber: number;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    affirmation: string;
    completionPercentage: number;
  }

  export interface PhaseProgressContextType {
    currentPhase: Phase | null;
    progress: number;
    updateProgress: (newProgress: number) => void;
    loading: boolean;
    error: string | null;
    refreshPhaseData: () => Promise<void>;
  }

  export const usePhaseProgress: () => PhaseProgressContextType;
  export const PhaseProgressProvider: React.FC<{
    children: React.ReactNode;
  }>;
}
