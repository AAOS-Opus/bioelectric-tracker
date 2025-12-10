// This extends Jest's expect with testing-library matchers
import '@testing-library/jest-dom';

declare global {
  namespace jest {
    // Note: Using .extend here instead of redeclaring
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string | number): R;
      toHaveClass(...classNames: string[]): R;
      toHaveStyle(style: Record<string, any>): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveBeenCalledWith(...args: any[]): R;
    }
  }
}

export {};
