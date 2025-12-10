import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string | RegExp): R;
      toHaveClass(...classNames: string[]): R;
      toHaveStyle(style: Record<string, any>): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toBeEnabled(): R;
      toHaveFocus(): R;
      toContainElement(element: HTMLElement | null): R;
      toBeInvalid(): R;
      toBeDisabled(): R;
      toBeValid(): R;
      toBeRequired(): R;
      toHaveValue(value?: string | string[] | number | null): R;
    }
  }
}
