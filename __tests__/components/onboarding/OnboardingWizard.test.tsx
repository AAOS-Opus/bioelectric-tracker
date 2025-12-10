import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

describe('OnboardingWizard', () => {
  beforeEach(() => {
    localStorage.clear();
    (localStorage.getItem as jest.Mock).mockClear();
    (localStorage.setItem as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<OnboardingWizard />);
      expect(screen.getByText(/Welcome to Your Bioelectric Journey/i)).toBeInTheDocument();
    });

    it('shows the first step (Welcome) on initial render', () => {
      render(<OnboardingWizard />);
      expect(screen.getByText(/Welcome to Your Bioelectric Journey/i)).toBeInTheDocument();
      expect(screen.getByText(/Begin Your Personalized Wellness Path/i)).toBeInTheDocument();
    });

    it('displays progress indicator showing step 1 of 5', () => {
      render(<OnboardingWizard />);
      expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to goal selection when "Get Started" is clicked', async () => {
      const user = userEvent.setup();
      render(<OnboardingWizard />);

      const getStartedButton = screen.getByRole('button', { name: /Get Started/i });
      await user.click(getStartedButton);

      await waitFor(() => {
        expect(screen.getByText(/What brings you here today/i)).toBeInTheDocument();
      });
    });

    it('allows navigating back to previous step', async () => {
      const user = userEvent.setup();
      render(<OnboardingWizard />);

      const getStartedButton = screen.getByRole('button', { name: /Get Started/i });
      await user.click(getStartedButton);

      await waitFor(() => {
        expect(screen.getByText(/What brings you here today/i)).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /Back/i });
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getByText(/Welcome to Your Bioelectric Journey/i)).toBeInTheDocument();
      });
    });
  });

  describe('State Persistence', () => {
    it('saves state to localStorage when progressing through steps', async () => {
      const user = userEvent.setup();
      render(<OnboardingWizard />);

      const getStartedButton = screen.getByRole('button', { name: /Get Started/i });
      await user.click(getStartedButton);

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'onboarding_state',
          expect.stringContaining('currentStep')
        );
      });
    });

    it('restores state from localStorage on mount', () => {
      const savedState = {
        currentStep: 2,
        primaryGoal: 'detox',
        completed: false,
      };

      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(savedState));

      render(<OnboardingWizard />);

      expect(localStorage.getItem).toHaveBeenCalledWith('onboarding_state');
    });
  });

  describe('Validation', () => {
    it('prevents navigation without selecting a goal', async () => {
      const user = userEvent.setup();
      render(<OnboardingWizard />);

      const getStartedButton = screen.getByRole('button', { name: /Get Started/i });
      await user.click(getStartedButton);

      await waitFor(() => {
        expect(screen.getByText(/What brings you here today/i)).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton).toBeDisabled();
    });

    it('enables next button after selecting a goal', async () => {
      const user = userEvent.setup();
      render(<OnboardingWizard />);

      const getStartedButton = screen.getByRole('button', { name: /Get Started/i });
      await user.click(getStartedButton);

      await waitFor(() => {
        expect(screen.getByText(/What brings you here today/i)).toBeInTheDocument();
      });

      const detoxOption = screen.getByLabelText(/Detoxification Support/i);
      await user.click(detoxOption);

      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton).toBeEnabled();
    });
  });

  describe('Completion', () => {
    it('marks onboarding as completed and redirects on final step', async () => {
      const user = userEvent.setup();

      const savedState = {
        currentStep: 4,
        primaryGoal: 'detox',
        selectedPhase: 1,
        selectedProducts: ['product1'],
        reminderTime: '09:00',
        reminderEnabled: true,
        completed: false,
      };

      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(savedState));

      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<OnboardingWizard />);

      const completeButton = screen.getByRole('button', { name: /Complete Setup/i });
      await user.click(completeButton);

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('onboarding_completed', 'true');
        expect(window.location.href).toBe('/dashboard');
      });
    });
  });
});