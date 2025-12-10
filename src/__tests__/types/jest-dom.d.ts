// Type definitions for @testing-library/jest-dom
import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      // DOM node assertions
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeEmpty(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(htmlText: string): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toHaveFocus(): R;
      toHaveFormValues(expectedValues: { [name: string]: any }): R;
      toHaveStyle(css: string | { [key: string]: any }): R;
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
      toHaveValue(value?: string | string[] | number): R;
      toHaveDisplayValue(value: string | string[] | RegExp | RegExp[]): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveAccessibleDescription(description?: string | RegExp): R;
      toHaveAccessibleName(name?: string | RegExp): R;
      toHaveDescription(description: string | RegExp): R;
      toHaveErrorMessage(text: string | RegExp): R;
      toHaveLength(length: number): R;
      
      // Specialized matchers
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledTimes(count: number): R;
      toHaveNoViolations(): R;
    }
  }
  
  namespace expect {
    interface Matchers<R> {
      // Same matchers as above
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeEmpty(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(htmlText: string): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toHaveFocus(): R;
      toHaveFormValues(expectedValues: { [name: string]: any }): R;
      toHaveStyle(css: string | { [key: string]: any }): R;
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
      toHaveValue(value?: string | string[] | number): R;
      toHaveDisplayValue(value: string | string[] | RegExp | RegExp[]): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveAccessibleDescription(description?: string | RegExp): R;
      toHaveAccessibleName(name?: string | RegExp): R;
      toHaveDescription(description: string | RegExp): R;
      toHaveErrorMessage(text: string | RegExp): R;
      toHaveLength(length: number): R;
      toHaveNoViolations(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledTimes(count: number): R;
    }
  }
  
  // Static methods on the expect object
  interface ExpectStatic {
    extend(matchers: Record<string, any>): void;
    objectContaining<T extends object>(obj: T): T;
    stringContaining(str: string): string;
    stringMatching(regex: RegExp): string;
    anything(): any;
  }
}
