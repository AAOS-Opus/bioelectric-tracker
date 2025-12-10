/// <reference types="jest" />

/**
 * Type definitions for @testing-library/jest-dom
 * Ensures TypeScript properly recognizes Jest-DOM matchers
 */

declare global {
  namespace jest {
    interface Matchers<R> {
      // DOM Testing Library matchers
      toBeInTheDocument(): R;
      toHaveAttribute(name: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveFocus(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeVisible(): R;
      toBeChecked(): R;
      toHaveStyle(css: Record<string, any>): R;
      toHaveValue(value: any): R;
      toBeRequired(): R;
      
      // Jest matchers that TypeScript sometimes misses
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledTimes(times: number): R;
    }
  }

  // Add Jest utility functions to global ExpectStatic
  interface ExpectStatic {
    objectContaining<T extends object>(expected: T): any;
    stringContaining(expected: string): any;
    arrayContaining<T>(expected: T[]): any;
    stringMatching(str: string | RegExp): string;
    any(constructor: any): any;
  }
}

export {};
