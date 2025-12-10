// Type definitions that combine jest-dom and jest-axe matchers
import '@testing-library/jest-dom';
import 'jest-axe';

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
      
      // Jest mock assertions
      toHaveBeenCalled(): R;
      toHaveBeenCalledTimes(count: number): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenLastCalledWith(...args: any[]): R;
      toHaveBeenNthCalledWith(n: number, ...args: any[]): R;
      toHaveReturned(): R;
      toHaveReturnedTimes(count: number): R;
      toHaveReturnedWith(value: any): R;
      toHaveLastReturnedWith(value: any): R;
      toHaveNthReturnedWith(n: number, value: any): R;
      
      // Array assertions
      toHaveLength(length: number): R;
      
      // Jest-axe assertions
      toHaveNoViolations(): R;
    }
  }
  
  // Add these matchers to the expect namespace as well
  interface Expect {
    toBeInTheDocument(): any;
    toBeVisible(): any;
    toBeEmpty(): any;
    toBeDisabled(): any;
    toBeEnabled(): any;
    toBeInvalid(): any;
    toBeRequired(): any;
    toBeValid(): any;
    toContainElement(element: HTMLElement | null): any;
    toContainHTML(htmlText: string): any;
    toHaveAttribute(attr: string, value?: string): any;
    toHaveClass(...classNames: string[]): any;
    toHaveFocus(): any;
    toHaveFormValues(expectedValues: { [name: string]: any }): any;
    toHaveStyle(css: string | { [key: string]: any }): any;
    toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): any;
    toHaveValue(value?: string | string[] | number): any;
    toHaveDisplayValue(value: string | string[] | RegExp | RegExp[]): any;
    toBeChecked(): any;
    toBePartiallyChecked(): any;
    toHaveAccessibleDescription(description?: string | RegExp): any;
    toHaveAccessibleName(name?: string | RegExp): any;
    toHaveDescription(description: string | RegExp): any;
    toHaveErrorMessage(text: string | RegExp): any;
    toHaveLength(length: number): any;
    toHaveNoViolations(): any;
    toHaveBeenCalled(): any;
    toHaveBeenCalledTimes(count: number): any;
    toHaveBeenCalledWith(...args: any[]): any;
  }
  
  // Add static methods on the global expect object
  interface ExpectStatic {
    extend(matchers: Record<string, any>): void;
    objectContaining<T extends object>(obj: T): T;
    stringContaining(str: string): string;
    stringMatching(regex: RegExp): string;
    anything(): any;
  }
}
