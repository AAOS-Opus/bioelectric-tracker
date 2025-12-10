'use client'

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  ReactNode 
} from 'react'
import { 
  ExtendedUserPreferences, 
  PreferencesContextType, 
  DisplayPreferences, 
  ReminderDefaults, 
  AccessibilitySettings,
  DEFAULT_DISPLAY_PREFERENCES,
  DEFAULT_REMINDER_DEFAULTS,
  DEFAULT_THEME_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_DATA_VISUALIZATION_PREFERENCES,
  DEFAULT_DATA_HANDLING_PREFERENCES,
  DEFAULT_BEHAVIORAL_PREFERENCES,
  ThemeSettings,
  NotificationSettings,
  DataVisualizationPreferences,
  UICustomization,
  DataHandlingPreferences,
  BehavioralPreferences
} from '@/types/preferences'
import { useSession } from 'next-auth/react'
import { throttle } from 'lodash'

// Create context with default values
const PreferencesContext = createContext<PreferencesContextType>({
  preferences: {} as ExtendedUserPreferences,
  setPreference: () => {},
  setDisplayPreference: () => {},
  setReminderPreference: () => {},
  setAccessibilityPreference: () => {},
  setThemePreference: () => {},
  setNotificationPreference: () => {},
  setDataVisualizationPreference: () => {},
  setUICustomizationPreference: () => {},
  setDataHandlingPreference: () => {},
  setBehavioralPreference: () => {},
  resetPreferences: () => {},
  isLoading: true,
  isSyncing: false,
  syncStatus: 'idle',
  lastSyncedAt: null
})

// Create initial empty state
const createEmptyPreferences = (): ExtendedUserPreferences => ({
  notificationSettings: {
    email: true,
    inApp: true,
    sms: false
  },
  theme: DEFAULT_THEME_SETTINGS,
  dataSharing: {
    shareBiomarkers: false,
    shareJournalEntries: false,
    shareProgress: false
  },
  privacySettings: {
    encryptJournalEntries: false,
    twoFactorAuthentication: false
  },
  display: DEFAULT_DISPLAY_PREFERENCES,
  reminderDefaults: DEFAULT_REMINDER_DEFAULTS,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  dataVisualization: DEFAULT_DATA_VISUALIZATION_PREFERENCES,
  dataHandling: DEFAULT_DATA_HANDLING_PREFERENCES,
  behavioral: DEFAULT_BEHAVIORAL_PREFERENCES
})

interface PreferencesProviderProps {
  children: ReactNode
}

