/**
 * Theme Utilities for Bioelectric Regeneration Tracker
 * 
 * This file contains utilities for managing theme switching, contrast calculations,
 * and theme-related accessibility verifications.
 */

// Theme type definition
export type Theme = 'light' | 'dark' | 'system';

// Color palette - synchronized with CSS variables
export interface ColorPalette {
  background: string;
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryForeground: string;
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  secondaryForeground: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    placeholder: string;
  };
  medical: {
    blue: string;
    green: string;
    teal: string;
    purple: string;
  };
  status: {
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  border: string;
  borderHover: string;
}

// Light theme palette
export const lightPalette: ColorPalette = {
  background: '#F8F7F4', // Ivory
  surface: '#FFFFFF',
  surfaceHover: '#F5F5F5',
  surfaceActive: '#EEEEEE',
  primary: '#1B365D', // Navy
  primaryHover: '#264573',
  primaryActive: '#315689',
  primaryForeground: '#FFFFFF',
  secondary: '#26A69A',
  secondaryHover: '#2DBCAF',
  secondaryActive: '#34D1C4',
  secondaryForeground: '#FFFFFF',
  text: {
    primary: '#1A1A1A',
    secondary: '#4A4A4A',
    disabled: '#757575',
    placeholder: '#9E9E9E'
  },
  medical: {
    blue: '#4285F4',
    green: '#34A853',
    teal: '#00ACC1',
    purple: '#673AB7'
  },
  status: {
    error: '#D32F2F',
    warning: '#FFA000',
    success: '#388E3C',
    info: '#0288D1'
  },
  border: '#E0E0E0',
  borderHover: '#BDBDBD'
};

// Dark theme palette
export const darkPalette: ColorPalette = {
  background: '#1A1A1A', // Charcoal
  surface: '#2D2D2D',
  surfaceHover: '#363636',
  surfaceActive: '#404040',
  primary: '#4A90E2', // Accessible blue
  primaryHover: '#5B9FE9',
  primaryActive: '#6CAEF0',
  primaryForeground: '#FFFFFF',
  secondary: '#4DB6AC',
  secondaryHover: '#5EC5BB',
  secondaryActive: '#6FD4CA',
  secondaryForeground: '#FFFFFF',
  text: {
    primary: '#F5F5F5', // Off-white
    secondary: '#BDBDBD',
    disabled: '#757575',
    placeholder: '#616161'
  },
  medical: {
    blue: '#64A5F6',
    green: '#66BB6A',
    teal: '#26C6DA',
    purple: '#9575CD'
  },
  status: {
    error: '#EF5350',
    warning: '#FFB74D',
    success: '#66BB6A',
    info: '#4FC3F7'
  },
  border: '#404040',
  borderHover: '#4D4D4D'
};

/**
 * Gets the appropriate color palette based on theme and system preferences
 */
export function getThemePalette(theme: Theme): ColorPalette {
  if (theme === 'system') {
    return prefersColorScheme('dark') ? darkPalette : lightPalette;
  }
  return theme === 'dark' ? darkPalette : lightPalette;
}

/**
 * Apply theme to document by setting CSS variables and data attributes
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const effectiveTheme = theme === 'system' ? (prefersColorScheme('dark') ? 'dark' : 'light') : theme;
  const palette = getThemePalette(theme);

  // Set theme attribute
  root.setAttribute('data-theme', effectiveTheme);

  // Set CSS variables
  Object.entries(palette).forEach(([key, value]) => {
    if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        root.style.setProperty(`--${key}-${subKey}`, String(subValue));
      });
    } else {
      root.style.setProperty(`--${key}`, String(value));
    }
  });

  // Announce theme change to screen readers if not system preference change
  if (theme !== 'system') {
    announceThemeChange(effectiveTheme);
  }
}

/**
 * Calculate contrast ratio between two colors (WCAG formula)
 * @param foreground Foreground color in hex, rgb, or rgba format
 * @param background Background color in hex, rgb, or rgba format
 * @returns Contrast ratio (1:1 to 21:1)
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const fg = getRelativeLuminance(foreground);
  const bg = getRelativeLuminance(background);
  
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG standards
 */
export function meetsContrastStandard(
  ratio: number,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Calculate relative luminance from a color (WCAG formula)
 */
export function getRelativeLuminance(color: string): number {
  const rgb = parseColor(color);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map((val: number) => {
    val = val / 255;
    return val <= 0.03928
      ? val / 12.92
      : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Parse color string to RGB values
 */
export function parseColor(color: string): number[] | null {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16)
      ];
    }
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
      ];
    }
    return null;
  }

  // Handle rgb/rgba colors
  const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return [
      parseInt(match[1], 10),
      parseInt(match[2], 10),
      parseInt(match[3], 10)
    ];
  }

  return null;
}

/**
 * Check if system prefers dark color scheme
 */
export function prefersColorScheme(scheme: 'dark' | 'light'): boolean {
  return window.matchMedia(`(prefers-color-scheme: ${scheme})`).matches;
}

/**
 * Set up system theme change listener
 */
export function listenForSystemThemeChanges(callback: (isDark: boolean) => void): () => void {
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const listener = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };
  
  darkModeMediaQuery.addEventListener('change', listener);
  return () => darkModeMediaQuery.removeEventListener('change', listener);
}

/**
 * Check if system prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Announce theme change to screen readers
 */
function announceThemeChange(theme: 'light' | 'dark'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = `Theme changed to ${theme} mode`;
  
  document.body.appendChild(announcement);
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Calculate if scheduled dark mode should be active
 */
export function shouldUseScheduledDarkMode(
  startHour: number = 20, // 8 PM
  endHour: number = 7     // 7 AM
): boolean {
  const currentHour = new Date().getHours();
  return currentHour >= startHour || currentHour < endHour;
}
