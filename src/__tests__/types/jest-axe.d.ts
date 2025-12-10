// Type definitions for jest-axe
declare module 'jest-axe' {
  import { AxeResults, RunOptions, Spec } from 'axe-core';
  
  export interface JestAxeConfigureOptions {
    globalOptions?: RunOptions;
    rules?: {
      [key: string]: {
        enabled: boolean;
      };
    };
    checks?: Array<{
      id: string;
      options?: object;
    }>;
  }

  export const axe: (
    html: Element | string,
    options?: RunOptions
  ) => Promise<AxeResults>;

  export const configureAxe: (options?: JestAxeConfigureOptions) => (
    html: Element | string,
    options?: RunOptions
  ) => Promise<AxeResults>;

  export const toHaveNoViolations: {
    toHaveNoViolations(results: AxeResults): { pass: boolean; message(): string };
  };

  export interface AxeRule {
    enabled: boolean;
  }

  // Extend the Jest types with our custom matchers
  declare global {
    namespace jest {
      interface Matchers<R> {
        toHaveNoViolations(): R;
      }
    }
  }
}
