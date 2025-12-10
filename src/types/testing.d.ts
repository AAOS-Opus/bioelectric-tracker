/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

/**
 * Comprehensive TypeScript declarations for Jest and Testing Library
 * This file ensures TypeScript properly recognizes all matchers and utility functions
 */

// Extend the Jest matchers with Testing Library matchers
declare namespace jest {
  interface Matchers<R, T = {}> {
    // DOM Testing Library matchers
    toBeInTheDocument(): R;
    toHaveAttribute(attr: string, value?: string): R;
    toHaveClass(...classNames: string[]): R;
    toHaveTextContent(text: string | RegExp): R;
    toHaveFocus(): R;
    toBeDisabled(): R;
    toBeEnabled(): R;
    toBeVisible(): R;
    toBeChecked(): R;
    toHaveStyle(css: Record<string, any>): R;
    toHaveValue(value?: string | string[] | number | null): R;
    toBeRequired(): R;
    
    // Jest matchers that TypeScript sometimes misses
    toHaveBeenCalledWith(...args: any[]): R;
    toHaveBeenCalled(): R;
    toHaveBeenCalledTimes(times: number): R;
  }
}

// Extend the global expect object with Jest utility functions
declare global {
  namespace jest {
    // Add any additional Jest interface extensions here
  }
  
  // Add Jest utility functions
  interface ExpectStatic {
    objectContaining<T extends object>(obj: T): T;
    stringContaining(str: string): string;
    arrayContaining<T>(arr: T[]): T[];
    stringMatching(str: string | RegExp): string;
    any(constructor: any): any;
  }
}

// This export is needed to make this a module
export {};
