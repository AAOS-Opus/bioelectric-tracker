const mockUpdatePhaseProgress = jest.fn();

export const usePhaseProgress = () => ({
  updateProgress: mockUpdatePhaseProgress,
  progress: 0.5,
  currentPhase: null,
  loading: false,
  error: null,
  refreshPhaseData: jest.fn()
});

export default {
  usePhaseProgress
};
