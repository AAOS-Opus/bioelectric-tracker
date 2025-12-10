import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { setViewport, viewports } from './viewport';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { SessionProvider } from 'next-auth/react';

// Mock session data
const mockSession = {
  expires: "1",
  user: { name: "Test User", email: "test@example.com" }
};

// Interface for responsive render options
interface ResponsiveRenderOptions extends RenderOptions {
  viewport?: keyof typeof viewports | { width: number; height: number };
  withPreferences?: boolean;
  withSession?: boolean;
}

/**
 * Renders a component at a specific viewport size with necessary providers
 * @param ui Component to render
 * @param options Render options including viewport size and provider flags
 * @returns RenderResult with additional viewport helpers
 */
export const renderWithViewport = (
  ui: React.ReactElement,
  {
    viewport = 'desktop',
    withPreferences = true,
    withSession = true,
    ...renderOptions
  }: ResponsiveRenderOptions = {}
): RenderResult & { setViewportSize: (size: keyof typeof viewports | { width: number; height: number }) => void } => {
  // Set initial viewport size
  const viewportSize = typeof viewport === 'string' ? viewports[viewport] : viewport;
  setViewport(viewportSize.width, viewportSize.height);

  // Wrap component with providers based on options
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    let wrapped = <>{children}</>;

    if (withSession) {
      wrapped = <SessionProvider session={mockSession}>{wrapped}</SessionProvider>;
    }

    if (withPreferences) {
      wrapped = <PreferencesProvider>{wrapped}</PreferencesProvider>;
    }

    return wrapped;
  };

  // Render with enhanced utilities
  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    setViewportSize: (size: keyof typeof viewports | { width: number; height: number }) => {
      const newSize = typeof size === 'string' ? viewports[size] : size;
      setViewport(newSize.width, newSize.height);
    }
  };
};

/**
 * Creates a media query list mock for a given query
 * @param query The media query string
 * @param matches Whether the query matches
 * @returns A mock implementation of MediaQueryList
 */
export const createMediaQueryListMock = (query: string, matches: boolean): MediaQueryList => {
  const listeners: EventListener[] = [];
  
  return {
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn((listener) => listeners.push(listener)),
    removeListener: jest.fn((listener) => {
      const index = listeners.indexOf(listener);
      if (index !== -1) listeners.splice(index, 1);
    }),
    addEventListener: jest.fn((_, listener) => listeners.push(listener as EventListener)),
    removeEventListener: jest.fn((_, listener) => {
      const index = listeners.indexOf(listener as EventListener);
      if (index !== -1) listeners.splice(index, 1);
    }),
    dispatchEvent: jest.fn((event) => {
      listeners.forEach(listener => listener(event));
      return true;
    })
  } as unknown as MediaQueryList;
};

/**
 * Mocks the window.matchMedia function for testing
 * @param mockImplementation Custom mock implementation function
 */
export const mockMatchMedia = (
  mockImplementation: (query: string) => MediaQueryList = (query: string) => {
    // Responsive breakpoint queries (simplified for common cases)
    const breakpointQueries = {
      '(max-width: 480px)': window.innerWidth <= 480, // Mobile
      '(max-width: 768px)': window.innerWidth <= 768, // Tablet small
      '(max-width: 1024px)': window.innerWidth <= 1024, // Tablet large
      '(min-width: 481px)': window.innerWidth >= 481,
      '(min-width: 769px)': window.innerWidth >= 769,
      '(min-width: 1025px)': window.innerWidth >= 1025,
      // Default dark mode preference to false in tests
      '(prefers-color-scheme: dark)': false,
      // Default reduced motion to false in tests
      '(prefers-reduced-motion: reduce)': false,
    };

    // Find matching query
    for (const [mqQuery, matches] of Object.entries(breakpointQueries)) {
      if (query.includes(mqQuery)) {
        return createMediaQueryListMock(query, matches);
      }
    }

    // Default fallback
    return createMediaQueryListMock(query, false);
  }
) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn(mockImplementation)
  });
};
