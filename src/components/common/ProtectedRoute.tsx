"use client";

import { useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { FullPageLoader } from './FullPageLoader';
import { useToast } from '@/components/ui/use-toast';

export interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredRole?: string;
  fallback?: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  loadingMessage?: string;
  showToastOnRedirect?: boolean;
}

/**
 * ProtectedRoute component that wraps authenticated-only pages
 * Provides secure route protection with NextAuth session management
 *
 * @example
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 *
 * @example With role-based access
 * <ProtectedRoute allowedRoles={['admin', 'user']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  requiredRole,
  fallback,
  requireAuth = true,
  redirectTo = '/auth/login',
  loadingMessage = "Verifying authentication...",
  showToastOnRedirect = true
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Handle authentication redirect with return path
  useEffect(() => {
    if (status === 'loading') return; // Still loading, wait

    if (!session && requireAuth) {
      // User is not authenticated and auth is required
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      const currentUrl = `${pathname}${searchParams ? `?${searchParams.toString()}` : ''}`;
      const callbackUrl = encodeURIComponent(currentUrl);
      const redirectUrl = `${redirectTo}?callbackUrl=${callbackUrl}`;

      if (showToastOnRedirect) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to access this page.',
          variant: 'default',
        });
      }

      // Use replace to prevent back button issues
      router.replace(redirectUrl);
      return;
    }

    // Check role-based permissions if specified
    const userRole = session?.user?.role || 'user';

    // Handle single required role
    if (session && requiredRole && userRole !== requiredRole) {
      if (showToastOnRedirect) {
        toast({
          title: 'Access Denied',
          description: `This page requires ${requiredRole} role. You have ${userRole} role.`,
          variant: 'destructive',
        });
      }
      router.replace('/dashboard');
      return;
    }

    // Handle multiple allowed roles
    if (session && allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      if (showToastOnRedirect) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page.',
          variant: 'destructive',
        });
      }
      router.replace('/dashboard');
      return;
    }
  }, [
    session,
    status,
    requireAuth,
    allowedRoles,
    requiredRole,
    router,
    pathname,
    searchParams,
    redirectTo,
    showToastOnRedirect,
    toast
  ]);

  // Handle different session states
  if (status === 'loading') {
    // Show loading state while session is being fetched
    return fallback || <FullPageLoader message={loadingMessage} />;
  }

  if (!session && requireAuth) {
    // User is not authenticated - show loading while redirecting
    return <FullPageLoader message="Redirecting to login..." />;
  }

  // Check role permissions for rendering
  const userRole = session?.user?.role || 'user';

  // Single required role check
  if (session && requiredRole && userRole !== requiredRole) {
    return <FullPageLoader message="Checking permissions..." />;
  }

  // Multiple allowed roles check
  if (session && allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <FullPageLoader message="Checking permissions..." />;
  }

  // Handle potential session errors and expiration
  if (status === 'unauthenticated' && requireAuth) {
    // Session expired or invalid - show enhanced toast
    if (showToastOnRedirect) {
      toast({
        title: 'Session Expired',
        description: 'Your session has expired. Please log in again.',
        variant: 'destructive',
        duration: 5000,
      });
    }
    return <FullPageLoader message="Session expired. Redirecting..." />;
  }

  // User is properly authenticated and authorized
  return <>{children}</>;
}

/**
 * Higher-order component version of ProtectedRoute for easier wrapping
 */
export function withProtectedRoute<T extends object>(
  Component: React.ComponentType<T>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: T) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Hook for checking authentication status within protected routes
 * Useful for conditional rendering based on auth state
 */
export function useAuthGuard() {
  const { data: session, status } = useSession();

  return {
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    user: session?.user,
    session,
    hasRole: (role: string) => {
      if (!session?.user) return false;
      const userRole = session.user.role || 'user';
      return userRole === role;
    },
    hasAnyRole: (roles: string[]) => {
      if (!session?.user) return false;
      const userRole = session.user.role || 'user';
      return roles.includes(userRole);
    }
  };
}

/**
 * Component for protecting specific sections within a page
 * More granular than full page protection
 */
export function ProtectedSection({
  children,
  allowedRoles,
  fallback = null,
  showError = false
}: {
  children: ReactNode;
  allowedRoles?: string[];
  fallback?: ReactNode;
  showError?: boolean;
}) {
  const { isAuthenticated, hasAnyRole } = useAuthGuard();

  if (!isAuthenticated) {
    return showError ? (
      <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-md">
        <p className="text-sm text-destructive">
          Authentication required to view this content.
        </p>
      </div>
    ) : fallback;
  }

  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return showError ? (
      <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-md">
        <p className="text-sm text-destructive">
          You do not have permission to view this content.
        </p>
      </div>
    ) : fallback;
  }

  return <>{children}</>;
}

/**
 * Simple wrapper that redirects unauthenticated users without showing loading
 * Useful for pages that should be instantly accessible or redirect
 */
export function QuickProtectedRoute({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      const currentUrl = `${pathname}${searchParams ? `?${searchParams.toString()}` : ''}`;
      const callbackUrl = encodeURIComponent(currentUrl);
      router.replace(`/auth/login?callbackUrl=${callbackUrl}`);
    }
  }, [session, status, router, pathname, searchParams]);

  if (status === 'loading' || !session) {
    return null; // Render nothing while checking/redirecting
  }

  return <>{children}</>;
}