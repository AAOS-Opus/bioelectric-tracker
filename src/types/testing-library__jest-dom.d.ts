import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(name: string, value?: string | number): R;
      toHaveStyle(style: Record<string, any>): R;
      toHaveClass(...classNames: string[]): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalledTimes(times: number): R;
    }
  }
}

// Extends expect to include any
declare global {
  namespace jest {
    interface Expect {
      any(constructor: any): any;
    }
  }
}

export {};
