import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PreferencesPanel from '../PreferencesPanel'
import { PreferencesProvider } from '@/contexts/PreferencesContext'
import { SessionProvider } from 'next-auth/react'
import '@testing-library/jest-dom'
import { mockSession } from '@/contexts/__tests__/setup'

// Import these to ensure TypeScript recognizes all matchers
import * as matchers from '@testing-library/jest-dom/matchers'
import { expect } from '@jest/globals'

// Extend Jest with all matchers
expect.extend(matchers)

// Mock toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

// Define a helper function to render with providers for cleaner tests
const renderWithProviders = (ui: React.ReactElement) => {
  return {
    user: userEvent.setup(),
    ...render(
      <SessionProvider session={mockSession}>
        <PreferencesProvider>
          {ui}
        </PreferencesProvider>
      </SessionProvider>
    )
  }
}

// Setup test mocking
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Configure fetch mock for this test
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/api/preferences')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          theme: 'light',
          notifications: {
            email: true,
            push: false,
            sms: true
          },
          language: 'en',
          dataSync: {
            autoSync: true,
            syncInterval: 'daily'
          }
        })
      });
    }
    // Default response for any other endpoint
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    });
  });
});

describe('PreferencesPanel', () => {
  it('renders loading state initially', async () => {
    renderWithProviders(<PreferencesPanel />);
    
    // Should show loading state
    expect(screen.getByText(/loading preferences/i)).toBeInTheDocument();
  });

  it('loads and displays preferences after API call', async () => {
    const { user } = renderWithProviders(<PreferencesPanel />);
    
    // Wait for preferences to load
    await waitFor(() => {
      expect(screen.queryByText(/loading preferences/i)).not.toBeInTheDocument();
    });
    
    // Check if form elements display correct values
    expect(screen.getByLabelText(/theme/i)).toBeInTheDocument();
    
    // Check radio buttons for notification preferences
    const emailToggle = screen.getByLabelText(/email notifications/i);
    expect(emailToggle).toHaveAttribute('data-state', 'checked');
    
    // Verify language selection
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
    
    // Test interaction: toggle a setting
    await user.click(emailToggle);
    
    // Verify form submission
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);
    
    // Verify API call with updated preferences
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/preferences', 
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining(JSON.stringify({
            theme: 'light',
            notifications: { email: false, push: false, sms: true },
            language: 'en',
            dataSync: { autoSync: true, syncInterval: 'daily' }
          }))
        })
      );
    });
  });

  it('renders all preference tabs', async () => {
    const { user } = renderWithProviders(<PreferencesPanel />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading preferences/i)).not.toBeInTheDocument();
    });
    
    // Check that all tabs are present
    expect(screen.getByRole('tab', { name: /display/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /reminders/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /accessibility/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /localization/i })).toBeInTheDocument()
  })

  it('allows theme switching', async () => {
    const { user } = renderWithProviders(<PreferencesPanel />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading preferences/i)).not.toBeInTheDocument();
    });
    
    // Initial state should be system theme
    expect(screen.getByRole('tab', { name: /display/i })).toHaveAttribute('aria-selected', 'true')
    
    // Open theme accordion
    await user.click(screen.getByText('Theme'))
    
    // Select dark theme
    await user.click(screen.getByText('Dark'))
    
    // Verify API was called to update preference
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/preferences',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })
  })

  it('allows changing measurement units', async () => {
    const { user } = renderWithProviders(<PreferencesPanel />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading preferences/i)).not.toBeInTheDocument();
    })
    
    // Open measurement units accordion
    await user.click(screen.getByText('Measurement Units'))
    
    // Open the select
    await user.click(screen.getByRole('combobox', { name: /unit system/i }))
    
    // Select metric
    await user.click(screen.getByText('Metric (kg, cm)'))
    
    // Verify API was called to update preference
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/preferences',
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  it('allows switching tabs', async () => {
    const { user } = renderWithProviders(<PreferencesPanel />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading preferences/i)).not.toBeInTheDocument();
    })
    
    // Initial tab is Display
    expect(screen.getByRole('tab', { name: /display/i })).toHaveAttribute('aria-selected', 'true')
    
    // Switch to Reminders tab
    await user.click(screen.getByRole('tab', { name: /reminders/i }))
    
    // Verify Reminders tab is now selected
    expect(screen.getByRole('tab', { name: /reminders/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Reminder Timing')).toBeInTheDocument()
    
    // Switch to Accessibility tab
    await user.click(screen.getByRole('tab', { name: /accessibility/i }))
    
    // Verify Accessibility tab is now selected
    expect(screen.getByRole('tab', { name: /accessibility/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Reduced Motion')).toBeInTheDocument()
  })

  it('allows resetting preferences', async () => {
    const { user } = renderWithProviders(<PreferencesPanel />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading preferences/i)).not.toBeInTheDocument();
    })
    
    // Click reset button
    await user.click(screen.getByRole('button', { name: /reset to defaults/i }))
    
    // Verify API was called to update preferences
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/preferences',
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  it('allows toggling accessibility settings', async () => {
    const { user } = renderWithProviders(<PreferencesPanel />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading preferences/i)).not.toBeInTheDocument();
    })
    
    // Switch to Accessibility tab
    await user.click(screen.getByRole('tab', { name: /accessibility/i }))
    
    // Open Motion & Animation accordion
    await user.click(screen.getByText('Motion & Animation'))
    
    // Toggle Reduced Motion switch
    const reducedMotionSwitch = screen.getByRole('switch', { name: /reduced motion/i })
    await user.click(reducedMotionSwitch)
    
    // Verify API was called to update preferences
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/preferences',
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  it('handles keyboard navigation correctly', async () => {
    const { user } = renderWithProviders(<PreferencesPanel />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading preferences/i)).not.toBeInTheDocument();
    })
    
    // Start with first tab (Display)
    const displayTab = screen.getByRole('tab', { name: /display/i })
    displayTab.focus()
    
    // Move to next tab with keyboard
    await user.keyboard('{arrowright}')
    
    // Check if focus moved to Reminders tab
    expect(screen.getByRole('tab', { name: /reminders/i })).toHaveFocus()
    
    // Press enter to select tab
    await user.keyboard('{enter}')
    
    // Verify Reminders tab is now selected
    expect(screen.getByRole('tab', { name: /reminders/i })).toHaveAttribute('aria-selected', 'true')
  })
})
