// Jest setup file
import '@testing-library/jest-dom';

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: any): R;
      toHaveClass(className: string, options?: { exact: boolean }): R;
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
      toHaveValue(value: string | string[] | number | null): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeRequired(): R;
      toBeChecked(): R;
      toBeEmpty(): R;
    }
  }
}

// Mock window.trackEvent
window.trackEvent = jest.fn();

// Export empty to make this a module
export {};
