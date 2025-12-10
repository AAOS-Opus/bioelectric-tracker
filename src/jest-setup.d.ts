/**
 * Type definitions for Jest and Testing Library
 */
import '@testing-library/jest-dom';

// Augment window.trackEvent
interface Window {
  trackEvent(eventName: string, data?: any): void;
}

// Augment Jest's expect
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
    
    interface Expect {
      stringMatching(value: string | RegExp): any;
      anything(): any;
      any(constructor: any): any;
    }
  }
}

// Export an empty object to satisfy TypeScript
export {};
