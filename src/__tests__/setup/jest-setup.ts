// jest-setup.ts
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveValue(value?: string | string[] | number): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledTimes(count: number): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveNoViolations(): R;
      toHaveAccessibleName(name?: string | RegExp): R;
    }

    interface Expect {
      objectContaining<T extends object>(obj: T): T;
      stringContaining(str: string): string;
      stringMatching(regex: RegExp): string;
      anything(): any;
    }
  }
}
