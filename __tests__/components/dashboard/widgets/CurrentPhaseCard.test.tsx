import { render, screen } from '@/__tests__/utils/test-utils';
import { CurrentPhaseCard } from '@/src/components/dashboard/widgets/CurrentPhaseCard';

describe('CurrentPhaseCard', () => {
  const mockPhaseData = {
    phase: {
      _id: 'phase-1',
      phaseNumber: 1,
      name: 'Foundation Phase',
      description: 'Building your foundation',
      startDate: '2024-01-01',
      endDate: '2024-01-30',
      userId: 'user-1',
    },
    completionPercentage: 45,
    remainingDays: 15,
  };

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(
        <CurrentPhaseCard
          data={mockPhaseData}
          isLoading={false}
          error={undefined}
        />
      );

      expect(screen.getByText(/Your Current Phase/i)).toBeInTheDocument();
    });

    it('displays loading skeleton when isLoading is true', () => {
      render(
        <CurrentPhaseCard
          data={undefined}
          isLoading={true}
          error={undefined}
        />
      );

      const skeletons = screen.getAllByRole('generic');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('displays error message when error is present', () => {
      const error = { message: 'Failed to load phase', status: 500 };

      render(
        <CurrentPhaseCard
          data={undefined}
          isLoading={false}
          error={error}
        />
      );

      expect(screen.getByText(/Unable to load current phase/i)).toBeInTheDocument();
    });

    it('displays empty state when no data is available', () => {
      render(
        <CurrentPhaseCard
          data={undefined}
          isLoading={false}
          error={undefined}
        />
      );

      expect(screen.getByText(/No phase data available/i)).toBeInTheDocument();
    });
  });

  describe('Phase Information', () => {
    it('displays phase number and name', () => {
      render(
        <CurrentPhaseCard
          data={mockPhaseData}
          isLoading={false}
          error={undefined}
        />
      );

      expect(screen.getByText(/Phase 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Foundation Phase/i)).toBeInTheDocument();
    });

    it('displays completion percentage', () => {
      render(
        <CurrentPhaseCard
          data={mockPhaseData}
          isLoading={false}
          error={undefined}
        />
      );

      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('displays remaining days', () => {
      render(
        <CurrentPhaseCard
          data={mockPhaseData}
          isLoading={false}
          error={undefined}
        />
      );

      expect(screen.getByText(/15 days remaining/i)).toBeInTheDocument();
    });

    it('displays "Last day!" when remainingDays is 0', () => {
      const lastDayData = { ...mockPhaseData, remainingDays: 0 };

      render(
        <CurrentPhaseCard
          data={lastDayData}
          isLoading={false}
          error={undefined}
        />
      );

      expect(screen.getByText(/Last day!/i)).toBeInTheDocument();
    });

    it('displays "Complete" when remainingDays is negative', () => {
      const completedData = { ...mockPhaseData, remainingDays: -1 };

      render(
        <CurrentPhaseCard
          data={completedData}
          isLoading={false}
          error={undefined}
        />
      );

      expect(screen.getByText(/Complete/i)).toBeInTheDocument();
    });
  });

  describe('Progress Visualization', () => {
    it('renders progress bar with correct width', () => {
      render(
        <CurrentPhaseCard
          data={mockPhaseData}
          isLoading={false}
          error={undefined}
        />
      );

      const progressBar = screen.getByRole('generic', { hidden: true });
      const progressFill = progressBar.querySelector('[style*="width"]');

      expect(progressFill).toHaveStyle({ width: '45%' });
    });

    it('handles 0% completion', () => {
      const noProgressData = { ...mockPhaseData, completionPercentage: 0 };

      render(
        <CurrentPhaseCard
          data={noProgressData}
          isLoading={false}
          error={undefined}
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles 100% completion', () => {
      const completeData = { ...mockPhaseData, completionPercentage: 100 };

      render(
        <CurrentPhaseCard
          data={completeData}
          isLoading={false}
          error={undefined}
        />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });
});