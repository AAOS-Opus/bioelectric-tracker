/**
 * Dark Mode Implementation Testing
 * 
 * Comprehensive tests for validating the dark mode implementation in the 
 * Bioelectric Regeneration Tracker application, focusing on responsiveness,
 * accessibility, user experience, and visual consistency across themes.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { testColorContrast } from '../../tests/utils/a11y-color-contrast';
import { runA11yAudit } from '../../tests/utils/a11y-testing';
import { ThemeProvider, useTheme } from '../../context/ThemeContext'; // Assuming this path
import App from '../../pages/_app'; // Adjust path as needed
import Dashboard from '../../pages/dashboard'; // Adjust path as needed

// Utility to get computed styles from elements
const getComputedStyle = (element: HTMLElement, property: string): string => {
  return window.getComputedStyle(element).getPropertyValue(property);
};

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock matchMedia for system theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false, // Default to light
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Constants for testing
const THEME_STORAGE_KEY = 'bioelectric-theme-preference';
const DARK_MODE_CLASS = 'dark-mode'; // Adjust based on actual implementation
const SCREENSHOT_DIR = path.join(process.cwd(), 'test-results', 'theme-screenshots');

// Helper component to test theme changes
const ThemeTestComponent = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div data-testid="theme-container" className={theme === 'dark' ? 'dark-mode' : 'light-mode'}>
      <h1>Current theme: {theme}</h1>
      <button data-testid="theme-toggle" onClick={toggleTheme}>
        Toggle Theme
      </button>
      <div data-testid="text-element" className="primary-text">
        Sample Text
      </div>
      <button data-testid="primary-button" className="btn-primary">
        Primary Button
      </button>
      <div data-testid="card-element" className="card">
        Card Element
      </div>
    </div>
  );
};

// Wrap component with Theme Provider
const renderWithTheme = (ui: React.ReactElement, initialTheme = 'light') => {
  // Set initial theme
  localStorageMock.setItem(THEME_STORAGE_KEY, initialTheme);
  
  return render(
    <ThemeProvider initialTheme={initialTheme}>
      {ui}
    </ThemeProvider>
  );
};

describe('Dark Mode Implementation', () => {
  // Create screenshot directory if it doesn't exist
  beforeAll(() => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  // Phase 1: Foundation Check
  describe('Theme Foundation', () => {
    test('CSS variables define complete color palette for both themes', () => {
      const { container } = renderWithTheme(<ThemeTestComponent />);
      
      // Light mode check
      const lightRoot = container.firstChild as HTMLElement;
      expect(getComputedStyle(lightRoot, '--background-color')).toBeTruthy();
      expect(getComputedStyle(lightRoot, '--text-color')).toBeTruthy();
      expect(getComputedStyle(lightRoot, '--primary-color')).toBeTruthy();
      
      // Toggle to dark mode
      fireEvent.click(screen.getByTestId('theme-toggle'));
      
      // Dark mode check
      const darkRoot = container.firstChild as HTMLElement;
      expect(getComputedStyle(darkRoot, '--background-color')).toBeTruthy();
      expect(getComputedStyle(darkRoot, '--text-color')).toBeTruthy();
      expect(getComputedStyle(darkRoot, '--primary-color')).toBeTruthy();
    });
    
    test('Theme context provider distributes state across components', () => {
      renderWithTheme(<ThemeTestComponent />);
      expect(screen.getByText('Current theme: light')).toBeInTheDocument();
      
      // Toggle theme
      fireEvent.click(screen.getByTestId('theme-toggle'));
      expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
    });
    
    test('Toggle mechanism allows switching themes', () => {
      renderWithTheme(<ThemeTestComponent />);
      
      // Initial theme
      expect(screen.getByTestId('theme-container')).toHaveClass('light-mode');
      
      // Toggle to dark
      fireEvent.click(screen.getByTestId('theme-toggle'));
      expect(screen.getByTestId('theme-container')).toHaveClass('dark-mode');
      
      // Toggle back to light
      fireEvent.click(screen.getByTestId('theme-toggle'));
      expect(screen.getByTestId('theme-container')).toHaveClass('light-mode');
    });
    
    test('System preference detection works', () => {
      // Mock system preference for dark mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('dark'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn()
        }))
      });
      
      // Render with no initial theme to test system preference
      renderWithTheme(<ThemeTestComponent />, 'system');
      
      // Should default to dark based on system preference
      expect(screen.getByTestId('theme-container')).toHaveClass('dark-mode');
    });
    
    test('Theme preference persists across sessions', () => {
      // Set dark theme
      renderWithTheme(<ThemeTestComponent />, 'light');
      fireEvent.click(screen.getByTestId('theme-toggle'));
      
      // Check local storage
      expect(localStorageMock.getItem(THEME_STORAGE_KEY)).toBe('dark');
      
      // Unmount and remount to simulate new session
      const { unmount } = render(<div />);
      unmount();
      
      // Should initialize with dark theme from storage
      renderWithTheme(<ThemeTestComponent />);
      expect(screen.getByTestId('theme-container')).toHaveClass('dark-mode');
    });
  });

  // Phase 2: Color Palette & Visual Adaptation
  describe('Color Palette & Visual Adaptation', () => {
    test('UI elements switch to dark palette', () => {
      const { container } = renderWithTheme(<ThemeTestComponent />);
      
      // Light mode values
      const lightTextEl = screen.getByTestId('text-element');
      const lightTextColor = getComputedStyle(lightTextEl, 'color');
      const lightBgColor = getComputedStyle(container.firstChild as HTMLElement, 'background-color');
      
      // Toggle to dark mode
      fireEvent.click(screen.getByTestId('theme-toggle'));
      
      // Colors should change
      const darkTextColor = getComputedStyle(lightTextEl, 'color');
      const darkBgColor = getComputedStyle(container.firstChild as HTMLElement, 'background-color');
      
      expect(darkTextColor).not.toBe(lightTextColor);
      expect(darkBgColor).not.toBe(lightBgColor);
    });
    
    test('Text maintains sufficient contrast ratio', async () => {
      const { container } = renderWithTheme(<ThemeTestComponent />, 'dark');
      
      const contrastResults = testColorContrast(container as HTMLElement);
      
      // All text should pass the 7:1 contrast ratio for AAA compliance
      const textElements = Array.from(container.querySelectorAll('[data-testid="text-element"]'));
      textElements.forEach(element => {
        const elementResult = contrastResults.results.find(r => r.element === element);
        expect(elementResult?.passes).toBe(true);
        expect(elementResult?.contrastRatio).toBeGreaterThanOrEqual(7);
      });
    });
  });

  // Phase 3: Smooth Transitions
  describe('Smooth Transitions', () => {
    test('Theme switching completes within acceptable time', async () => {
      renderWithTheme(<ThemeTestComponent />);
      
      const startTime = performance.now();
      
      // Toggle theme
      fireEvent.click(screen.getByTestId('theme-toggle'));
      
      // Wait for transition to complete
      await waitFor(() => {
        expect(screen.getByTestId('theme-container')).toHaveClass('dark-mode');
      });
      
      const endTime = performance.now();
      const transitionTime = endTime - startTime;
      
      // Transition should be under 300ms
      expect(transitionTime).toBeLessThan(300);
    });
  });

  // Phase 6: Accessibility in Dark Mode
  describe('Accessibility in Dark Mode', () => {
    test('Dark mode meets WCAG AAA compliance for text contrast', async () => {
      const { container } = renderWithTheme(<ThemeTestComponent />, 'dark');
      
      // Run axe accessibility tests
      const results = await axe(container);
      expect(results.violations.filter(v => v.id === 'color-contrast')).toHaveLength(0);
      
      // Double-check with our contrast utility
      const contrastResults = testColorContrast(container as HTMLElement);
      expect(contrastResults.allElementsPass).toBe(true);
    });
    
    test('Focus indicators are visible in dark mode', () => {
      const { container } = renderWithTheme(<ThemeTestComponent />, 'dark');
      
      // Focus the button
      const button = screen.getByTestId('primary-button');
      button.focus();
      
      // Get focus styles
      const focusStyles = window.getComputedStyle(button);
      const outlineColor = focusStyles.getPropertyValue('outline-color');
      const outlineStyle = focusStyles.getPropertyValue('outline-style');
      
      // Should have a visible outline
      expect(outlineStyle).not.toBe('none');
      expect(outlineColor).not.toBe('transparent');
    });
  });

  // Puppeteer tests for screenshots and advanced testing
  describe('Visual Verification and Cross-Device Testing', () => {
    // This test requires a running app instance
    test.skip('Capture screenshots for light and dark modes', async () => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      
      // Set viewport to desktop size
      await page.setViewport({ width: 1280, height: 800 });
      
      // Navigate to app
      await page.goto('http://localhost:3000');
      
      // Capture light mode screenshot
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, 'light-mode-desktop.png'),
        fullPage: true 
      });
      
      // Toggle to dark mode
      await page.click('[data-testid="theme-toggle"]');
      
      // Wait for transition
      await page.waitForTimeout(500);
      
      // Capture dark mode screenshot
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, 'dark-mode-desktop.png'),
        fullPage: true 
      });
      
      // Test tablet size
      await page.setViewport({ width: 768, height: 1024 });
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, 'dark-mode-tablet.png'),
        fullPage: true 
      });
      
      // Test mobile size
      await page.setViewport({ width: 375, height: 667 });
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, 'dark-mode-mobile.png'),
        fullPage: true 
      });
      
      await browser.close();
    });
  });

  // Contrast ratio matrix generation
  describe('Generate Contrast Ratio Matrix', () => {
    test.skip('Create contrast report for UI elements', async () => {
      const { container } = renderWithTheme(<ThemeTestComponent />, 'dark');
      
      const elements = {
        background: container.querySelector('[data-testid="theme-container"]') as HTMLElement,
        text: container.querySelector('[data-testid="text-element"]') as HTMLElement,
        button: container.querySelector('[data-testid="primary-button"]') as HTMLElement,
        card: container.querySelector('[data-testid="card-element"]') as HTMLElement
      };
      
      const contrastMatrix = {
        'text-on-background': calculateContrastRatio(
          getComputedStyle(elements.text, 'color'), 
          getComputedStyle(elements.background, 'background-color')
        ),
        'button-text-on-button': calculateContrastRatio(
          getComputedStyle(elements.button, 'color'),
          getComputedStyle(elements.button, 'background-color')
        ),
        'card-text-on-card': calculateContrastRatio(
          getComputedStyle(elements.card, 'color'),
          getComputedStyle(elements.card, 'background-color')
        )
      };
      
      // Save matrix to file
      fs.writeFileSync(
        path.join(SCREENSHOT_DIR, 'contrast-matrix.json'),
        JSON.stringify(contrastMatrix, null, 2)
      );
    });
  });
});

// Helper function to calculate contrast ratio (simplified version)
function calculateContrastRatio(foreground: string, background: string): number {
  // Convert colors to relative luminance values
  const foregroundLuminance = getLuminance(foreground);
  const backgroundLuminance = getLuminance(background);
  
  // Calculate contrast ratio
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Simplified luminance calculation
function getLuminance(color: string): number {
  // This is a placeholder function - a full implementation would parse the color
  // and calculate luminance according to WCAG formula
  return 0.5; // Placeholder
}
