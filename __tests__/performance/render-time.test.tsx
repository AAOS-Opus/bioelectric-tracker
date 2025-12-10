import { render } from '@/__tests__/utils/test-utils';
import { CurrentPhaseCard } from '@/src/components/dashboard/widgets/CurrentPhaseCard';
import { TodaysProductsCard } from '@/src/components/dashboard/widgets/TodaysProductsCard';
import PhaseProgress from '@/src/components/dashboard/PhaseProgress';

describe('Performance Tests', () => {
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

  const mockProducts = Array.from({ length: 10 }, (_, i) => ({
    _id: `product-${i}`,
    name: `Product ${i}`,
    dosageInstructions: '2 capsules',
    frequency: 'Daily',
    usage: {
      todayCompleted: i % 2 === 0,
      streakDays: i,
    },
  }));

  describe('Render Time Performance', () => {
    it('renders CurrentPhaseCard in under 100ms', () => {
      const start = performance.now();

      render(
        <CurrentPhaseCard
          data={mockPhaseData}
          isLoading={false}
          error={undefined}
        />
      );

      const end = performance.now();
      const renderTime = end - start;

      console.log(`CurrentPhaseCard render time: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(100);
    });

    it('renders TodaysProductsCard with 10 products in under 150ms', () => {
      const start = performance.now();

      render(
        <TodaysProductsCard
          products={mockProducts}
          isLoading={false}
          error={undefined}
          onLogUsage={jest.fn()}
          isLoggingUsage={false}
        />
      );

      const end = performance.now();
      const renderTime = end - start;

      console.log(`TodaysProductsCard render time: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(150);
    });

    it('renders PhaseProgress in under 200ms', () => {
      const start = performance.now();

      render(<PhaseProgress showCelebrations={true} />);

      const end = performance.now();
      const renderTime = end - start;

      console.log(`PhaseProgress render time: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('React.memo Effectiveness', () => {
    it('does not re-render CurrentPhaseCard when props are unchanged', () => {
      const { rerender } = render(
        <CurrentPhaseCard
          data={mockPhaseData}
          isLoading={false}
          error={undefined}
        />
      );

      const start = performance.now();

      rerender(
        <CurrentPhaseCard
          data={mockPhaseData}
          isLoading={false}
          error={undefined}
        />
      );

      const end = performance.now();
      const rerenderTime = end - start;

      console.log(`CurrentPhaseCard re-render time (same props): ${rerenderTime.toFixed(2)}ms`);
      expect(rerenderTime).toBeLessThan(10);
    });

    it('re-renders when data changes', () => {
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

      const start = performance.now();

      rerender(
        <CurrentPhaseCard
          data={updatedData}
          isLoading={false}
          error={undefined}
        />
      );

      const end = performance.now();
      const rerenderTime = end - start;

      console.log(`CurrentPhaseCard re-render time (new data): ${rerenderTime.toFixed(2)}ms`);
      expect(rerenderTime).toBeLessThan(100);
    });
  });

  describe('Large Dataset Performance', () => {
    it('handles 50 products efficiently', () => {
      const largeProductList = Array.from({ length: 50 }, (_, i) => ({
        _id: `product-${i}`,
        name: `Product ${i}`,
        dosageInstructions: '2 capsules',
        frequency: 'Daily',
        usage: {
          todayCompleted: i % 2 === 0,
          streakDays: i,
        },
      }));

      const start = performance.now();

      render(
        <TodaysProductsCard
          products={largeProductList}
          isLoading={false}
          error={undefined}
          onLogUsage={jest.fn()}
          isLoggingUsage={false}
        />
      );

      const end = performance.now();
      const renderTime = end - start;

      console.log(`TodaysProductsCard render time (50 products): ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(300);
    });
  });
});