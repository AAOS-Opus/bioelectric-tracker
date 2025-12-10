import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { PreferencesProvider } from '@/contexts/PreferencesContext';

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    },
    expires: '2099-12-31',
  };

  return (
    <SessionProvider session={mockSession}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <PreferencesProvider>
          {children}
        </PreferencesProvider>
      </ThemeProvider>
    </SessionProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };