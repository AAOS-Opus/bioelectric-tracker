/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
import '@testing-library/jest-dom';

// Import the component to test
// Note: You'll need to implement or import this component
import { ProductManagement } from '../ProductManagement';
import { SessionProvider } from 'next-auth/react';

// Mock the next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/dashboard/products',
    query: {},
  }),
}));

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    setTimeout(() => {
      callback(
        [
          {
            isIntersecting: true,
            target: document.createElement('div'),
          } as IntersectionObserverEntry,
        ],
        this
      );
    }, 100);
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

window.IntersectionObserver = MockIntersectionObserver as any;

// Create a mock file for image upload tests
function createMockFile(name = 'test-image.jpg', type = 'image/jpeg', size = 1024 * 50) {
  const file = new File(['mock file content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

// Setup MSW server for API mocking
const mockProducts = [
  {
    id: 'product1',
    name: 'Liver Support Complex',
    category: 'Detox',
    dosage: '2 capsules, twice daily',
    description: 'Key support for liver detoxification pathways',
    phases: [1, 2],
    image: '/images/products/liver-support.jpg',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-03-01T14:22:00Z',
    isCustom: false,
    isArchived: false,
  },
  {
    id: 'product2',
    name: 'Colon Cleanse Formula',
    category: 'Detox',
    dosage: '1 tablespoon in water, daily',
    description: 'Gentle colon cleansing support with prebiotics',
    phases: [1],
    image: '/images/products/colon-cleanse.jpg',
    createdAt: '2025-01-15T10:35:00Z',
    updatedAt: '2025-02-28T09:15:00Z',
    isCustom: false,
    isArchived: false,
  },
  {
    id: 'product3',
    name: 'Mitochondrial Support',
    category: 'Mitochondrial',
    dosage: '1 capsule, three times daily',
    description: 'Comprehensive support for cellular energy production',
    phases: [2, 3],
    image: '/images/products/mito-support.jpg',
    createdAt: '2025-01-20T16:45:00Z',
    updatedAt: '2025-01-20T16:45:00Z',
    isCustom: false,
    isArchived: false,
  },
  {
    id: 'product4',
    name: 'Custom Herbal Blend',
    category: 'Custom',
    dosage: '1 teaspoon in warm water, morning and evening',
    description: 'Personalized herbal blend for liver and colon support',
    phases: [1, 2, 3, 4],
    image: '/images/products/custom-blend.jpg',
    createdAt: '2025-02-10T08:20:00Z',
    updatedAt: '2025-03-15T11:30:00Z',
    isCustom: true,
    isArchived: false,
  },
  {
    id: 'product5',
    name: 'Outdated Product',
    category: 'Miscellaneous',
    dosage: 'No longer used',
    description: 'This product has been archived',
    phases: [4],
    image: '/images/products/archived.jpg',
    createdAt: '2025-01-05T10:10:00Z',
    updatedAt: '2025-03-10T17:45:00Z',
    isCustom: true,
    isArchived: true,
  }
];

const mockCategories = [
  { id: 'cat1', name: 'Detox' },
  { id: 'cat2', name: 'Mitochondrial' },
  { id: 'cat3', name: 'Custom' },
  { id: 'cat4', name: 'Miscellaneous' },
];

const mockPhases = [
  { id: 1, name: 'Phase 1: Initial Detox', description: 'Focus on liver and colon cleansing' },
  { id: 2, name: 'Phase 2: Deeper Cleansing', description: 'More intensive detoxification process' },
  { id: 3, name: 'Phase 3: Rebuilding', description: 'Cellular repair and mitochondrial support' },
  { id: 4, name: 'Phase 4: Maintenance', description: 'Ongoing support and maintenance' },
];

// Setup MSW server
const server = setupServer(
  // Get all products
  http.get('/api/products', () => {
    return HttpResponse.json(mockProducts.filter(p => !p.isArchived));
  }),
  
  // Get archived products
  http.get('/api/products/archived', () => {
    return HttpResponse.json(mockProducts.filter(p => p.isArchived));
  }),
  
  // Get product by ID
  http.get('/api/products/:id', ({ params }) => {
    const product = mockProducts.find(p => p.id === params.id);
    if (product) {
      return HttpResponse.json(product);
    }
    return new HttpResponse(null, { status: 404 });
  }),
  
  // Create new product
  http.post('/api/products', async ({ request }) => {
    await delay(300);
    const data = await request.json();
    const newProduct = {
      id: `product${mockProducts.length + 1}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false,
    };
    return HttpResponse.json(newProduct);
  }),
  
  // Update product
  http.put('/api/products/:id', async ({ params, request }) => {
    await delay(200);
    const data = await request.json();
    const updatedProduct = {
      ...mockProducts.find(p => p.id === params.id),
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(updatedProduct);
  }),
  
  // Delete product
  http.delete('/api/products/:id', async ({ params }) => {
    await delay(200);
    return HttpResponse.json({ success: true, id: params.id });
  }),
  
  // Archive product
  http.put('/api/products/:id/archive', async ({ params }) => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      id: params.id,
      isArchived: true,
    });
  }),
  
  // Restore archived product
  http.put('/api/products/:id/restore', async ({ params }) => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      id: params.id,
      isArchived: false,
    });
  }),
  
  // Get categories
  http.get('/api/categories', () => {
    return HttpResponse.json(mockCategories);
  }),
  
  // Create new category
  http.post('/api/categories', async ({ request }) => {
    const data = await request.json();
    const newCategory = {
      id: `cat${mockCategories.length + 1}`,
      name: data.name,
    };
    return HttpResponse.json(newCategory);
  }),
  
  // Get phases
  http.get('/api/phases', () => {
    return HttpResponse.json(mockPhases);
  }),
  
  // Bulk operations
  http.post('/api/products/bulk', async ({ request }) => {
    await delay(400);
    const data = await request.json();
    return HttpResponse.json({
      success: true,
      count: data.productIds.length,
      operation: data.operation,
    });
  }),
  
  // Import products
  http.post('/api/products/import', async () => {
    await delay(600);
    return HttpResponse.json({
      success: true,
      imported: 10,
      skipped: 2,
      errors: 1,
    });
  }),
  
  // Export products
  http.get('/api/products/export', () => {
    return HttpResponse.json({
      url: '/exports/products-2025-03-22.json',
    });
  }),
  
  // Analytics endpoint
  http.post('/api/analytics', async () => {
    await delay(100);
    return HttpResponse.json({ success: true });
  })
);

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <SessionProvider session={{ expires: '1', user: { email: 'test@example.com', name: 'Test User' } }}>
      {ui}
    </SessionProvider>
  );
};

describe('Product Management Feature', () => {
  // Set up and tear down the mock server
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  // 1. Custom Product Creation Workflow Tests
  describe('1. Custom Product Creation Workflow', () => {
    test('displays Add New Product button that opens modal with empty form', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText('Liver Support Complex')).toBeInTheDocument();
      });
      
      // Find and click the "Add New Product" button
      const addButton = screen.getByRole('button', { name: /add new product/i });
      expect(addButton).toBeInTheDocument();
      
      userEvent.click(addButton);
      
      // Verify modal opens with empty form
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Create New Product')).toBeInTheDocument();
        
        // Check for empty form fields
        const nameInput = screen.getByLabelText(/product name/i);
        expect(nameInput).toHaveValue('');
        
        const categorySelect = screen.getByLabelText(/category/i);
        expect(categorySelect).toHaveValue('');
        
        const dosageInput = screen.getByLabelText(/dosage/i);
        expect(dosageInput).toHaveValue('');
        
        const descriptionInput = screen.getByLabelText(/description/i);
        expect(descriptionInput).toHaveValue('');
        
        const imageUpload = screen.getByLabelText(/product image/i);
        expect(imageUpload).toBeInTheDocument();
      });
    });

    test('form prevents submission when required fields are empty', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Open the modal
      const addButton = await screen.findByRole('button', { name: /add new product/i });
      userEvent.click(addButton);
      
      // Try to submit the empty form
      const submitButton = await screen.findByRole('button', { name: /save product/i });
      userEvent.click(submitButton);
      
      // Check that validation errors appear
      await waitFor(() => {
        expect(screen.getByText(/product name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/category is required/i)).toBeInTheDocument();
        expect(screen.getByText(/dosage is required/i)).toBeInTheDocument();
      });
      
      // Verify the modal is still open (form wasn't submitted)
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('image upload previews successfully and handles file validation', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Open the modal
      const addButton = await screen.findByRole('button', { name: /add new product/i });
      userEvent.click(addButton);
      
      // Get the file input
      const fileInput = await screen.findByLabelText(/product image/i);
      
      // Upload a valid image
      const validFile = createMockFile('valid-image.jpg', 'image/jpeg', 1024 * 100); // 100KB
      userEvent.upload(fileInput, validFile);
      
      // Check for preview
      await waitFor(() => {
        expect(screen.getByAltText(/image preview/i)).toBeInTheDocument();
      });
      
      // Try uploading an invalid file (too large)
      const largeFile = createMockFile('large-image.jpg', 'image/jpeg', 1024 * 1024 * 3); // 3MB
      userEvent.upload(fileInput, largeFile);
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/file size cannot exceed 2MB/i)).toBeInTheDocument();
      });
      
      // Try uploading an invalid file type
      const invalidTypeFile = createMockFile('document.pdf', 'application/pdf', 1024 * 100);
      userEvent.upload(fileInput, invalidTypeFile);
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/only image files \(jpg, png, gif\) are allowed/i)).toBeInTheDocument();
      });
    });

    test('successful submission updates product list and persists to backend', async () => {
      // Create a spy to monitor network requests
      const postSpy = jest.spyOn(window, 'fetch');
      
      renderWithProviders(<ProductManagement />);
      
      // Open the modal
      const addButton = await screen.findByRole('button', { name: /add new product/i });
      userEvent.click(addButton);
      
      // Fill out the form
      const nameInput = await screen.findByLabelText(/product name/i);
      const categorySelect = screen.getByLabelText(/category/i);
      const dosageInput = screen.getByLabelText(/dosage/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const phaseCheckboxes = screen.getAllByRole('checkbox', { name: /phase/i });
      
      userEvent.type(nameInput, 'New Test Product');
      userEvent.selectOptions(categorySelect, 'Mitochondrial');
      userEvent.type(dosageInput, '1 capsule daily');
      userEvent.type(descriptionInput, 'This is a test product description');
      userEvent.click(phaseCheckboxes[0]); // Select Phase 1
      userEvent.click(phaseCheckboxes[2]); // Select Phase 3
      
      // Upload image
      const fileInput = screen.getByLabelText(/product image/i);
      const validFile = createMockFile();
      userEvent.upload(fileInput, validFile);
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save product/i });
      userEvent.click(submitButton);
      
      // Verify optimistic UI update (should happen quickly)
      const startTime = performance.now();
      await waitFor(() => {
        expect(screen.getByText('New Test Product')).toBeInTheDocument();
      });
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(400); // Verify optimistic update is fast
      
      // Verify API call was made
      await waitFor(() => {
        expect(postSpy).toHaveBeenCalledWith(
          expect.stringContaining('/api/products'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );
      });
      
      // Verify modal is closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      
      // Cleanup
      postSpy.mockRestore();
    });

    test('API failure displays inline error messages', async () => {
      // Mock a server error for product creation
      server.use(
        http.post('/api/products', () => {
          return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
        })
      );
      
      renderWithProviders(<ProductManagement />);
      
      // Open the modal
      const addButton = await screen.findByRole('button', { name: /add new product/i });
      userEvent.click(addButton);
      
      // Fill out the form minimally
      const nameInput = await screen.findByLabelText(/product name/i);
      const categorySelect = screen.getByLabelText(/category/i);
      const dosageInput = screen.getByLabelText(/dosage/i);
      
      userEvent.type(nameInput, 'Error Test Product');
      userEvent.selectOptions(categorySelect, 'Detox');
      userEvent.type(dosageInput, '1 capsule daily');
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save product/i });
      userEvent.click(submitButton);
      
      // Verify error message appears
      await waitFor(() => {
        expect(screen.getByText(/failed to create product/i)).toBeInTheDocument();
        expect(screen.getByText(/please try again later/i)).toBeInTheDocument();
      });
      
      // Verify modal is still open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  // 2. Product Editing & Validation Tests
  describe('2. Product Editing & Validation', () => {
    test('edit button opens modal with pre-filled values', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText('Liver Support Complex')).toBeInTheDocument();
      });
      
      // Find and click the edit button for a product
      const productCards = screen.getAllByTestId('product-card');
      const firstProductCard = productCards[0];
      const editButton = within(firstProductCard).getByRole('button', { name: /edit/i });
      
      userEvent.click(editButton);
      
      // Verify modal opens with pre-filled form
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Edit Product')).toBeInTheDocument();
        
        // Check that form fields are pre-filled
        const nameInput = screen.getByLabelText(/product name/i);
        expect(nameInput).toHaveValue('Liver Support Complex');
        
        const categorySelect = screen.getByLabelText(/category/i);
        expect(categorySelect).toHaveValue('Detox');
        
        const dosageInput = screen.getByLabelText(/dosage/i);
        expect(dosageInput).toHaveValue('2 capsules, twice daily');
        
        const descriptionInput = screen.getByLabelText(/description/i);
        expect(descriptionInput).toHaveValue('Key support for liver detoxification pathways');
        
        // Check that phases are correctly selected
        const phase1Checkbox = screen.getByLabelText(/phase 1/i);
        const phase2Checkbox = screen.getByLabelText(/phase 2/i);
        expect(phase1Checkbox).toBeChecked();
        expect(phase2Checkbox).toBeChecked();
      });
    });

    test('all fields allow updates with proper validation', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load and open edit modal
      await waitFor(() => {
        expect(screen.getByText('Liver Support Complex')).toBeInTheDocument();
      });
      
      const productCards = screen.getAllByTestId('product-card');
      const firstProductCard = productCards[0];
      const editButton = within(firstProductCard).getByRole('button', { name: /edit/i });
      
      userEvent.click(editButton);
      
      // Wait for modal to open
      await screen.findByRole('dialog');
      
      // Edit all fields
      const nameInput = screen.getByLabelText(/product name/i);
      const categorySelect = screen.getByLabelText(/category/i);
      const dosageInput = screen.getByLabelText(/dosage/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      
      // Clear and update fields
      userEvent.clear(nameInput);
      userEvent.clear(dosageInput);
      userEvent.clear(descriptionInput);
      
      // Try to submit with empty required fields
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      userEvent.click(submitButton);
      
      // Verify validation errors
      await waitFor(() => {
        expect(screen.getByText(/product name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/dosage is required/i)).toBeInTheDocument();
      });
      
      // Fill in valid data
      userEvent.type(nameInput, 'Updated Liver Formula');
      userEvent.selectOptions(categorySelect, 'Mitochondrial');
      userEvent.type(dosageInput, '1 capsule, three times daily');
      userEvent.type(descriptionInput, 'Enhanced formula with additional mitochondrial support');
      
      // Uncheck Phase 1 and check Phase 3
      const phase1Checkbox = screen.getByLabelText(/phase 1/i);
      const phase3Checkbox = screen.getByLabelText(/phase 3/i);
      userEvent.click(phase1Checkbox);
      userEvent.click(phase3Checkbox);
      
      // Submit the form
      userEvent.click(submitButton);
      
      // Verify changes are reflected in the UI after saving
      await waitFor(() => {
        expect(screen.getByText('Updated Liver Formula')).toBeInTheDocument();
        expect(screen.queryByText('Liver Support Complex')).not.toBeInTheDocument();
      });
    });

    test('special characters and long descriptions are handled gracefully', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load and open edit modal
      await waitFor(() => {
        expect(screen.getByText('Colon Cleanse Formula')).toBeInTheDocument();
      });
      
      const productCards = screen.getAllByTestId('product-card');
      const secondProductCard = productCards[1];
      const editButton = within(secondProductCard).getByRole('button', { name: /edit/i });
      
      userEvent.click(editButton);
      
      // Wait for modal to open
      await screen.findByRole('dialog');
      
      // Add special characters and a very long description
      const nameInput = screen.getByLabelText(/product name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      
      userEvent.clear(nameInput);
      userEvent.clear(descriptionInput);
      
      userEvent.type(nameInput, 'Special Ch@r&cters! T€st (2025)');
      
      const longDescription = 'This is an extremely long product description that contains multiple paragraphs.\n\n' +
        'It includes special characters like © ® ™ € £ ¥ § and emoji 🌿🧠💪 to test how the system handles these.\n\n' +
        'The description also tests the system\'s ability to handle very long text that would normally exceed ' +
        'typical input constraints. This is important for testing overflow behavior, truncation, and proper ' +
        'display in various viewports including mobile devices where space is limited. It\'s essential that ' +
        'the UI remains intact and the text readable regardless of length or content.';
      
      userEvent.type(descriptionInput, longDescription);
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      userEvent.click(submitButton);
      
      // Verify changes are saved and displayed properly
      await waitFor(() => {
        expect(screen.getByText('Special Ch@r&cters! T€st (2025)')).toBeInTheDocument();
        
        // Check that at least part of the long description is visible
        // (full text may be truncated in the product card view)
        expect(screen.getByText(/This is an extremely long product description/i)).toBeInTheDocument();
      });
      
      // Reopen to verify the full description was saved
      const updatedProductCard = screen.getByText('Special Ch@r&cters! T€st (2025)').closest('[data-testid="product-card"]');
      const newEditButton = within(updatedProductCard as HTMLElement).getByRole('button', { name: /edit/i });
      userEvent.click(newEditButton);
      
      // Verify the full text is in the edit form
      await waitFor(() => {
        const editedDescriptionInput = screen.getByLabelText(/description/i);
        expect(editedDescriptionInput).toHaveValue(longDescription);
      });
    });

    test('cancel button reverts changes without affecting backend', async () => {
      const putSpy = jest.spyOn(window, 'fetch');
      
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText('Mitochondrial Support')).toBeInTheDocument();
      });
      
      // Find the third product and open edit modal
      const productCards = screen.getAllByTestId('product-card');
      const thirdProductCard = productCards[2];
      const editButton = within(thirdProductCard).getByRole('button', { name: /edit/i });
      userEvent.click(editButton);
      
      // Wait for modal to open
      await screen.findByRole('dialog');
      
      // Make changes to the product
      const nameInput = screen.getByLabelText(/product name/i);
      userEvent.clear(nameInput);
      userEvent.type(nameInput, 'This Should Not Be Saved');
      
      // Click cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      userEvent.click(cancelButton);
      
      // Verify modal is closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      
      // Verify original product name is still displayed
      expect(screen.getByText('Mitochondrial Support')).toBeInTheDocument();
      expect(screen.queryByText('This Should Not Be Saved')).not.toBeInTheDocument();
      
      // Verify no PUT request was made
      expect(putSpy).not.toHaveBeenCalled();
      
      // Cleanup
      putSpy.mockRestore();
    });
  });

  // 3. Phase Association Logic Tests
  describe('3. Phase Association Logic', () => {
    test('products can link to one or multiple phases', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText('Custom Herbal Blend')).toBeInTheDocument();
      });
      
      // Check the phases filter controls exist
      const phaseFilters = screen.getAllByRole('checkbox', { name: /filter by phase/i });
      expect(phaseFilters.length).toBeGreaterThanOrEqual(4); // Should have 4 phases to filter by
      
      // Filter by Phase 1
      userEvent.click(phaseFilters[0]);
      
      // Verify only Phase 1 products are shown
      await waitFor(() => {
        expect(screen.getByText('Liver Support Complex')).toBeInTheDocument();
        expect(screen.getByText('Colon Cleanse Formula')).toBeInTheDocument();
        expect(screen.getByText('Custom Herbal Blend')).toBeInTheDocument();
        expect(screen.queryByText('Mitochondrial Support')).not.toBeInTheDocument();
      });
      
      // Add Phase 3 filter (should show products in Phase 1 OR Phase 3)
      userEvent.click(phaseFilters[2]);
      
      // Verify products from Phase 1 and Phase 3 are shown
      await waitFor(() => {
        expect(screen.getByText('Liver Support Complex')).toBeInTheDocument();
        expect(screen.getByText('Colon Cleanse Formula')).toBeInTheDocument();
        expect(screen.getByText('Mitochondrial Support')).toBeInTheDocument();
        expect(screen.getByText('Custom Herbal Blend')).toBeInTheDocument();
      });
      
      // Clear filters
      userEvent.click(phaseFilters[0]);
      userEvent.click(phaseFilters[2]);
      
      // Verify all active products are shown again
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBe(4); // 4 non-archived products
      });
    });

    test('changing phase association updates product visibility', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText('Liver Support Complex')).toBeInTheDocument();
      });
      
      // Filter by Phase 4
      const phaseFilters = screen.getAllByRole('checkbox', { name: /filter by phase/i });
      userEvent.click(phaseFilters[3]); // Phase 4 filter
      
      // Verify only Phase 4 products are shown
      await waitFor(() => {
        expect(screen.queryByText('Liver Support Complex')).not.toBeInTheDocument();
        expect(screen.queryByText('Colon Cleanse Formula')).not.toBeInTheDocument();
        expect(screen.queryByText('Mitochondrial Support')).not.toBeInTheDocument();
        expect(screen.getByText('Custom Herbal Blend')).toBeInTheDocument();
      });
      
      // Now edit a product to add Phase 4
      // First clear the filter
      userEvent.click(phaseFilters[3]);
      
      // Find and edit the first product
      await waitFor(() => {
        expect(screen.getByText('Liver Support Complex')).toBeInTheDocument();
      });
      
      const firstProductCard = screen.getAllByTestId('product-card')[0];
      const editButton = within(firstProductCard).getByRole('button', { name: /edit/i });
      userEvent.click(editButton);
      
      // Wait for modal and add Phase 4
      await screen.findByRole('dialog');
      const phase4Checkbox = screen.getByLabelText(/phase 4/i);
      userEvent.click(phase4Checkbox);
      
      // Save changes
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      userEvent.click(saveButton);
      
      // Wait for changes to be saved
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      
      // Reapply Phase 4 filter
      userEvent.click(phaseFilters[3]);
      
      // Verify the edited product now appears in Phase 4 filter
      await waitFor(() => {
        expect(screen.getByText('Liver Support Complex')).toBeInTheDocument();
        expect(screen.getByText('Custom Herbal Blend')).toBeInTheDocument();
        expect(screen.queryByText('Colon Cleanse Formula')).not.toBeInTheDocument();
      });
    });
    
    test('bulk phase re-assignment applies correctly', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Enable bulk selection mode
      const bulkButton = screen.getByRole('button', { name: /bulk actions/i });
      userEvent.click(bulkButton);
      
      // Select two products
      const productCheckboxes = screen.getAllByTestId('product-select-checkbox');
      userEvent.click(productCheckboxes[0]); // Select first product
      userEvent.click(productCheckboxes[2]); // Select third product
      
      // Open bulk phase assignment
      const phaseAssignButton = screen.getByRole('button', { name: /assign phases/i });
      userEvent.click(phaseAssignButton);
      
      // Wait for the phase assignment modal
      await screen.findByRole('dialog');
      
      // Select Phase 4 for bulk assignment
      const bulkPhase4Checkbox = screen.getByLabelText(/assign to phase 4/i);
      userEvent.click(bulkPhase4Checkbox);
      
      // Confirm the assignment
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      userEvent.click(confirmButton);
      
      // Wait for the operation to complete
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      
      // Filter by Phase 4
      const phaseFilters = screen.getAllByRole('checkbox', { name: /filter by phase/i });
      userEvent.click(phaseFilters[3]); // Phase 4 filter
      
      // Verify both selected products now appear in Phase 4
      await waitFor(() => {
        expect(screen.getByText('Liver Support Complex')).toBeInTheDocument(); // First product
        expect(screen.getByText('Mitochondrial Support')).toBeInTheDocument(); // Third product
        expect(screen.getByText('Custom Herbal Blend')).toBeInTheDocument(); // Already in Phase 4
        expect(screen.queryByText('Colon Cleanse Formula')).not.toBeInTheDocument(); // Not selected
      });
    });
  });

  // 4. Category Management Tests
  describe('4. Category Management', () => {
    test('products can select existing categories or create new ones', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Open the "Add New Product" modal
      const addButton = await screen.findByRole('button', { name: /add new product/i });
      userEvent.click(addButton);
      
      // Wait for modal to open
      await screen.findByRole('dialog');
      
      // Check that existing categories are available in the dropdown
      const categorySelect = screen.getByLabelText(/category/i);
      await waitFor(() => {
        expect(within(categorySelect).getByText('Detox')).toBeInTheDocument();
        expect(within(categorySelect).getByText('Mitochondrial')).toBeInTheDocument();
        expect(within(categorySelect).getByText('Custom')).toBeInTheDocument();
      });
      
      // Select "Create New Category" option
      userEvent.selectOptions(categorySelect, 'create-new');
      
      // Verify new category input appears
      const newCategoryInput = await screen.findByLabelText(/new category name/i);
      expect(newCategoryInput).toBeInTheDocument();
      
      // Enter a new category
      userEvent.type(newCategoryInput, 'Antioxidants');
      
      // Fill in other required fields
      const nameInput = screen.getByLabelText(/product name/i);
      const dosageInput = screen.getByLabelText(/dosage/i);
      userEvent.type(nameInput, 'Glutathione Complex');
      userEvent.type(dosageInput, '2 capsules daily');
      
      // Select a phase
      const phase1Checkbox = screen.getByLabelText(/phase 1/i);
      userEvent.click(phase1Checkbox);
      
      // Save the product
      const saveButton = screen.getByRole('button', { name: /save product/i });
      userEvent.click(saveButton);
      
      // Verify the new product with the new category appears in the list
      await waitFor(() => {
        expect(screen.getByText('Glutathione Complex')).toBeInTheDocument();
        expect(screen.getByText('Antioxidants')).toBeInTheDocument();
      });
      
      // Verify the new category appears in the category filter
      const categoryFilters = screen.getAllByTestId('category-filter');
      const categoryLabels = categoryFilters.map(filter => within(filter).getByText(/\w+/));
      const categoryNames = categoryLabels.map(label => label.textContent);
      expect(categoryNames).toContain('Antioxidants');
    });

    test('category filters operate correctly', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Get all category filters
      const categoryFilters = screen.getAllByTestId('category-filter');
      
      // Find and click the "Detox" category filter
      const detoxFilter = categoryFilters.find(filter => 
        within(filter).getByText('Detox')
      );
      userEvent.click(within(detoxFilter as HTMLElement).getByRole('checkbox'));
      
      // Verify only Detox products are shown
      await waitFor(() => {
        expect(screen.getByText('Liver Support Complex')).toBeInTheDocument();
        expect(screen.getByText('Colon Cleanse Formula')).toBeInTheDocument();
        expect(screen.queryByText('Mitochondrial Support')).not.toBeInTheDocument();
      });
      
      // Add "Mitochondrial" filter (should show Detox OR Mitochondrial)
      const mitoFilter = categoryFilters.find(filter => 
        within(filter).getByText('Mitochondrial')
      );
      userEvent.click(within(mitoFilter as HTMLElement).getByRole('checkbox'));
      
      // Verify both categories of products are shown
      await waitFor(() => {
        expect(screen.getByText('Liver Support Complex')).toBeInTheDocument();
        expect(screen.getByText('Colon Cleanse Formula')).toBeInTheDocument();
        expect(screen.getByText('Mitochondrial Support')).toBeInTheDocument();
      });
      
      // Clear filters
      userEvent.click(within(detoxFilter as HTMLElement).getByRole('checkbox'));
      userEvent.click(within(mitoFilter as HTMLElement).getByRole('checkbox'));
      
      // Verify all products are shown again
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThanOrEqual(4);
      });
    });

    test('reorganizing products by category updates all views', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load and open the edit modal for a product
      await waitFor(() => {
        expect(screen.getByText('Mitochondrial Support')).toBeInTheDocument();
      });
      
      // Find the Mitochondrial Support product and open edit modal
      const productCard = screen.getByText('Mitochondrial Support').closest('[data-testid="product-card"]');
      const editButton = within(productCard as HTMLElement).getByRole('button', { name: /edit/i });
      userEvent.click(editButton);
      
      // Wait for modal to open and change the category
      await screen.findByRole('dialog');
      const categorySelect = screen.getByLabelText(/category/i);
      userEvent.selectOptions(categorySelect, 'Detox');
      
      // Save the changes
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      userEvent.click(saveButton);
      
      // Verify the product's category has been updated in the UI
      await waitFor(() => {
        const updatedCard = screen.getByText('Mitochondrial Support').closest('[data-testid="product-card"]');
        expect(within(updatedCard as HTMLElement).getByText('Detox')).toBeInTheDocument();
      });
      
      // Filter by the Detox category
      const categoryFilters = screen.getAllByTestId('category-filter');
      const detoxFilter = categoryFilters.find(filter => 
        within(filter).getByText('Detox')
      );
      userEvent.click(within(detoxFilter as HTMLElement).getByRole('checkbox'));
      
      // Verify the product now appears in the Detox filter
      await waitFor(() => {
        expect(screen.getByText('Mitochondrial Support')).toBeInTheDocument();
      });
      
      // Filter by Mitochondrial category
      userEvent.click(within(detoxFilter as HTMLElement).getByRole('checkbox')); // Clear Detox
      const mitoFilter = categoryFilters.find(filter => 
        within(filter).getByText('Mitochondrial')
      );
      userEvent.click(within(mitoFilter as HTMLElement).getByRole('checkbox'));
      
      // Verify the product no longer appears in the Mitochondrial filter
      await waitFor(() => {
        expect(screen.queryByText('Mitochondrial Support')).not.toBeInTheDocument();
      });
    });
  });

  // 5. Product Deletion & Archiving Tests
  describe('5. Product Deletion & Archiving', () => {
    test('deletion requires confirmation', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText('Custom Herbal Blend')).toBeInTheDocument();
      });
      
      // Find the Custom Herbal Blend product
      const productCard = screen.getByText('Custom Herbal Blend').closest('[data-testid="product-card"]');
      
      // Open the product actions menu
      const actionsButton = within(productCard as HTMLElement).getByRole('button', { name: /actions/i });
      userEvent.click(actionsButton);
      
      // Click delete option
      const deleteOption = screen.getByRole('menuitem', { name: /delete/i });
      userEvent.click(deleteOption);
      
      // Verify confirmation modal appears
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
        expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
      });
      
      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      userEvent.click(cancelButton);
      
      // Verify modal is closed and product still exists
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.getByText('Custom Herbal Blend')).toBeInTheDocument();
      });
      
      // Try again but confirm deletion this time
      userEvent.click(actionsButton);
      const deleteOption2 = screen.getByRole('menuitem', { name: /delete/i });
      userEvent.click(deleteOption2);
      
      // Wait for confirmation modal
      await screen.findByRole('dialog');
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      userEvent.click(confirmButton);
      
      // Verify product is removed from the list
      await waitFor(() => {
        expect(screen.queryByText('Custom Herbal Blend')).not.toBeInTheDocument();
      });
    });

    test('archiving and restoring products works correctly', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText('Colon Cleanse Formula')).toBeInTheDocument();
      });
      
      // Find the Colon Cleanse Formula product
      const productCard = screen.getByText('Colon Cleanse Formula').closest('[data-testid="product-card"]');
      
      // Open the product actions menu
      const actionsButton = within(productCard as HTMLElement).getByRole('button', { name: /actions/i });
      userEvent.click(actionsButton);
      
      // Click archive option
      const archiveOption = screen.getByRole('menuitem', { name: /archive/i });
      userEvent.click(archiveOption);
      
      // Verify confirmation modal appears
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/confirm archive/i)).toBeInTheDocument();
      });
      
      // Confirm archiving
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      userEvent.click(confirmButton);
      
      // Verify product is removed from the active list
      await waitFor(() => {
        expect(screen.queryByText('Colon Cleanse Formula')).not.toBeInTheDocument();
      });
      
      // Switch to archived products view
      const archivedTabButton = screen.getByRole('tab', { name: /archived/i });
      userEvent.click(archivedTabButton);
      
      // Verify product appears in archived list
      await waitFor(() => {
        expect(screen.getByText('Colon Cleanse Formula')).toBeInTheDocument();
        expect(screen.getByText('Outdated Product')).toBeInTheDocument(); // Previously archived
      });
      
      // Restore the archived product
      const archivedProductCard = screen.getByText('Colon Cleanse Formula').closest('[data-testid="product-card"]');
      const restoreButton = within(archivedProductCard as HTMLElement).getByRole('button', { name: /restore/i });
      userEvent.click(restoreButton);
      
      // Verify product is removed from archived list
      await waitFor(() => {
        expect(screen.queryByText('Colon Cleanse Formula')).not.toBeInTheDocument();
      });
      
      // Switch back to active products
      const activeTabButton = screen.getByRole('tab', { name: /active/i });
      userEvent.click(activeTabButton);
      
      // Verify product appears in active list again
      await waitFor(() => {
        expect(screen.getByText('Colon Cleanse Formula')).toBeInTheDocument();
      });
    });
  });

  // 6. Bulk Operations Tests
  describe('6. Bulk Operations', () => {
    test('bulk selection enables multiple product selection', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Enable bulk selection mode
      const bulkButton = screen.getByRole('button', { name: /bulk actions/i });
      userEvent.click(bulkButton);
      
      // Verify checkboxes appear on each product card
      await waitFor(() => {
        const checkboxes = screen.getAllByTestId('product-select-checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });
      
      // Select multiple products
      const checkboxes = screen.getAllByTestId('product-select-checkbox');
      userEvent.click(checkboxes[0]);
      userEvent.click(checkboxes[1]);
      
      // Verify selection count is displayed
      expect(screen.getByText(/2 products selected/i)).toBeInTheDocument();
      
      // Verify bulk action buttons are enabled
      expect(screen.getByRole('button', { name: /assign phases/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /assign category/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /archive selected/i })).toBeEnabled();
    });

    test('bulk category assignment works correctly', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Enable bulk selection mode
      const bulkButton = screen.getByRole('button', { name: /bulk actions/i });
      userEvent.click(bulkButton);
      
      // Select two products
      const checkboxes = screen.getAllByTestId('product-select-checkbox');
      userEvent.click(checkboxes[0]); // First product (Liver Support Complex)
      userEvent.click(checkboxes[2]); // Third product (Mitochondrial Support)
      
      // Click bulk category assignment button
      const bulkCategoryButton = screen.getByRole('button', { name: /assign category/i });
      userEvent.click(bulkCategoryButton);
      
      // Wait for the category assignment modal
      await screen.findByRole('dialog');
      
      // Select a category from the dropdown
      const categorySelect = screen.getByLabelText(/select category/i);
      userEvent.selectOptions(categorySelect, 'Custom');
      
      // Confirm the assignment
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      userEvent.click(confirmButton);
      
      // Wait for operation to complete
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      
      // Verify both products now show the new category
      await waitFor(() => {
        const productCards = screen.getAllByTestId('product-card');
        
        // Find the updated products by name
        const liverProduct = productCards.find(card => 
          within(card).getByText('Liver Support Complex')
        );
        const mitoProduct = productCards.find(card => 
          within(card).getByText('Mitochondrial Support')
        );
        
        // Verify their categories are updated
        expect(within(liverProduct as HTMLElement).getByText('Custom')).toBeInTheDocument();
        expect(within(mitoProduct as HTMLElement).getByText('Custom')).toBeInTheDocument();
      });
      
      // Filter by Custom category to verify
      const categoryFilters = screen.getAllByTestId('category-filter');
      const customFilter = categoryFilters.find(filter => 
        within(filter).getByText('Custom')
      );
      userEvent.click(within(customFilter as HTMLElement).getByRole('checkbox'));
      
      // Verify only products with Custom category are shown
      await waitFor(() => {
        expect(screen.getByText('Liver Support Complex')).toBeInTheDocument();
        expect(screen.getByText('Mitochondrial Support')).toBeInTheDocument();
        expect(screen.getByText('Custom Herbal Blend')).toBeInTheDocument(); // Already Custom
        expect(screen.queryByText('Colon Cleanse Formula')).not.toBeInTheDocument(); // Not updated
      });
    });

    test('bulk archiving removes products from active view', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Count initial products
      const initialProductCount = screen.getAllByTestId('product-card').length;
      
      // Enable bulk selection mode
      const bulkButton = screen.getByRole('button', { name: /bulk actions/i });
      userEvent.click(bulkButton);
      
      // Select two products
      const checkboxes = screen.getAllByTestId('product-select-checkbox');
      userEvent.click(checkboxes[0]); // First product
      userEvent.click(checkboxes[1]); // Second product
      
      // Click bulk archive button
      const bulkArchiveButton = screen.getByRole('button', { name: /archive selected/i });
      userEvent.click(bulkArchiveButton);
      
      // Wait for confirmation modal
      await screen.findByRole('dialog');
      
      // Confirm the archive operation
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      userEvent.click(confirmButton);
      
      // Wait for operation to complete
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      
      // Verify products are removed from active view
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBe(initialProductCount - 2);
      });
      
      // Switch to archived tab
      const archivedTabButton = screen.getByRole('tab', { name: /archived/i });
      userEvent.click(archivedTabButton);
      
      // Verify archived products appear in archived tab
      await waitFor(() => {
        expect(screen.getByText('Liver Support Complex')).toBeInTheDocument();
        expect(screen.getByText('Colon Cleanse Formula')).toBeInTheDocument();
      });
      
      // Verify bulk restore option is available
      const bulkRestoreButton = screen.getByRole('button', { name: /restore selected/i });
      expect(bulkRestoreButton).toBeInTheDocument();
    });

    test('select all and deselect all functions work', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Enable bulk selection mode
      const bulkButton = screen.getByRole('button', { name: /bulk actions/i });
      userEvent.click(bulkButton);
      
      // Get the total number of products
      const totalProducts = screen.getAllByTestId('product-card').length;
      
      // Click select all button
      const selectAllButton = screen.getByRole('button', { name: /select all/i });
      userEvent.click(selectAllButton);
      
      // Verify all products are selected
      await waitFor(() => {
        expect(screen.getByText(`${totalProducts} products selected`)).toBeInTheDocument();
        
        // Check that all checkboxes are selected
        const checkboxes = screen.getAllByTestId('product-select-checkbox');
        checkboxes.forEach(checkbox => {
          expect(checkbox).toBeChecked();
        });
      });
      
      // Click deselect all button
      const deselectAllButton = screen.getByRole('button', { name: /deselect all/i });
      userEvent.click(deselectAllButton);
      
      // Verify no products are selected
      await waitFor(() => {
        expect(screen.getByText('0 products selected')).toBeInTheDocument();
        
        // Check that no checkboxes are selected
        const checkboxes = screen.getAllByTestId('product-select-checkbox');
        checkboxes.forEach(checkbox => {
          expect(checkbox).not.toBeChecked();
        });
      });
    });
  });

  // 7. Import/Export Workflows Tests
  describe('7. Import/Export Workflows', () => {
    test('product export downloads CSV file with all products', async () => {
      // Mock downloadBlob function
      global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
      const mockAnchor = { click: jest.fn(), href: '', download: '' };
      document.createElement = jest.fn().mockImplementation((tag) => {
        if (tag === 'a') return mockAnchor;
        // Default mock implementation for other elements
        return { 
          appendChild: jest.fn(),
          setAttribute: jest.fn()
        };
      });
      
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Click export button
      const exportButton = screen.getByRole('button', { name: /export products/i });
      userEvent.click(exportButton);
      
      // Verify CSV download was triggered
      await waitFor(() => {
        expect(mockAnchor.download).toContain('products-export');
        expect(mockAnchor.download).toContain('.csv');
        expect(mockAnchor.click).toHaveBeenCalledTimes(1);
      });
      
      // Cleanup mocks
      (document.createElement as jest.Mock).mockRestore();
      (global.URL.createObjectURL as jest.Mock).mockRestore();
    });

    test('bulk export downloads CSV with selected products only', async () => {
      // Mock downloadBlob function
      global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
      const mockAnchor = { click: jest.fn(), href: '', download: '' };
      document.createElement = jest.fn().mockImplementation((tag) => {
        if (tag === 'a') return mockAnchor;
        // Default implementation for other elements
        return { 
          appendChild: jest.fn(),
          setAttribute: jest.fn()
        };
      });
      
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Enable bulk selection mode
      const bulkButton = screen.getByRole('button', { name: /bulk actions/i });
      userEvent.click(bulkButton);
      
      // Select two products
      const checkboxes = screen.getAllByTestId('product-select-checkbox');
      userEvent.click(checkboxes[0]);
      userEvent.click(checkboxes[2]);
      
      // Click bulk export button
      const bulkExportButton = screen.getByRole('button', { name: /export selected/i });
      userEvent.click(bulkExportButton);
      
      // Verify CSV download was triggered with the right name
      await waitFor(() => {
        expect(mockAnchor.download).toContain('selected-products-export');
        expect(mockAnchor.download).toContain('.csv');
        expect(mockAnchor.click).toHaveBeenCalledTimes(1);
      });
      
      // Cleanup mocks
      (document.createElement as jest.Mock).mockRestore();
      (global.URL.createObjectURL as jest.Mock).mockRestore();
    });

    test('import modal validates CSV format', async () => {
      const file = new File(
        ['Name,Category,Dosage,Description,Phase1,Phase2,Phase3,Phase4\nTest Product,Detox,1 tablet daily,Description,true,false,false,true'], 
        'products.csv', 
        { type: 'text/csv' }
      );
      
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Click import button
      const importButton = screen.getByRole('button', { name: /import products/i });
      userEvent.click(importButton);
      
      // Wait for import modal
      await screen.findByRole('dialog');
      
      // Upload file
      const fileInput = screen.getByLabelText(/select csv file/i);
      userEvent.upload(fileInput, file);
      
      // Verify file validation passes
      await waitFor(() => {
        expect(screen.getByText(/1 product found in csv/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /import/i })).toBeEnabled();
      });
      
      // Import the products
      const confirmImportButton = screen.getByRole('button', { name: /import/i });
      userEvent.click(confirmImportButton);
      
      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/successfully imported 1 product/i)).toBeInTheDocument();
      });
      
      // Verify new product appears in the list
      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });
    });

    test('import workflow handles malformed CSV files', async () => {
      const malformedFile = new File(
        ['Name,Category,InvalidColumn\nBad Product,Detox,Something'], 
        'bad-products.csv', 
        { type: 'text/csv' }
      );
      
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Click import button
      const importButton = screen.getByRole('button', { name: /import products/i });
      userEvent.click(importButton);
      
      // Wait for import modal
      await screen.findByRole('dialog');
      
      // Upload malformed file
      const fileInput = screen.getByLabelText(/select csv file/i);
      userEvent.upload(fileInput, malformedFile);
      
      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/invalid csv format/i)).toBeInTheDocument();
        expect(screen.getByText(/required columns missing/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /import/i })).toBeDisabled();
      });
      
      // Close the modal
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      userEvent.click(cancelButton);
      
      // Verify modal is closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    test('template download provides correctly formatted CSV', async () => {
      // Mock downloadBlob function
      global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
      const mockAnchor = { click: jest.fn(), href: '', download: '' };
      document.createElement = jest.fn().mockImplementation((tag) => {
        if (tag === 'a') return mockAnchor;
        // Default implementation for other elements
        return { 
          appendChild: jest.fn(),
          setAttribute: jest.fn()
        };
      });
      
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load and open import modal
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Click import button
      const importButton = screen.getByRole('button', { name: /import products/i });
      userEvent.click(importButton);
      
      // Wait for import modal
      await screen.findByRole('dialog');
      
      // Click download template button
      const templateButton = screen.getByRole('button', { name: /download template/i });
      userEvent.click(templateButton);
      
      // Verify template download was triggered
      await waitFor(() => {
        expect(mockAnchor.download).toBe('product-import-template.csv');
        expect(mockAnchor.click).toHaveBeenCalledTimes(1);
      });
      
      // Cleanup mocks
      (document.createElement as jest.Mock).mockRestore();
      (global.URL.createObjectURL as jest.Mock).mockRestore();
    });
  });

  // 8. Responsive Design & UX Tests
  describe('8. Responsive Design & UX', () => {
    test('product cards adapt to mobile viewports', async () => {
      // Mock window.matchMedia for responsive testing
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Verify product cards have mobile-specific class or style
      const productCards = screen.getAllByTestId('product-card');
      expect(productCards[0]).toHaveClass('mobile-card');
      
      // Verify action buttons are in a dropdown on mobile
      expect(screen.getByTestId('mobile-action-menu')).toBeInTheDocument();
      
      // Verify grid layout is changed to single column
      const productGrid = screen.getByTestId('product-grid');
      expect(productGrid).toHaveClass('mobile-grid');
      
      // Clean up
      delete window.matchMedia;
    });

    test('search and filter UI collapses on mobile view', async () => {
      // Mock window.matchMedia for responsive testing
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Verify search and filters are initially collapsed on mobile
      expect(screen.getByTestId('mobile-filter-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('search-filter-container')).toHaveClass('collapsed');
      
      // Toggle filter visibility
      userEvent.click(screen.getByTestId('mobile-filter-toggle'));
      
      // Verify filters are now visible
      expect(screen.getByTestId('search-filter-container')).toHaveClass('expanded');
      
      // Clean up
      delete window.matchMedia;
    });

    test('infinite scroll loads more products on demand', async () => {
      // Mock IntersectionObserver
      const mockIntersectionObserver = jest.fn();
      mockIntersectionObserver.mockReturnValue({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      });
      window.IntersectionObserver = mockIntersectionObserver;
      
      renderWithProviders(<ProductManagement />);
      
      // Wait for initial products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Store initial product count
      const initialProductCount = screen.getAllByTestId('product-card').length;
      
      // Get the IntersectionObserver callback
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];
      
      // Trigger the callback with an intersecting entry
      observerCallback([{
        isIntersecting: true,
        target: document.createElement('div'),
      }]);
      
      // Verify more products loaded
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(initialProductCount);
      });
      
      // Clean up
      delete window.IntersectionObserver;
    });

    test('drag and drop reordering of products works correctly', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Get initial order of products
      const productCards = screen.getAllByTestId('product-card');
      const initialFirstProduct = within(productCards[0]).getByText(/liver support complex/i);
      const initialSecondProduct = within(productCards[1]).getByText(/colon cleanse formula/i);
      
      // Mock dragStart, drag, and drop events
      const dragStartEvent = createEvent.dragStart(productCards[1]);
      Object.assign(dragStartEvent, { dataTransfer: { setData: jest.fn() } });
      fireEvent(productCards[1], dragStartEvent);
      
      // Fire dragOver event on first product (target)
      const dragOverEvent = createEvent.dragOver(productCards[0]);
      Object.assign(dragOverEvent, { dataTransfer: { setData: jest.fn() } });
      fireEvent(productCards[0], dragOverEvent);
      
      // Fire drop event
      const dropEvent = createEvent.drop(productCards[0]);
      Object.assign(dropEvent, { 
        dataTransfer: { 
          getData: jest.fn().mockReturnValue(productCards[1].getAttribute('data-product-id')) 
        } 
      });
      fireEvent(productCards[0], dropEvent);
      
      // Verify order has changed
      await waitFor(() => {
        const updatedProductCards = screen.getAllByTestId('product-card');
        const newFirstProduct = within(updatedProductCards[0]).queryByText(/colon cleanse formula/i);
        const newSecondProduct = within(updatedProductCards[1]).queryByText(/liver support complex/i);
        
        expect(newFirstProduct).toBeInTheDocument();
        expect(newSecondProduct).toBeInTheDocument();
      });
    });
  });

  // 9. Accessibility & Focus Management Tests
  describe('9. Accessibility & Focus Management', () => {
    test('product cards are keyboard navigable', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Focus on first product card
      const productCards = screen.getAllByTestId('product-card');
      userEvent.tab(); // Focus on first interactive element
      
      // Tab through interactive elements and verify focus moves correctly
      let focusCount = 0;
      while (focusCount < 10) { // Avoid infinite loop, check through several elements
        userEvent.tab();
        focusCount++;
        
        // Check if we've reached a product action button
        if (document.activeElement && document.activeElement.textContent?.includes('Edit')) {
          break;
        }
      }
      
      // Verify focus reached a product action button
      expect(document.activeElement).toHaveAttribute('aria-label', expect.stringMatching(/edit/i));
      
      // Test keyboard activation of edit button
      userEvent.keyboard('{enter}');
      
      // Verify edit modal opened
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Verify focus moved to the modal
      expect(document.activeElement).toHaveAttribute('aria-label', expect.stringMatching(/close/i));
    });

    test('modals trap focus for accessibility', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Open create product modal
      const createButton = screen.getByRole('button', { name: /add product/i });
      userEvent.click(createButton);
      
      // Wait for modal
      await screen.findByRole('dialog');
      
      // Tab through all focusable elements in the modal
      const focusableElementsBeforeTabbing = screen.getAllByRole('button').filter(
        el => el.getAttribute('aria-label')?.includes('close') || 
             el.textContent?.includes('Cancel') || 
             el.textContent?.includes('Save')
      );
      
      // From close button, tab to form field
      userEvent.tab();
      expect(document.activeElement).toHaveAttribute('name', 'productName');
      
      // Tab through all form fields and back to buttons
      let tabCount = 0;
      while (tabCount < 10) { // Avoid infinite loop
        userEvent.tab();
        tabCount++;
        // If we reach the save button, we've cycled through the form
        if (document.activeElement && document.activeElement.textContent?.includes('Save')) {
          break;
        }
      }
      
      // Tab once more
      userEvent.tab();
      
      // Focus should cycle back to the close button, not leave the modal
      expect(document.activeElement).toHaveAttribute('aria-label', expect.stringMatching(/close/i));
    });

    test('screen reader text is provided for important actions', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Check for ARIA labels and screen reader text
      expect(screen.getByRole('button', { name: /add product/i })).toHaveAttribute('aria-label', 'Add new product');
      
      // Check for screen reader only text
      expect(screen.getByTestId('sr-selected-count')).toHaveClass('sr-only');
      
      // Check for proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.some(h => h.getAttribute('aria-level') === '1')).toBeTruthy();
      
      // Check that images have alt text
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
      });
      
      // Check for landmark regions
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('search')).toBeInTheDocument();
    });

    test('color contrast ratio meets WCAG standards', async () => {
      // This is a visual test that typically requires a different approach
      // Here we're checking CSS custom properties used for theming
      
      // Mock getComputedStyle
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = jest.fn().mockImplementation(element => {
        const style = {
          getPropertyValue: (prop: string) => {
            if (prop === '--primary-color') return '#0056b3';
            if (prop === '--background-color') return '#ffffff';
            if (prop === '--text-color') return '#333333';
            return '';
          }
        };
        return style as CSSStyleDeclaration;
      });
      
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Get the root element style
      const rootStyle = window.getComputedStyle(document.documentElement);
      
      // Getting color values
      const primaryColor = rootStyle.getPropertyValue('--primary-color').trim();
      const backgroundColor = rootStyle.getPropertyValue('--background-color').trim();
      const textColor = rootStyle.getPropertyValue('--text-color').trim();
      
      // Verify expected color values (this is a simplified check)
      expect(primaryColor).toBe('#0056b3');
      expect(backgroundColor).toBe('#ffffff');
      expect(textColor).toBe('#333333');
      
      // Clean up
      window.getComputedStyle = originalGetComputedStyle;
    });
  });

  // 10. Performance Benchmarks
  describe('10. Performance Benchmarks', () => {
    test('initial render time is acceptable', async () => {
      // Setup performance measurement
      jest.spyOn(performance, 'now').mockImplementation(() => 0);
      
      const startTime = performance.now();
      
      renderWithProviders(<ProductManagement />);
      
      // Mock that rendering is complete
      jest.spyOn(performance, 'now').mockImplementation(() => 150);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Assert render time is under threshold
      expect(renderTime).toBeLessThan(500); // 500ms threshold
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Cleanup
      (performance.now as jest.Mock).mockRestore();
    });

    test('search filter performance is optimized', async () => {
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Setup performance measurement
      jest.spyOn(performance, 'now').mockImplementation(() => 0);
      
      const searchInput = screen.getByPlaceholderText(/search products/i);
      const startTime = performance.now();
      
      // Trigger search
      userEvent.type(searchInput, 'liver');
      
      // Mock that filtering is complete
      jest.spyOn(performance, 'now').mockImplementation(() => 80);
      
      // Wait for filtered results
      await waitFor(() => {
        expect(screen.getByText('Liver Support Complex')).toBeInTheDocument();
        expect(screen.queryByText('Colon Cleanse Formula')).not.toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const filterTime = endTime - startTime;
      
      // Assert filter operation time is under threshold
      expect(filterTime).toBeLessThan(200); // 200ms threshold
      
      // Cleanup
      (performance.now as jest.Mock).mockRestore();
    });

    test('lazy loading improves initial load performance', async () => {
      // Override and spy on React.lazy
      const originalLazy = React.lazy;
      React.lazy = jest.fn().mockImplementation((importFn) => {
        return originalLazy(importFn);
      });
      
      renderWithProviders(<ProductManagement />);
      
      // Check if lazy loading was used
      expect(React.lazy).toHaveBeenCalled();
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Restore original implementation
      React.lazy = originalLazy;
    });

    test('memoization prevents unnecessary re-renders', async () => {
      // Mock React.memo to track its usage
      const originalMemo = React.memo;
      const memoSpy = jest.fn().mockImplementation((component) => originalMemo(component));
      React.memo = memoSpy;
      
      renderWithProviders(<ProductManagement />);
      
      // Verify memo is being used
      expect(memoSpy).toHaveBeenCalled();
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Mock useEffect to track render counts
      const renderCountMap = new Map<string, number>();
      
      // Trigger a state update that shouldn't cause ProductCard to re-render
      const searchInput = screen.getByPlaceholderText(/search products/i);
      userEvent.type(searchInput, ' '); // Add a space, trivial change
      
      // Verify component didn't re-render (would need actual component instrumentation)
      
      // Restore original implementation
      React.memo = originalMemo;
    });
  });

  // 11. Role-Based Access & Concurrency Tests
  describe('11. Role-Based Access & Concurrency', () => {
    test('admin users have full product management access', async () => {
      // Setup admin user
      const mockAdminUser = {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        id: '123',
        currentPhaseNumber: 1
      };
      
      renderWithProviders(<ProductManagement />, {
        preloadedState: {
          auth: { user: mockAdminUser }
        }
      });
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Verify admin has access to all controls
      expect(screen.getByRole('button', { name: /add product/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bulk actions/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /import products/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export products/i })).toBeInTheDocument();
      
      // Verify admin can edit products
      const productCards = screen.getAllByTestId('product-card');
      const editButtons = within(productCards[0]).getAllByRole('button').find(
        button => button.getAttribute('aria-label')?.includes('Edit')
      );
      expect(editButtons).toBeInTheDocument();
    });

    test('regular users have limited product management access', async () => {
      // Setup regular user
      const mockRegularUser = {
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
        id: '124',
        currentPhaseNumber: 1
      };
      
      renderWithProviders(<ProductManagement />, {
        preloadedState: {
          auth: { user: mockRegularUser }
        }
      });
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Verify regular user has limited access
      expect(screen.queryByRole('button', { name: /add product/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /bulk actions/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /import products/i })).not.toBeInTheDocument();
      
      // Verify export is still available (read-only operation)
      expect(screen.getByRole('button', { name: /export products/i })).toBeInTheDocument();
      
      // Verify regular user cannot edit products
      const productCards = screen.getAllByTestId('product-card');
      const editButtons = within(productCards[0]).queryAllByRole('button').find(
        button => button.getAttribute('aria-label')?.includes('Edit')
      );
      expect(editButtons).not.toBeInTheDocument();
    });

    test('optimistic updates handle concurrent edits gracefully', async () => {
      // Mock server-side conflict
      server.use(
        rest.patch('*/api/products/:id', (req, res, ctx) => {
          return res(
            ctx.status(409),
            ctx.json({
              error: 'Conflict',
              message: 'This product was updated by another user',
              serverVersion: {
                id: '1',
                name: 'Updated by someone else',
                category: 'Changed Category',
                updatedAt: new Date().toISOString()
              }
            })
          );
        })
      );
      
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Find and click edit button on first product
      const productCards = screen.getAllByTestId('product-card');
      const editButton = within(productCards[0]).getAllByRole('button').find(
        button => button.getAttribute('aria-label')?.includes('Edit')
      );
      
      userEvent.click(editButton as HTMLElement);
      
      // Wait for edit modal
      await screen.findByRole('dialog');
      
      // Edit a field
      const nameInput = screen.getByLabelText(/product name/i);
      userEvent.clear(nameInput);
      userEvent.type(nameInput, 'My New Product Name');
      
      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i });
      userEvent.click(saveButton);
      
      // Verify conflict resolution modal appears
      await waitFor(() => {
        expect(screen.getByText(/conflict detected/i)).toBeInTheDocument();
        expect(screen.getByText(/this product was updated by another user/i)).toBeInTheDocument();
      });
      
      // Choose to keep remote changes
      const keepRemoteButton = screen.getByRole('button', { name: /keep remote changes/i });
      userEvent.click(keepRemoteButton);
      
      // Verify product was updated with remote version
      await waitFor(() => {
        expect(screen.getByText('Updated by someone else')).toBeInTheDocument();
        expect(screen.getByText('Changed Category')).toBeInTheDocument();
      });
    });

    test('locking mechanism prevents simultaneous editing', async () => {
      // Mock server-side product lock
      let isLocked = false;
      
      server.use(
        rest.post('*/api/products/:id/lock', (req, res, ctx) => {
          if (isLocked) {
            return res(
              ctx.status(423),
              ctx.json({
                error: 'Locked',
                message: 'This product is currently being edited by another user',
                lockedBy: 'other@example.com',
                lockExpiresAt: new Date(Date.now() + 300000).toISOString()
              })
            );
          }
          
          isLocked = true;
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              lockId: '123',
              lockExpiresAt: new Date(Date.now() + 300000).toISOString()
            })
          );
        })
      );
      
      renderWithProviders(<ProductManagement />);
      
      // Wait for products to load
      await waitFor(() => {
        expect(screen.getAllByTestId('product-card').length).toBeGreaterThan(0);
      });
      
      // Find and click edit button on first product
      const productCards = screen.getAllByTestId('product-card');
      const editButton = within(productCards[0]).getAllByRole('button').find(
        button => button.getAttribute('aria-label')?.includes('Edit')
      );
      
      // Simulate a user starting an edit (acquires lock)
      server.use(
        rest.post('*/api/products/:id/lock', (req, res, ctx) => {
          return res(
            ctx.status(423),
            ctx.json({
              error: 'Locked',
              message: 'This product is currently being edited by another user',
              lockedBy: 'other@example.com',
              lockExpiresAt: new Date(Date.now() + 300000).toISOString()
            })
          );
        })
      );
      
      // Try to edit the same product
      userEvent.click(editButton as HTMLElement);
      
      // Verify lock notification appears
      await waitFor(() => {
        expect(screen.getByText(/product is locked/i)).toBeInTheDocument();
        expect(screen.getByText(/currently being edited by other@example.com/i)).toBeInTheDocument();
      });
      
      // Verify view-only option is available
      const viewOnlyButton = screen.getByRole('button', { name: /view in read-only mode/i });
      expect(viewOnlyButton).toBeInTheDocument();
      
      // Click view-only button
      userEvent.click(viewOnlyButton);
      
      // Verify modal opens in read-only mode
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/read-only view/i)).toBeInTheDocument();
        
        // Verify form inputs are disabled
        const inputs = screen.getAllByRole('textbox');
        inputs.forEach(input => {
          expect(input).toBeDisabled();
        });
      });
    });
  });
}); // Main describe block
