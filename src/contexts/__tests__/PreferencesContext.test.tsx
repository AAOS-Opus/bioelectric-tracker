import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PreferencesProvider, usePreferences } from '@/contexts/PreferencesContext'
import { SessionProvider } from 'next-auth/react'
import '@testing-library/jest-dom'
import { mockSession } from './setup'

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock matchMedia
window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}))

// Mock online/offline state
Object.defineProperty(window.navigator, 'onLine', { value: true, writable: true })

// Test component to interact with preferences context
const TestPreferencesComponent = () => {
  const {
    preferences,
    setPreference,
    setDisplayPreference,
    setReminderPreference,
    setAccessibilityPreference,
    resetPreferences,
    isLoading,
    isSyncing,
    syncStatus
  } = usePreferences()

  return (
    <div>
      <div data-testid="loading-state">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="syncing-state">{isSyncing ? 'Syncing' : 'Not Syncing'}</div>
      <div data-testid="sync-status">{syncStatus}</div>
      <div data-testid="theme-value">{preferences.theme}</div>
      <div data-testid="measurement-value">{preferences.display?.measurementUnit}</div>
      <div data-testid="lead-time-value">{preferences.reminderDefaults?.leadTime}</div>
      
      <button 
        data-testid="change-theme-btn"
        onClick={() => setPreference('theme', 'dark')}
      >
        Change Theme
      </button>
      
      <button 
        data-testid="change-measurement-btn"
        onClick={() => setDisplayPreference('measurementUnit', 'metric')}
      >
        Change Measurement
      </button>
      
      <button 
        data-testid="change-reminder-btn"
        onClick={() => setReminderPreference('leadTime', 30)}
      >
        Change Lead Time
      </button>
      
      <button 
        data-testid="change-accessibility-btn"
        onClick={() => setAccessibilityPreference('reducedMotion', true)}
      >
        Toggle Reduced Motion
      </button>
      
      <button 
        data-testid="reset-btn"
        onClick={resetPreferences}
      >
        Reset Preferences
      </button>
    </div>
  )
}

describe('PreferencesContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    
    // Mock successful API responses
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            theme: 'system',
            notificationSettings: {
              email: true,
              inApp: true,
              sms: false
            },
            display: {
              measurementUnit: 'imperial',
              dateFormat: 'MM/DD/YYYY',
              timeFormat: '12h',
              defaultDashboardView: 'weekly',
              language: 'en',
              textDirection: 'ltr',
              accessibility: {
                reducedMotion: false,
                highContrast: false,
                largeText: false,
                screenReaderOptimized: false
              }
            },
            reminderDefaults: {
              leadTime: 15,
              quietHoursStart: '22:00',
              quietHoursEnd: '07:00',
              enableQuietHours: true,
              allowUrgentDuringQuietHours: true
            }
          }
        })
      })
    )
  })

  const renderWithProviders = (ui: React.ReactNode) => {
    return render(
      <SessionProvider session={mockSession}>
        <PreferencesProvider>
          {ui}
        </PreferencesProvider>
      </SessionProvider>
    )
  }

  test('should load preferences from API and update local storage', async () => {
    renderWithProviders(<TestPreferencesComponent />)
    
    // Initially in loading state
    expect(screen.getByTestId('loading-state').textContent).toBe('Loading')
    
    // After loading completes
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Loaded')
    })
    
    // Verify API call was made
    expect(global.fetch).toHaveBeenCalledWith('/api/user/preferences')
    
    // Verify preferences were loaded
    expect(screen.getByTestId('theme-value').textContent).toBe('system')
    expect(screen.getByTestId('measurement-value').textContent).toBe('imperial')
    expect(screen.getByTestId('lead-time-value').textContent).toBe('15')
    
    // Verify localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  test('should update preference with setPreference', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestPreferencesComponent />)
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Loaded')
    })
    
    await user.click(screen.getByTestId('change-theme-btn'))
    
    expect(screen.getByTestId('theme-value').textContent).toBe('dark')
    expect(screen.getByTestId('syncing-state').textContent).toBe('Syncing')
    
    // Wait for sync to complete
    await waitFor(() => {
      expect(screen.getByTestId('sync-status').textContent).toBe('synced')
    })
    
    // Verify API was called
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/user/preferences',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    )
    
    // Verify localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  test('should update display preference with setDisplayPreference', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestPreferencesComponent />)
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Loaded')
    })
    
    await user.click(screen.getByTestId('change-measurement-btn'))
    
    expect(screen.getByTestId('measurement-value').textContent).toBe('metric')
    
    // Wait for sync to complete
    await waitFor(() => {
      expect(screen.getByTestId('sync-status').textContent).toBe('synced')
    })
  })

  test('should update reminder preference with setReminderPreference', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestPreferencesComponent />)
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Loaded')
    })
    
    await user.click(screen.getByTestId('change-reminder-btn'))
    
    expect(screen.getByTestId('lead-time-value').textContent).toBe('30')
    
    // Wait for sync to complete
    await waitFor(() => {
      expect(screen.getByTestId('sync-status').textContent).toBe('synced')
    })
  })
  
  test('should reset preferences to default values', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestPreferencesComponent />)
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Loaded')
    })
    
    // First change a preference
    await user.click(screen.getByTestId('change-theme-btn'))
    expect(screen.getByTestId('theme-value').textContent).toBe('dark')
    
    // Then reset
    await user.click(screen.getByTestId('reset-btn'))
    
    // Verify reset to default
    expect(screen.getByTestId('theme-value').textContent).toBe('system')
    expect(screen.getByTestId('measurement-value').textContent).toBe('imperial')
    expect(screen.getByTestId('lead-time-value').textContent).toBe('15')
    
    // Wait for sync to complete
    await waitFor(() => {
      expect(screen.getByTestId('sync-status').textContent).toBe('synced')
    })
  })
  
  test('should handle offline state by queuing changes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TestPreferencesComponent />)
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('Loaded')
    })
    
    // Set offline
    Object.defineProperty(window.navigator, 'onLine', { value: false })
    window.dispatchEvent(new Event('offline'))
    
    // Update preference offline
    await user.click(screen.getByTestId('change-theme-btn'))
    expect(screen.getByTestId('theme-value').textContent).toBe('dark')
    
    // Verify local change but no API call
    expect(localStorageMock.setItem).toHaveBeenCalled()
    expect(global.fetch).toHaveBeenCalledTimes(1) // Only initial load, not the update
    
    // Come back online and verify sync happens
    Object.defineProperty(window.navigator, 'onLine', { value: true })
    window.dispatchEvent(new Event('online'))
    
    // Wait for sync after reconnection
    await waitFor(() => {
      expect(screen.getByTestId('sync-status').textContent).toBe('synced')
    })
    
    // Verify API was called with update
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
