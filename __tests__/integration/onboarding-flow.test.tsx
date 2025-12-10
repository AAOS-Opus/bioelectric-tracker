import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

describe('Onboarding Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    (localStorage.getItem as jest.Mock).mockClear();
    (localStorage.setItem as jest.Mock).mockClear();
    jest.clearAllMocks();

    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  it('completes full onboarding flow and redirects to dashboard', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);

    expect(screen.getByText(/Welcome to Your Bioelectric Journey/i)).toBeInTheDocument();

    const getStartedButton = screen.getByRole('button', { name: /Get Started/i });
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByText(/What brings you here today/i)).toBeInTheDocument();
    });

    const detoxGoal = screen.getByLabelText(/Detoxification Support/i);
    await user.click(detoxGoal);

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton).toBeEnabled();
    });

    let nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Choose Your Starting Phase/i)).toBeInTheDocument();
    });

    const phase1 = screen.getByText(/Phase 1:/i);
    await user.click(phase1.closest('div')!);

    await waitFor(() => {
      nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton).toBeEnabled();
    });

    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Select Your Products/i)).toBeInTheDocument();
    });

    const skipButton = screen.getByRole('button', { name: /Skip for now/i });
    await user.click(skipButton);

    await waitFor(() => {
      expect(screen.getByText(/Set Up Reminders/i)).toBeInTheDocument();
    });

    const completeButton = screen.getByRole('button', { name: /Complete Setup/i });
    await user.click(completeButton);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('onboarding_completed', 'true');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'onboarding_state',
        expect.stringContaining('"completed":true')
      );
      expect(window.location.href).toBe('/dashboard');
    }, { timeout: 3000 });
  });

  it('validates each step before allowing progression', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);

    const getStartedButton = screen.getByRole('button', { name: /Get Started/i });
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByText(/What brings you here today/i)).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /Next/i });
    expect(nextButton).toBeDisabled();

    const detoxGoal = screen.getByLabelText(/Detoxification Support/i);
    await user.click(detoxGoal);

    await waitFor(() => {
      expect(nextButton).toBeEnabled();
    });
  });

  it('persists progress across steps', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);

    const getStartedButton = screen.getByRole('button', { name: /Get Started/i });
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByText(/What brings you here today/i)).toBeInTheDocument();
    });

    const detoxGoal = screen.getByLabelText(/Detoxification Support/i);
    await user.click(detoxGoal);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'onboarding_state',
        expect.stringContaining('"primaryGoal":"detox"')
      );
    });
  });

  it('allows going back without losing data', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);

    const getStartedButton = screen.getByRole('button', { name: /Get Started/i });
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByText(/What brings you here today/i)).toBeInTheDocument();
    });

    const detoxGoal = screen.getByLabelText(/Detoxification Support/i);
    await user.click(detoxGoal);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Choose Your Starting Phase/i)).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /Back/i });
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByText(/What brings you here today/i)).toBeInTheDocument();
      const detoxGoalChecked = screen.getByLabelText(/Detoxification Support/i);
      expect(detoxGoalChecked).toBeChecked();
    });
  });

  it('stores complete onboarding state structure', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);

    const getStartedButton = screen.getByRole('button', { name: /Get Started/i });
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByText(/What brings you here today/i)).toBeInTheDocument();
    });

    const detoxGoal = screen.getByLabelText(/Detoxification Support/i);
    await user.click(detoxGoal);

    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    await waitFor(() => {
      const calls = (localStorage.setItem as jest.Mock).mock.calls;
      const onboardingStateCalls = calls.filter(call => call[0] === 'onboarding_state');

      expect(onboardingStateCalls.length).toBeGreaterThan(0);

      const lastState = JSON.parse(onboardingStateCalls[onboardingStateCalls.length - 1][1]);
      expect(lastState).toHaveProperty('currentStep');
      expect(lastState).toHaveProperty('primaryGoal');
      expect(lastState.primaryGoal).toBe('detox');
    });
  });
});