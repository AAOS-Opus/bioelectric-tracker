// jest-axe setup file
import { toHaveNoViolations } from 'jest-axe';
import { AxeResults } from 'jest-axe';
import type { MatcherResult } from '@testing-library/jest-dom/matchers';

declare global {
  namespace jest {
    interface Matchers<R = MatcherResult> {
      toHaveNoViolations(results: AxeResults): R;
    }
  }
}

// Extend Jest's expect with the toHaveNoViolations matcher
expect.extend({ toHaveNoViolations });
