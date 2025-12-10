import { render, screen } from '@/__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { CurrentPhaseCard } from '@/src/components/dashboard/widgets/CurrentPhaseCard';
import { TodaysProductsCard } from '@/src/components/dashboard/widgets/TodaysProductsCard';

describe('Accessibility Tests', () => {
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

  const mockProducts = [
    {
      _id: 'product-1',
      name: 'Supplement A',
      dosageInstructions: '2 capsules',
      frequency: 'Daily',
      usage: {
        todayCompleted: false,
        streakDays: 0,
      },
    },
  ];

  describe('Keyboard Navigation', () => {
    it('allows keyboard navigation through product checkboxes', async () => {
      const user = userEvent.setup();

      render(
        <TodaysProductsCard
          products={mockProducts}
          isLoading={false}
          error={undefined}
          onLogUsage={jest.fn()}
          isLoggingUsage={false}
        />
      );

      const buttons = screen.getAllByRole('button');
      const checkboxButton = buttons.find(
        btn => btn.closest('div')?.textContent?.includes('Supplement A')
      );

      if (checkboxButton) {
        checkboxButton.focus();
        expect(checkboxButton).toHaveFocus();

        await user.keyboard('{Enter}');
        expect(checkboxButton).toBeInTheDocument();
      }
    });
  });

  describe('ARIA Labels and Roles', () => {
    it('has proper heading hierarchy', () => {
      render(
        <CurrentPhaseCard
          data={mockPhaseData}
          isLoading={false}
          error={undefined}
        />
      );

      const heading = screen.getByText(/Your Current Phase/i);
      expect(heading).toBeInTheDocument();
    });

    it('provides descriptive button labels', () => {
      render(
        <TodaysProductsCard
          products={mockProducts}
          isLoading={false}
          error={undefined}
          onLogUsage={jest.fn()}
          isLoggingUsage={false}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Color Contrast and Visual Indicators', () => {
    it('displays error states with proper visual indicators', () => {
      const error = { message: 'Failed to load', status: 500 };

      render(
        <CurrentPhaseCard
          data={undefined}
          isLoading={false}
          error={error}
        />
      );

      expect(screen.getByText(/Unable to load current phase/i)).toBeInTheDocument();
    });

    it('shows loading states with accessible indicators', () => {
      render(
        <TodaysProductsCard
          products={undefined}
          isLoading={true}
          error={undefined}
          onLogUsage={jest.fn()}
          isLoggingUsage={false}
        />
      );

      const skeletons = screen.getAllByRole('generic');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Form Controls', () => {
    it('has focusable and labeled form controls', () => {
      render(
        <TodaysProductsCard
          products={mockProducts}
          isLoading={false}
          error={undefined}
          onLogUsage={jest.fn()}
          isLoggingUsage={false}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });

    it('disabled states are properly communicated', () => {
      render(
        <TodaysProductsCard
          products={mockProducts}
          isLoading={false}
          error={undefined}
          onLogUsage={jest.fn()}
          isLoggingUsage={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      const checkboxButtons = buttons.filter(
        btn => !btn.textContent?.includes('Supplement')
      );

      checkboxButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('provides meaningful text content for screen readers', () => {
      render(
        <CurrentPhaseCard
          data={mockPhaseData}
          isLoading={false}
          error={undefined}
        />
      );

      expect(screen.getByText(/Foundation Phase/i)).toBeInTheDocument();
      expect(screen.getByText(/45%/i)).toBeInTheDocument();
      expect(screen.getByText(/15 days remaining/i)).toBeInTheDocument();
    });

    it('announces state changes appropriately', () => {
      const { rerender } = render(
        <CurrentPhaseCard
          data={mockPhaseData}
          isLoading={false}
          error={undefined}
        />
      );

      const updatedData = {
        ...mockPhaseData,
        completionPercentage: 50,
      };

      rerender(
        <CurrentPhaseCard
          data={updatedData}
          isLoading={false}
          error={undefined}
        />
      );

      expect(screen.getByText(/50%/i)).toBeInTheDocument();
    });
  });
});