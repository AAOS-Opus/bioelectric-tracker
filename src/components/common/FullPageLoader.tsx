"use client";

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FullPageLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Full-page loading component with centered spinner
 * Used for authentication loading states and route transitions
 */
export function FullPageLoader({
  message = "Loading...",
  size = 'md',
  className
}: FullPageLoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center bg-background",
      "transition-opacity duration-300 ease-in-out",
      className
    )}>
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <Loader2
          className={cn(
            "animate-spin text-primary",
            sizeClasses[size]
          )}
          aria-label="Loading"
        />

        {/* Loading message */}
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          {message}
        </p>
      </div>

      {/* Optional loading skeleton for visual interest */}
      <div className="mt-8 space-y-3 max-w-sm w-full px-4">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

/**
 * Minimal full-page loader without skeleton
 */
export function MinimalFullPageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}