export const PreferencesProvider = ({ children }: PreferencesProviderProps) => {
  const { data: session, status } = useSession()
  const [preferences, setPreferences] = useState<ExtendedUserPreferences>(createEmptyPreferences())
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [offlineChanges, setOfflineChanges] = useState<Partial<ExtendedUserPreferences>>({})
  const [isOnline, setIsOnline] = useState(true)

  // Load preferences from local storage on mount or when user changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadPreferences = async () => {
      setIsLoading(true)

      try {
        // First try to load from localStorage as a fallback
        const localPreferences = localStorage.getItem('userPreferences')
        if (localPreferences) {
          setPreferences(JSON.parse(localPreferences))
        }

        // If authenticated, fetch from API
        if (session?.user?.id) {
          const response = await fetch('/api/user/preferences')
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data) {
              setPreferences(data.data)
              // Update local storage with server data
              localStorage.setItem('userPreferences', JSON.stringify(data.data))
              setLastSyncedAt(new Date().toISOString())
              setSyncStatus('synced')
            }
          }
        }
      } catch (error) {
        console.error('Failed to load preferences:', error)
        // Fallback to defaults if nothing in localStorage
        if (!localStorage.getItem('userPreferences')) {
          setPreferences(createEmptyPreferences())
        }
        setSyncStatus('error')
      } finally {
        setIsLoading(false)
      }
    }

    if (status !== 'loading') {
      loadPreferences()
    }
  }, [session?.user?.id, status])

  // Handle online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sync preferences to the server (throttled to prevent excessive API calls)
  const syncToServer = useCallback(
    throttle(async (updatedPreferences: ExtendedUserPreferences) => {
      if (!session?.user?.id || !isOnline) {
        // Store changes for later if offline
        if (!isOnline) {
          setOfflineChanges(updatedPreferences)
        }
        return
      }
      
      setIsSyncing(true)
      setSyncStatus('syncing')
      
      try {
        const response = await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedPreferences)
        })
        
        if (response.ok) {
          const now = new Date().toISOString()
          setLastSyncedAt(now)
          setSyncStatus('synced')
          
          // Update localStorage with latest data including server timestamp
          const syncedPreferences = {
            ...updatedPreferences,
            lastSyncedAt: now
          }
          localStorage.setItem('userPreferences', JSON.stringify(syncedPreferences))
          setOfflineChanges({})
        } else {
          setSyncStatus('error')
        }
      } catch (error) {
        console.error('Failed to sync preferences:', error)
        setSyncStatus('error')
      } finally {
        setIsSyncing(false)
      }
    }, 500),
    [session?.user?.id, isOnline]
  )

  // Handle offline queue sync when coming back online
  useEffect(() => {
    if (isOnline && Object.keys(offlineChanges).length > 0) {
      syncToServer({
        ...preferences,
        ...offlineChanges
      })
    }
  }, [isOnline, offlineChanges, preferences, syncToServer])

  // Set a specific preference
  const setPreference = useCallback(<K extends keyof ExtendedUserPreferences>(
    key: K,
    value: ExtendedUserPreferences[K]
  ) => {
    setPreferences(prev => {
      const updated = {
        ...prev,
        [key]: value
      }

      // Update localStorage immediately for a responsive feel
      if (typeof window !== 'undefined') {
        localStorage.setItem('userPreferences', JSON.stringify(updated))
      }

      // Start sync process
      syncToServer(updated)

      return updated
    })
  }, [syncToServer])

  // Set a specific display preference
  const setDisplayPreference = useCallback(<K extends keyof DisplayPreferences>(
    key: K,
    value: DisplayPreferences[K]
  ) => {
    setPreferences(prev => {
      const updated = {
        ...prev,
        display: {
          ...prev.display,
          [key]: value
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('userPreferences', JSON.stringify(updated))
      }
      syncToServer(updated)

      return updated
    })
  }, [syncToServer])

  // Set a specific reminder preference
  const setReminderPreference = useCallback(<K extends keyof ReminderDefaults>(
    key: K,
    value: ReminderDefaults[K]
  ) => {
    setPreferences(prev => {
      const updated = {
        ...prev,
        reminderDefaults: {
          ...prev.reminderDefaults,
          [key]: value
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('userPreferences', JSON.stringify(updated))
      }
      syncToServer(updated)

      return updated
    })
  }, [syncToServer])

  // Set a specific accessibility preference
  const setAccessibilityPreference = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setPreferences(prev => {
      const updated = {
        ...prev,
        display: {
          ...prev.display,
          accessibility: {
            ...prev.display.accessibility,
            [key]: value
          }
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('userPreferences', JSON.stringify(updated))
      }
      syncToServer(updated)

      return updated
    })
  }, [syncToServer])

  // Set a specific theme preference
  const setThemePreference = useCallback(<K extends keyof ThemeSettings>(
    key: K,
    value: ThemeSettings[K]
  ) => {
    setPreferences(prev => {
      const updated = {
        ...prev,
        theme: {
          ...prev.theme,
          [key]: value
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('userPreferences', JSON.stringify(updated))
      }
      syncToServer(updated)

      return updated
    })
  }, [syncToServer])

  // Set a specific notification preference
  const setNotificationPreference = useCallback(<K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setPreferences(prev => {
      const updated = {
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: value
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('userPreferences', JSON.stringify(updated))
      }
      syncToServer(updated)

      return updated
    })
  }, [syncToServer])

  // Set a specific data visualization preference
  const setDataVisualizationPreference = useCallback(<K extends keyof DataVisualizationPreferences>(
    key: K,
    value: DataVisualizationPreferences[K]
  ) => {
    setPreferences(prev => {
      const updated = {
        ...prev,
        dataVisualization: {
          ...prev.dataVisualization,
          [key]: value
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('userPreferences', JSON.stringify(updated))
      }
      syncToServer(updated)

      return updated
    })
  }, [syncToServer])

  // Set a specific UI customization preference
  const setUICustomizationPreference = useCallback(<K extends keyof UICustomization>(
    key: K,
    value: UICustomization[K]
  ) => {
    setPreferences(prev => {
      const updated = {
        ...prev,
        display: {
          ...prev.display,
          uiCustomization: {
            ...prev.display.uiCustomization,
            [key]: value
          }
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('userPreferences', JSON.stringify(updated))
      }
      syncToServer(updated)

      return updated
    })
  }, [syncToServer])

  // Set a specific data handling preference
  const setDataHandlingPreference = useCallback(<K extends keyof DataHandlingPreferences>(
    key: K,
    value: DataHandlingPreferences[K]
  ) => {
    setPreferences(prev => {
      const updated = {
        ...prev,
        dataHandling: {
          ...prev.dataHandling,
          [key]: value
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('userPreferences', JSON.stringify(updated))
      }
      syncToServer(updated)

      return updated
    })
  }, [syncToServer])

  // Set a specific behavioral preference
  const setBehavioralPreference = useCallback(<K extends keyof BehavioralPreferences>(
    key: K,
    value: BehavioralPreferences[K]
  ) => {
    setPreferences(prev => {
      const updated = {
        ...prev,
        behavioral: {
          ...prev.behavioral,
          [key]: value
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('userPreferences', JSON.stringify(updated))
      }
      syncToServer(updated)

      return updated
    })
  }, [syncToServer])

  // Reset preferences to defaults
  const resetPreferences = useCallback(() => {
    const defaultPreferences = createEmptyPreferences()
    setPreferences(defaultPreferences)
    if (typeof window !== 'undefined') {
      localStorage.setItem('userPreferences', JSON.stringify(defaultPreferences))
    }
    syncToServer(defaultPreferences)
  }, [syncToServer])

  // Apply global theme based on preference
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!preferences.theme?.mode) return

    const currentHour = new Date().getHours();
    const [startHour] = preferences.theme.schedule.darkModeStart.split(':').map(Number);
    const [endHour] = preferences.theme.schedule.darkModeEnd.split(':').map(Number);

    // Check if current time is within dark mode schedule
    const isScheduledDarkMode = preferences.theme.schedule.enabled &&
      ((startHour > endHour) ?
        (currentHour >= startHour || currentHour < endHour) :
        (currentHour >= startHour && currentHour < endHour));

    const isDark =
      preferences.theme.mode === 'dark' ||
      (preferences.theme.mode === 'scheduled' && isScheduledDarkMode) ||
      (preferences.theme.mode === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    if (preferences.theme.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Apply font family
    document.documentElement.style.setProperty('--font-family', 
      preferences.theme.fontFamily === 'system' ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' :
      preferences.theme.fontFamily === 'serif' ? 'Georgia, Times, "Times New Roman", serif' :
      preferences.theme.fontFamily === 'sans-serif' ? 'Helvetica, Arial, sans-serif' :
      'Consolas, Monaco, "Andale Mono", monospace');
    
    // Apply font size
    document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
    document.documentElement.classList.add(
      preferences.theme.fontSize === 'small' ? 'text-sm' :
      preferences.theme.fontSize === 'medium' ? 'text-base' :
      preferences.theme.fontSize === 'large' ? 'text-lg' : 'text-xl'
    );
    
    // Apply custom color palette if enabled
    if (preferences.theme.useCustomPalette && preferences.theme.customPalette) {
      const { customPalette } = preferences.theme;
      Object.entries(customPalette).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--color-${key}`, value);
      });
    } else {
      // Reset to default palette
      const defaultColors = {
        primary: '',
        secondary: '',
        accent: '',
        success: '',
        warning: '',
        error: '',
        background: '',
        text: ''
      };
      
      Object.keys(defaultColors).forEach(key => {
        document.documentElement.style.removeProperty(`--color-${key}`);
      });
    }
  }, [preferences.theme])

  // Apply accessibility preferences globally
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!preferences.display?.accessibility) return

    const {
      reducedMotion,
      highContrast,
      largeText,
      screenReaderOptimized,
      useSimplifiedLanguage,
      enableAudioCues,
      enhancedFocus
    } = preferences.display.accessibility
    
    // Reduced motion
    if (reducedMotion) {
      document.documentElement.classList.add('motion-reduce')
    } else {
      document.documentElement.classList.remove('motion-reduce')
    }
    
    // High contrast (already handled in theme effect)
    if (highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
    
    // Large text
    if (largeText) {
      document.documentElement.classList.add('text-lg')
    } else {
      document.documentElement.classList.remove('text-lg')
    }

    // Screen reader optimized
    if (screenReaderOptimized) {
      document.documentElement.classList.add('sr-optimize')
    } else {
      document.documentElement.classList.remove('sr-optimize')
    }

    // Simplified language
    if (useSimplifiedLanguage) {
      document.documentElement.classList.add('simple-language')
    } else {
      document.documentElement.classList.remove('simple-language')
    }

    // Audio cues
    if (enableAudioCues) {
      document.documentElement.classList.add('audio-cues')
    } else {
      document.documentElement.classList.remove('audio-cues')
    }

    // Enhanced focus
    if (enhancedFocus) {
      document.documentElement.classList.add('enhanced-focus')
    } else {
      document.documentElement.classList.remove('enhanced-focus')
    }
  }, [preferences.display?.accessibility])

  // Apply UI customization preferences
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!preferences.display?.uiCustomization) return

    const { density, animationsEnabled } = preferences.display.uiCustomization
    
    // UI density
    document.documentElement.classList.remove('ui-comfortable', 'ui-compact', 'ui-ultra-compact')
    document.documentElement.classList.add(`ui-${density}`)
    
    // Animations
    if (!animationsEnabled) {
      document.documentElement.classList.add('no-animations')
    } else {
      document.documentElement.classList.remove('no-animations')
    }
  }, [preferences.display?.uiCustomization])

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        setPreference,
        setDisplayPreference,
        setReminderPreference,
        setAccessibilityPreference,
        setThemePreference,
        setNotificationPreference,
        setDataVisualizationPreference,
        setUICustomizationPreference,
        setDataHandlingPreference,
        setBehavioralPreference,
        resetPreferences,
        isLoading,
        isSyncing,
        syncStatus,
        lastSyncedAt
      }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

export const usePreferences = () => useContext(PreferencesContext)
