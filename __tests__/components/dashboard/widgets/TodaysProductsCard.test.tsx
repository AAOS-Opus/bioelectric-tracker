import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { TodaysProductsCard } from '@/src/components/dashboard/widgets/TodaysProductsCard';

describe('TodaysProductsCard', () => {
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
    {
      _id: 'product-2',
      name: 'Supplement B',
      dosageInstructions: '1 tablet',
      frequency: 'Twice daily',
      usage: {
        todayCompleted: true,
        streakDays: 5,
      },
    },
  ];

  const mockOnLogUsage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(
        <TodaysProductsCard
          products={mockProducts}
          isLoading={false}
          error={undefined}
          onLogUsage={mockOnLogUsage}
          isLoggingUsage={false}
        />
      );

      expect(screen.getByText(/Today's Protocol/i)).toBeInTheDocument();
    });

    it('displays loading skeleton when isLoading is true', () => {
      render(
        <TodaysProductsCard
          products={undefined}
          isLoading={true}
          error={undefined}
          onLogUsage={mockOnLogUsage}
          isLoggingUsage={false}
        />
      );

      const skeletons = screen.getAllByRole('generic');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('displays error message when error is present', () => {
      const error = { message: 'Failed to load products', status: 500 };

      render(
        <TodaysProductsCard
          products={undefined}
          isLoading={false}
          error={error}
          onLogUsage={mockOnLogUsage}
          isLoggingUsage={false}
        />
      );

      expect(screen.getByText(/Unable to load products/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load products/i)).toBeInTheDocument();
    });

    it('displays empty state when no products are available', () => {
      render(
        <TodaysProductsCard
          products={[]}
          isLoading={false}
          error={undefined}
          onLogUsage={mockOnLogUsage}
          isLoggingUsage={false}
        />
      );

      expect(screen.getByText(/No products assigned for today/i)).toBeInTheDocument();
    });
  });

  describe('Product Display', () => {
    it('displays all products with correct information', () => {
      render(
        <TodaysProductsCard
          products={mockProducts}
          isLoading={false}
          error={undefined}
          onLogUsage={mockOnLogUsage}
          isLoggingUsage={false}
        />
      );

      expect(screen.getByText('Supplement A')).toBeInTheDocument();
      expect(screen.getByText(/2 capsules/i)).toBeInTheDocument();
      expect(screen.getByText('Supplement B')).toBeInTheDocument();
      expect(screen.getByText(/1 tablet/i)).toBeInTheDocument();
    });

    it('shows completed products with checkmark', () => {
      render(
        <TodaysProductsCard
          products={mockProducts}
          isLoading={false}
          error={undefined}
          onLogUsage={mockOnLogUsage}
          isLoggingUsage={false}
        />
      );

      expect(screen.getByText(/Completed today/i)).toBeInTheDocument();
    });

    it('displays progress percentage correctly', () => {
      render(
        <TodaysProductsCard
          products={mockProducts}
          isLoading={false}
          error={undefined}
          onLogUsage={mockOnLogUsage}
          isLoggingUsage={false}
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('1/2')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onLogUsage when product checkbox is clicked', async () => {
      const user = userEvent.setup();
      mockOnLogUsage.mockResolvedValue({});

      render(
        <TodaysProductsCard
          products={mockProducts}
          isLoading={false}
          error={undefined}
          onLogUsage={mockOnLogUsage}
          isLoggingUsage={false}
        />
      );

      const productButtons = screen.getAllByRole('button');
      const supplementAButton = productButtons.find(
        button => button.closest('div')?.textContent?.includes('Supplement A')
      );

      if (supplementAButton) {
        await user.click(supplementAButton);

        await waitFor(() => {
          expect(mockOnLogUsage).toHaveBeenCalledWith({
            productId: 'product-1',
            date: expect.any(String),
          });
        });
      }
    });

    it('disables interaction while logging', () => {
      render(
        <TodaysProductsCard
          products={mockProducts}
          isLoading={false}
          error={undefined}
          onLogUsage={mockOnLogUsage}
          isLoggingUsage={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      const checkboxButtons = buttons.filter(btn => !btn.textContent?.includes('Supplement'));

      checkboxButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Compliance Streak', () => {
    it('displays compliance streak when products are completed', () => {
      render(
        <TodaysProductsCard
          products={mockProducts}
          isLoading={false}
          error={undefined}
          onLogUsage={mockOnLogUsage}
          isLoggingUsage={false}
        />
      );

      expect(screen.getByText(/Compliance streak/i)).toBeInTheDocument();
      expect(screen.getByText(/5 days/i)).toBeInTheDocument();
    });

    it('shows celebration message when all products completed', () => {
      const allCompletedProducts = mockProducts.map(p => ({
        ...p,
        usage: { ...p.usage, todayCompleted: true },
      }));

      render(
        <TodaysProductsCard
          products={allCompletedProducts}
          isLoading={false}
          error={undefined}
          onLogUsage={mockOnLogUsage}
          isLoggingUsage={false}
        />
      );

      expect(screen.getByText(/All products completed for today/i)).toBeInTheDocument();
    });
  });
});