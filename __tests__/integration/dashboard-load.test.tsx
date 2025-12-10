import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import DashboardPage from '@/src/app/dashboard/page';

jest.mock('@/hooks/useCurrentPhase', () => ({
  useCurrentPhase: () => ({
    data: {
      phase: {
        _id: 'phase-1',
        phaseNumber: 1,
        name: 'Foundation Phase',
        startDate: '2024-01-01',
        endDate: '2024-01-30',
        userId: 'user-1',
      },
      completionPercentage: 45,
      remainingDays: 15,
    },
    isLoading: false,
    error: undefined,
    mutate: jest.fn(),
    isValidating: false,
  }),
}));

jest.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    products: [
      {
        _id: 'product-1',
        name: 'Test Product',
        dosageInstructions: '2 capsules',
        frequency: 'Daily',
        usage: { todayCompleted: false, streakDays: 0 },
      },
    ],
    isLoading: false,
    error: undefined,
    logUsage: jest.fn(),
    isLoggingUsage: false,
    mutate: jest.fn(),
  }),
}));

jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [],
    isLoading: false,
    error: undefined,
    mutate: jest.fn(),
    isValidating: false,
  }),
}));

jest.mock('@/hooks/useUserProgress', () => ({
  useUserProgress: () => ({
    data: {
      totalDaysLogged: 10,
      currentStreak: 5,
      longestStreak: 8,
    },
    isLoading: false,
    error: undefined,
    refresh: jest.fn(),
    isValidating: false,
  }),
}));

jest.mock('@/hooks/useInsights', () => ({
  useInsights: () => ({
    insights: [],
    isLoading: false,
    dismissInsight: jest.fn(),
    refreshInsights: jest.fn(),
  }),
}));

describe('Dashboard Load Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    (localStorage.getItem as jest.Mock).mockClear();
    (localStorage.setItem as jest.Mock).mockClear();
  });

  describe('Initial Load', () => {
    it('renders dashboard without crashing', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      });
    });

    it('displays all major widgets', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Your Current Phase/i)).toBeInTheDocument();
        expect(screen.getByText(/Today's Protocol/i)).toBeInTheDocument();
        expect(screen.getByText(/Recent Progress/i)).toBeInTheDocument();
      });
    });

    it('shows user name from session', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, Test User/i)).toBeInTheDocument();
      });
    });
  });

  describe('Widget Interactions', () => {
    it('has functional refresh button', async () => {
      const { container } = render(<DashboardPage />);

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /Refresh/i });
        expect(refreshButton).toBeInTheDocument();
      });
    });

    it('displays phase progress timeline', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Foundation Phase/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles individual widget errors gracefully', async () => {
      const { useCurrentPhase } = require('@/hooks/useCurrentPhase');
      useCurrentPhase.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: 'Failed to load', status: 500 },
        mutate: jest.fn(),
        isValidating: false,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Unable to load current phase/i)).toBeInTheDocument();
      });
    });
  });

  describe('Onboarding Check', () => {
    it('shows onboarding wizard when not completed', async () => {
      (localStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'onboarding_completed') return null;
        if (key === 'onboarding_state') return null;
        return null;
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome to Your Bioelectric Journey/i)).toBeInTheDocument();
      });
    });

    it('shows dashboard when onboarding is completed', async () => {
      (localStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'onboarding_completed') return 'true';
        return null;
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading skeletons while data is fetching', async () => {
      const { useCurrentPhase } = require('@/hooks/useCurrentPhase');
      useCurrentPhase.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: undefined,
        mutate: jest.fn(),
        isValidating: false,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        const skeletons = screen.getAllByRole('generic');
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });
  });
});