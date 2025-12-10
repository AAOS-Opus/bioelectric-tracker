/**
 * @jest-environment jsdom
 */

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import { useSession } from 'next-auth/react';
import '@testing-library/jest-dom';
import ProductTrackingPanel from '../ProductTrackingPanel';

// Use explicit any casting for window.trackEvent to fix TypeScript errors
(window as any).trackEvent = jest.fn();

// Mock the next-auth useSession hook
jest.mock('next-auth/react');

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock date for consistent timestamp testing
const mockDate = new Date('2025-03-22T19:30:00Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

// Define interfaces for our test data
interface Product {
  _id: string;
  name: string;
  category: 'Supplement' | 'Device' | 'Protocol' | 'Remedy';
  description: string;
  dosage: string;
  frequency: string;
  phaseNumbers: number[];
  priority: 'high' | 'medium' | 'low';
  scheduledTime?: string; // ISO 8601 format
  createdAt: string;
  updatedAt: string;
}

interface ProductUsage {
  _id: string;
  userId: string;
  productId: string;
  date: string; // YYYY-MM-DD
  status: 'taken' | 'missed' | 'scheduled';
  timestamp?: string; // ISO 8601 format when taken
  createdAt: string;
  updatedAt: string;
}

// Mock data for products in different phases
const mockProducts: Product[] = [
  // Phase 1 Products
  {
    _id: 'product1',
    name: 'Cellular Detox',
    category: 'Supplement',
    description: 'Supports cellular detoxification pathways',
    dosage: '2 capsules',
    frequency: 'twice daily',
    phaseNumbers: [1],
    priority: 'high',
    scheduledTime: '2025-03-22T08:00:00Z',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'product2',
    name: 'Liver Support Formula',
    category: 'Supplement',
    description: 'Supports liver detoxification',
    dosage: '1 capsule',
    frequency: 'daily',
    phaseNumbers: [1],
    priority: 'high',
    scheduledTime: '2025-03-22T12:00:00Z',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'product3',
    name: 'Scalar Energy Device',
    category: 'Device',
    description: 'Scalar wave energy therapy device',
    dosage: '30 minutes',
    frequency: 'daily',
    phaseNumbers: [1, 2, 3, 4, 5],
    priority: 'medium',
    scheduledTime: '2025-03-22T18:00:00Z',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Phase 2 Products
  {
    _id: 'product4',
    name: 'Mitochondrial Support',
    category: 'Supplement',
    description: 'Enhances cellular energy production',
    dosage: '2 capsules',
    frequency: 'twice daily',
    phaseNumbers: [2],
    priority: 'high',
    scheduledTime: '2025-03-22T08:00:00Z',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'product5',
    name: 'CoQ10 Complex',
    category: 'Supplement',
    description: 'Supports electron transport chain',
    dosage: '1 capsule',
    frequency: 'daily',
    phaseNumbers: [2, 3],
    priority: 'medium',
    scheduledTime: '2025-03-22T12:00:00Z',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Phase 3 Products
  {
    _id: 'product6',
    name: 'Cellular Regeneration Complex',
    category: 'Supplement',
    description: 'Supports tissue regeneration',
    dosage: '2 capsules',
    frequency: 'twice daily',
    phaseNumbers: [3],
    priority: 'high',
    scheduledTime: '2025-03-22T08:00:00Z',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Phase 4 Products
  {
    _id: 'product7',
    name: 'Integration Formula',
    category: 'Supplement',
    description: 'Supports cellular integration of new patterns',
    dosage: '1 capsule',
    frequency: 'daily',
    phaseNumbers: [4],
    priority: 'high',
    scheduledTime: '2025-03-22T08:00:00Z',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Phase 5 Products
  {
    _id: 'product8',
    name: 'Maintenance Support',
    category: 'Supplement',
    description: 'Supports long-term health maintenance',
    dosage: '1 capsule',
    frequency: 'daily',
    phaseNumbers: [5],
    priority: 'medium',
    scheduledTime: '2025-03-22T08:00:00Z',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock data for product usage
const mockProductUsage: ProductUsage[] = [
  {
    _id: 'usage1',
    userId: 'user123',
    productId: 'product1',
    date: '2025-03-22',
    status: 'taken',
    timestamp: '2025-03-22T08:15:00Z',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'usage2',
    userId: 'user123',
    productId: 'product2',
    date: '2025-03-22',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'usage3',
    userId: 'user123',
    productId: 'product3',
    date: '2025-03-22',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Setup MSW server for API mocking
const server = setupServer(
  // Get products
  http.get('/api/products', () => {
    return HttpResponse.json(mockProducts);
  }),
  
  // Get product usage for user
  http.get('/api/product-usage', () => {
    return HttpResponse.json(mockProductUsage);
  }),
  
  // Update product usage status
  http.put('/api/product-usage/:usageId', async ({ params, request }) => {
    const { usageId } = params;
    const { status, timestamp } = await request.json() as { status: 'taken' | 'missed' | 'scheduled', timestamp?: string };
    
    // Update usage in our mock data
    const updatedUsage = mockProductUsage.map(usage => 
      usage._id === usageId 
        ? { 
            ...usage, 
            status, 
            timestamp: status === 'taken' ? timestamp : undefined,
            updatedAt: new Date().toISOString()
          } 
        : usage
    );
    
    // Find the updated item
    const updatedItem = updatedUsage.find(u => u._id === usageId);
    
    // You can simulate network delay here
    // await delay(300);
    
    return HttpResponse.json({ 
      success: true, 
      data: updatedItem
    });
  }),
  
  // Create new product usage entry
  http.post('/api/product-usage', async ({ request }) => {
    const data = await request.json() as Omit<ProductUsage, '_id' | 'createdAt' | 'updatedAt'>;
    
    const newUsage: ProductUsage = {
      _id: `usage${mockProductUsage.length + 1}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to our mock data
    mockProductUsage.push(newUsage);
    
    return HttpResponse.json({
      success: true,
      data: newUsage
    });
  })
);

describe('Product Tracking Panel Component', () => {
  // Setup before tests
  beforeAll(() => {
    server.listen();
  });
  
  // Reset after each test
  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
    localStorage.clear();
  });
  
  // Clean up after all tests
  afterAll(() => {
    server.close();
    jest.restoreAllMocks();
  });
  
  // Mock session for a user in a specific phase
  const mockSessionForPhase = (phaseNumber: number) => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          currentPhaseNumber: phaseNumber
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      status: 'authenticated'
    });
  };

  // 1. Product Display and Filtering Tests
  describe('Product Display and Filtering Tests', () => {
    test('displays only products for the current phase', async () => {
      // Setup user in phase 1
      mockSessionForPhase(1);
      
      // Render component
      render(<ProductTrackingPanel />);
      
      // Wait for products to load
      await waitFor(() => {
        // Phase 1 products should be visible
        (expect(screen.getByText('Cellular Detox')) as any).toBeInTheDocument();
        (expect(screen.getByText('Liver Support Formula')) as any).toBeInTheDocument();
        (expect(screen.getByText('Scalar Energy Device')) as any).toBeInTheDocument();
        
        // Phase 2 products should not be visible
        (expect(screen.queryByText('Mitochondrial Support')) as any).not.toBeInTheDocument();
      });
    });
    
    test('groups products by category', async () => {
      mockSessionForPhase(1);
      render(<ProductTrackingPanel />);
      
      await waitFor(() => {
        // Check for category headings
        (expect(screen.getByText('Supplements')) as any).toBeInTheDocument();
        (expect(screen.getByText('Devices')) as any).toBeInTheDocument();
      });
      
      // Check that products are under correct categories
      const supplementsSection = screen.getByText('Supplements').closest('section');
      const devicesSection = screen.getByText('Devices').closest('section');
      
      if (supplementsSection) {
        (expect(within(supplementsSection).getByText('Cellular Detox')) as any).toBeInTheDocument();
        (expect(within(supplementsSection).getByText('Liver Support Formula')) as any).toBeInTheDocument();
      }
      
      if (devicesSection) {
        (expect(within(devicesSection).getByText('Scalar Energy Device')) as any).toBeInTheDocument();
      }
    });
    
    test('sorts products by scheduled time and priority', async () => {
      mockSessionForPhase(1);
      render(<ProductTrackingPanel />);
      
      await waitFor(() => {
        const productItems = screen.getAllByTestId('product-card');
        
        // Check that products are in the expected order
        (expect(within(productItems[0]).getByText('Cellular Detox')) as any).toBeInTheDocument(); // First due to 8AM & high priority
        (expect(within(productItems[1]).getByText('Liver Support Formula')) as any).toBeInTheDocument(); // Second due to 12PM & high priority
        (expect(within(productItems[2]).getByText('Scalar Energy Device')) as any).toBeInTheDocument(); // Last due to 6PM & medium priority
      });
    });
  });

  // 2. Status Update Workflow Tests
  describe('Status Update Workflow Tests', () => {
    test('updates product status when taken button is clicked', async () => {
      mockSessionForPhase(1);
      const user = userEvent.setup();
      
      render(<ProductTrackingPanel />);
      
      // Wait for component to load
      await waitFor(() => {
        (expect(screen.getByText('Liver Support Formula')) as any).toBeInTheDocument();
      });
      
      // Find the "Liver Support Formula" product (which is scheduled, not taken)
      const liverSupportCard = screen.getByText('Liver Support Formula').closest('[data-testid="product-card"]');
      
      // Click the "Taken" button
      const takenButton = within(liverSupportCard as HTMLElement).getByRole('button', { name: /taken/i });
      await user.click(takenButton);
      
      // Optimistic UI should update immediately
      (expect(within(liverSupportCard as HTMLElement).getByText(/taken/i)) as any).toBeInTheDocument();
      
      // Wait for API call to complete and verify persisted state
      await waitFor(() => {
        (expect(within(liverSupportCard as HTMLElement).getByText(/taken/i)) as any).toBeInTheDocument();
        // Verify that analytics event was tracked
        (expect(window.trackEvent) as any).toHaveBeenCalledWith(
          'product_taken',
          expect.objectContaining({ productId: 'product2' })
        );
      });
    });
    
    test('handles API errors when updating status', async () => {
      mockSessionForPhase(1);
      const user = userEvent.setup();
      
      // Override the default handler to simulate an error
      server.use(
        http.put('/api/product-usage/:usageId', async () => {
          await delay(100);
          return new HttpResponse(null, { status: 500 });
        })
      );
      
      render(<ProductTrackingPanel />);
      
      // Wait for component to load
      await waitFor(() => {
        (expect(screen.getByText('Liver Support Formula')) as any).toBeInTheDocument();
      });
      
      // Find the "Liver Support Formula" product
      const liverSupportCard = screen.getByText('Liver Support Formula').closest('[data-testid="product-card"]');
      
      // Click the "Taken" button
      const takenButton = within(liverSupportCard as HTMLElement).getByRole('button', { name: /taken/i });
      await user.click(takenButton);
      
      // Wait for error message to appear
      await waitFor(() => {
        (expect(screen.getByText(/unable to update status/i)) as any).toBeInTheDocument();
        
        // Check for retry button
        (expect(screen.getByRole('button', { name: /retry/i })) as any).toBeInTheDocument();
      });
      
      // Status should revert to original after error
      (expect(within(liverSupportCard as HTMLElement).getByText(/scheduled/i)) as any).toBeInTheDocument();
    });
  });

  // 3. Real-Time Sync & Cross-Device Consistency
  describe('Real-Time Sync Tests', () => {
    test('updates product status when data changes remotely', async () => {
      mockSessionForPhase(1);
      
      render(<ProductTrackingPanel />);
      
      // Wait for initial load
      await waitFor(() => {
        (expect(screen.getByText('Cellular Detox')) as any).toBeInTheDocument();
      });
      
      // Simulate a remote update (another device marked product as taken)
      const updatedUsage = [...mockProductUsage];
      const index = updatedUsage.findIndex(u => u.productId === 'product2');
      updatedUsage[index] = {
        ...updatedUsage[index],
        status: 'taken',
        timestamp: new Date().toISOString()
      };
      
      // Update the mock server data
      server.use(
        http.get('/api/product-usage', () => {
          return HttpResponse.json(updatedUsage);
        })
      );
      
      // Trigger a refresh (this would normally be done by polling or WebSocket)
      fireEvent(window, new Event('refresh-product-data'));
      
      // Check that the UI reflects the remote change
      await waitFor(() => {
        const liverSupportCard = screen.getByText('Liver Support Formula').closest('[data-testid="product-card"]');
        (expect(within(liverSupportCard as HTMLElement).getByText(/taken/i)) as any).toBeInTheDocument();
      });
    });
  });

  // 4. Responsive & Interaction Tests
  describe('Responsive Design Tests', () => {
    const deviceSizes = [
      ['mobile', 375],
      ['tablet', 768],
      ['desktop', 1024]
    ] as const;
    
    deviceSizes.forEach(([device, width]) => {
      test(`renders correctly on ${device} screens`, async () => {
        // Mock window.matchMedia to simulate screen width
        window.matchMedia = jest.fn().mockImplementation((query: string) => {
          const widthMatch = query.match(/\(min-width: (\d+)px\)/);
          const widthValue = widthMatch ? parseInt(widthMatch[1]) : 0;
          
          return {
            matches: width >= widthValue,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
          };
        });
        
        // Set viewport width
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        
        mockSessionForPhase(1);
        render(<ProductTrackingPanel />);
        
        // Wait for component to load
        await waitFor(() => {
          (expect(screen.getByText(/My Products/i)) as any).toBeInTheDocument();
        });
        
        // Check for expected layout classes based on screen size
        const container = screen.getByTestId('product-tracking-panel');
        
        if (width < 768) {
          (expect(container) as any).toHaveClass('mobile-view');
        } else if (width >= 768 && width < 1024) {
          (expect(container) as any).toHaveClass('tablet-view');
        } else {
          (expect(container) as any).toHaveClass('desktop-view');
        }
      });
    });
  });

  // 5. Edge Case Scenarios
  describe('Edge Case Scenarios', () => {
    test('displays empty state message when no products exist', async () => {
      mockSessionForPhase(5); // Use a phase with fewer products
      
      // Override API to return empty arrays
      server.use(
        http.get('/api/products', () => {
          return HttpResponse.json([]);
        }),
        http.get('/api/product-usage', () => {
          return HttpResponse.json([]);
        })
      );
      
      render(<ProductTrackingPanel />);
      
      // Check for empty state message
      await waitFor(() => {
        (expect(screen.getByText(/no products for this phase/i)) as any).toBeInTheDocument();
      });
    });
    
    test('highlights overdue products', async () => {
      mockSessionForPhase(1);
      
      // Create an overdue product
      const overdueProducts = [...mockProducts];
      const index = overdueProducts.findIndex(p => p._id === 'product1');
      
      // Set scheduled time to 2 hours ago
      const twoHoursAgo = new Date(mockDate);
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      
      overdueProducts[index] = {
        ...overdueProducts[index],
        scheduledTime: twoHoursAgo.toISOString()
      };
      
      // Update mock server data
      server.use(
        http.get('/api/products', () => {
          return HttpResponse.json(overdueProducts);
        })
      );
      
      render(<ProductTrackingPanel />);
      
      // Check that overdue product has the appropriate class and icon
      await waitFor(() => {
        const productCard = screen.getByText('Cellular Detox').closest('[data-testid="product-card"]');
        (expect(productCard) as any).toHaveClass('overdue');
        
        // Check for overdue icon
        const overdueIcon = within(productCard as HTMLElement).getByTestId('overdue-indicator');
        (expect(overdueIcon) as any).toBeInTheDocument();
      });
    });
  });

  // 6. Accessibility Compliance
  describe('Accessibility Compliance Tests', () => {
    test('has proper semantic structure and ARIA attributes', async () => {
      mockSessionForPhase(1);
      
      const { container } = render(<ProductTrackingPanel />);
      
      await waitFor(() => {
        (expect(screen.getByText(/My Products/i)) as any).toBeInTheDocument();
      });
      
      // Check heading structure
      const heading = screen.getByRole('heading', { level: 2, name: /My Products/i });
      (expect(heading) as any).toBeInTheDocument();
      
      // Check that product cards have appropriate ARIA roles
      const productCards = screen.getAllByTestId('product-card');
      productCards.forEach(card => {
        (expect(card) as any).toHaveAttribute('role', 'region');
      });
      
      // Check that buttons have appropriate ARIA attributes
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        if (button.getAttribute('aria-pressed') !== null) {
          (expect(button.getAttribute('aria-pressed')).to.match(/true|false/) as any);
        }
      });
      
      // Check for live regions for dynamic updates
      const liveRegion = container.querySelector('[aria-live]');
      (expect(liveRegion) as any).toBeInTheDocument();
    });
  });

  // 7. Integration & Analytics Validation
  describe('Analytics and Integration Tests', () => {
    test('tracks product view events', async () => {
      mockSessionForPhase(1);
      
      render(<ProductTrackingPanel />);
      
      await waitFor(() => {
        (expect(screen.getByText('Cellular Detox')) as any).toBeInTheDocument();
        
        // Check that product view analytics were fired
        (expect(window.trackEvent) as any).toHaveBeenCalledWith(
          'product_view',
          expect.objectContaining({
            productCount: expect.any(Number),
            phaseNumber: 1
          })
        );
      });
    });
    
    test('tracks status change events', async () => {
      mockSessionForPhase(1);
      const user = userEvent.setup();
      
      render(<ProductTrackingPanel />);
      
      await waitFor(() => {
        (expect(screen.getByText('Liver Support Formula')) as any).toBeInTheDocument();
      });
      
      // Find and click the "Taken" button
      const liverSupportCard = screen.getByText('Liver Support Formula').closest('[data-testid="product-card"]');
      const takenButton = within(liverSupportCard as HTMLElement).getByRole('button', { name: /taken/i });
      await user.click(takenButton);
      
      // Check that analytics event was tracked
      await waitFor(() => {
        (expect(window.trackEvent) as any).toHaveBeenCalledWith(
          'product_taken',
          expect.objectContaining({
            productId: 'product2',
            productName: 'Liver Support Formula',
            phaseNumber: 1,
            timestamp: expect.any(String)
          })
        );
      });
    });
  });
});
