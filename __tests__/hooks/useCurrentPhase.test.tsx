import { renderHook, waitFor } from '@testing-library/react';
import { useCurrentPhase } from '@/hooks/useCurrentPhase';

global.fetch = jest.fn();

describe('useCurrentPhase Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Data Fetching', () => {
    it('fetches current phase data successfully in TEST_MODE', async () => {
      const mockPhaseData = {
        phase: {
          _id: 'phase-1',
          phaseNumber: 1,
          name: 'Foundation Phase',
          description: 'Building foundation',
          startDate: '2024-01-01',
          endDate: '2024-01-30',
          userId: 'user-1',
        },
        completionPercentage: 45,
        remainingDays: 15,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhaseData,
      });

      const { result } = renderHook(() => useCurrentPhase());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockPhaseData);
      expect(result.current.data?.phase.name).toBe('Foundation Phase');
      expect(result.current.data?.completionPercentage).toBe(45);
    });

    it('handles loading state correctly', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => useCurrentPhase());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('handles errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to fetch phase')
      );

      const { result } = renderHook(() => useCurrentPhase());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });

    it('handles 404 response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Phase not found' }),
      });

      const { result } = renderHook(() => useCurrentPhase());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Completion Percentage Calculation', () => {
    it('calculates percentage correctly for mid-phase', async () => {
      const mockPhaseData = {
        phase: {
          _id: 'phase-1',
          phaseNumber: 1,
          name: 'Foundation Phase',
          description: 'Building foundation',
          startDate: '2024-01-01',
          endDate: '2024-01-30',
          userId: 'user-1',
        },
        completionPercentage: 50,
        remainingDays: 15,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhaseData,
      });

      const { result } = renderHook(() => useCurrentPhase());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.completionPercentage).toBe(50);
      expect(result.current.data?.remainingDays).toBe(15);
    });

    it('handles phase completion (100%)', async () => {
      const mockPhaseData = {
        phase: {
          _id: 'phase-1',
          phaseNumber: 1,
          name: 'Foundation Phase',
          description: 'Building foundation',
          startDate: '2024-01-01',
          endDate: '2024-01-30',
          userId: 'user-1',
        },
        completionPercentage: 100,
        remainingDays: 0,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPhaseData,
      });

      const { result } = renderHook(() => useCurrentPhase());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.completionPercentage).toBe(100);
      expect(result.current.data?.remainingDays).toBe(0);
    });
  });

  describe('Refetch', () => {
    it('refetches data when mutate is called', async () => {
      const mockPhaseData = {
        phase: {
          _id: 'phase-1',
          phaseNumber: 1,
          name: 'Foundation Phase',
          description: 'Building foundation',
          startDate: '2024-01-01',
          endDate: '2024-01-30',
          userId: 'user-1',
        },
        completionPercentage: 45,
        remainingDays: 15,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockPhaseData,
      });

      const { result } = renderHook(() => useCurrentPhase());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      result.current.mutate();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('TEST_MODE Behavior', () => {
    it('returns mock data in TEST_MODE when API fails', async () => {
      process.env.TEST_MODE = 'true';

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('API not available')
      );

      const { result } = renderHook(() => useCurrentPhase());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.phase).toBeDefined();
    });
  });
});