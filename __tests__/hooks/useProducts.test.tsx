import { renderHook, waitFor } from '@testing-library/react';
import { useProducts } from '@/hooks/useProducts';

global.fetch = jest.fn();

describe('useProducts Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Data Fetching', () => {
    it('fetches products successfully in TEST_MODE', async () => {
      const mockProducts = [
        {
          _id: 'product-1',
          name: 'Test Product A',
          dosageInstructions: '2 capsules',
          frequency: 'Daily',
          usage: { todayCompleted: false, streakDays: 0 },
        },
        {
          _id: 'product-2',
          name: 'Test Product B',
          dosageInstructions: '1 tablet',
          frequency: 'Twice daily',
          usage: { todayCompleted: false, streakDays: 0 },
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: mockProducts }),
      });

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.products).toHaveLength(2);
      expect(result.current.products?.[0].name).toBe('Test Product A');
    });

    it('handles loading state correctly', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => useProducts());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.products).toBeUndefined();
    });

    it('handles errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.products).toBeUndefined();
    });
  });

  describe('Product Logging', () => {
    it('logs product usage successfully', async () => {
      const mockProducts = [
        {
          _id: 'product-1',
          name: 'Test Product',
          dosageInstructions: '2 capsules',
          frequency: 'Daily',
          usage: { todayCompleted: false, streakDays: 0 },
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ products: mockProducts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.logUsage({
        productId: 'product-1',
        date: '2024-01-01',
      });

      await waitFor(() => {
        expect(result.current.isLoggingUsage).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/product-usage'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('handles logging errors', async () => {
      const mockProducts = [
        {
          _id: 'product-1',
          name: 'Test Product',
          dosageInstructions: '2 capsules',
          frequency: 'Daily',
          usage: { todayCompleted: false, streakDays: 0 },
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ products: mockProducts }),
        })
        .mockRejectedValueOnce(new Error('Failed to log'));

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.logUsage({
          productId: 'product-1',
          date: '2024-01-01',
        })
      ).rejects.toThrow();
    });
  });

  describe('Refetch', () => {
    it('refetches data when mutate is called', async () => {
      const mockProducts = [
        {
          _id: 'product-1',
          name: 'Test Product',
          dosageInstructions: '2 capsules',
          frequency: 'Daily',
          usage: { todayCompleted: false, streakDays: 0 },
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ products: mockProducts }),
      });

      const { result } = renderHook(() => useProducts());

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
});