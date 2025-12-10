// global.d.ts - Extends the Jest and testing types globally

import '@testing-library/jest-dom';

// Extend the Jest matchers globally
declare global {
  namespace jest {
    interface Matchers<R> {
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
    }
  }
  
  // Add the expect utility functions
  interface ExpectStatic {
    objectContaining<T extends object>(expected: T): any;
    stringContaining(expected: string): any;
    arrayContaining<T>(expected: T[]): any;
  }
}

// This export is needed to make this a module
export {};
