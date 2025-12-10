/**
 * Theme Context for Bioelectric Regeneration Tracker
 * 
 * This context provides theme state and functionality across the application,
 * handling theme persistence, system preference detection, and scheduled theme changes.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Theme, applyTheme, listenForSystemThemeChanges, shouldUseScheduledDarkMode } from '../utils/theme-utils';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark'; // The actual applied theme
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isScheduledDarkModeEnabled: boolean;
  setScheduledDarkMode: (enabled: boolean) => void;
  scheduledDarkModeConfig: { startHour: number; endHour: number };
  updateScheduledDarkModeConfig: (config: { startHour: number; endHour: number }) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage keys
const THEME_STORAGE_KEY = 'bioelectric-theme-preference';
const SCHEDULED_DARK_MODE_KEY = 'bioelectric-scheduled-dark-mode';
const SCHEDULED_CONFIG_KEY = 'bioelectric-scheduled-dark-mode-config';

// Default scheduled dark mode hours
const DEFAULT_DARK_MODE_START = 20; // 8 PM
const DEFAULT_DARK_MODE_END = 7;    // 7 AM

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  initialTheme?: Theme;
}> = ({ children, initialTheme }) => {
  // Initialize theme from storage or prop
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check for stored theme preference
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    
    // Use stored theme, initialTheme prop, or default to system
    return storedTheme || initialTheme || 'system';
  });
  
  // Track if scheduled dark mode is enabled
  const [isScheduledDarkModeEnabled, setScheduledDarkModeState] = useState<boolean>(() => {
    const stored = localStorage.getItem(SCHEDULED_DARK_MODE_KEY);
    return stored ? stored === 'true' : false;
  });
  
  // Store scheduled dark mode configuration
  const [scheduledConfig, setScheduledConfig] = useState<{ startHour: number; endHour: number }>(() => {
    const stored = localStorage.getItem(SCHEDULED_CONFIG_KEY);
    return stored ? 
      JSON.parse(stored) : 
      { startHour: DEFAULT_DARK_MODE_START, endHour: DEFAULT_DARK_MODE_END };
  });
  
  // Track the effective theme (what's actually applied)
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Apply theme based on the current state
  const applyEffectiveTheme = useCallback(() => {
    let themeToApply: Theme = theme;
    
    // Handle scheduled dark mode
    if (isScheduledDarkModeEnabled && theme !== 'dark') {
      if (shouldUseScheduledDarkMode(scheduledConfig.startHour, scheduledConfig.endHour)) {
        themeToApply = 'dark';
      }
    }
    
    // If theme is system, detect preference
    if (themeToApply === 'system') {
      const prefersDark = window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      setEffectiveTheme(prefersDark ? 'dark' : 'light');
      applyTheme(prefersDark ? 'dark' : 'light');
    } else {
      setEffectiveTheme(themeToApply as 'light' | 'dark');
      applyTheme(themeToApply);
    }
  }, [theme, isScheduledDarkModeEnabled, scheduledConfig]);

  // Set theme and store preference
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, []);
  
  // Toggle between light and dark (preserving system if that's the current theme)
  const toggleTheme = useCallback(() => {
    setTheme(
      theme === 'dark' ? 'light' : 
      theme === 'light' ? 'dark' : 
      effectiveTheme === 'dark' ? 'light' : 'dark'
    );
  }, [theme, effectiveTheme, setTheme]);
  
  // Update scheduled dark mode setting
  const setScheduledDarkMode = useCallback((enabled: boolean) => {
    setScheduledDarkModeState(enabled);
    localStorage.setItem(SCHEDULED_DARK_MODE_KEY, String(enabled));
  }, []);
  
  // Update scheduled dark mode hours
  const updateScheduledDarkModeConfig = useCallback((config: { startHour: number; endHour: number }) => {
    setScheduledConfig(config);
    localStorage.setItem(SCHEDULED_CONFIG_KEY, JSON.stringify(config));
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    // Only attach listener if theme is system
    if (theme === 'system') {
      const cleanup = listenForSystemThemeChanges((isDark) => {
        setEffectiveTheme(isDark ? 'dark' : 'light');
        applyTheme(isDark ? 'dark' : 'light');
      });
      
      return cleanup;
    }
  }, [theme]);
  
  // Apply theme when dependencies change
  useEffect(() => {
    applyEffectiveTheme();
  }, [applyEffectiveTheme]);
  
  // Scheduled dark mode time check (every minute)
  useEffect(() => {
    if (!isScheduledDarkModeEnabled) return;
    
    const checkTime = () => {
      if (theme !== 'dark' && shouldUseScheduledDarkMode(scheduledConfig.startHour, scheduledConfig.endHour)) {
        applyTheme('dark');
        setEffectiveTheme('dark');
      } else if (theme !== 'light' && !shouldUseScheduledDarkMode(scheduledConfig.startHour, scheduledConfig.endHour)) {
        applyTheme(theme);
        applyEffectiveTheme();
      }
    };
    
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isScheduledDarkModeEnabled, theme, scheduledConfig, applyEffectiveTheme]);
  
  // Initial theme application (run once on mount)
  useEffect(() => {
    // Prevent flash of incorrect theme
    const root = document.documentElement;
    root.style.visibility = 'hidden';
    
    applyEffectiveTheme();
    
    // Small timeout to ensure CSS variables are applied
    setTimeout(() => {
      root.style.visibility = '';
    }, 50);
  }, []);
  
  // Create memoized context value
  const contextValue = useMemo(() => ({
    theme,
    effectiveTheme,
    toggleTheme,
    setTheme,
    isScheduledDarkModeEnabled,
    setScheduledDarkMode,
    scheduledDarkModeConfig: scheduledConfig,
    updateScheduledDarkModeConfig
  }), [
    theme, 
    effectiveTheme, 
    toggleTheme, 
    setTheme, 
    isScheduledDarkModeEnabled, 
    setScheduledDarkMode, 
    scheduledConfig, 
    updateScheduledDarkModeConfig
  ]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};
