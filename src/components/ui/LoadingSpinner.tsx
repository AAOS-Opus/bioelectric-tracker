'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClass = 
    size === 'sm' ? 'h-4 w-4' : 
    size === 'lg' ? 'h-8 w-8' : 
    'h-6 w-6'; // default md size
    
  return (
    <div className={`animate-spin rounded-full ${sizeClass} border-b-2 border-blue-500 ${className}`}
         role="status"
         aria-label="Loading">
    </div>
  )
}

export default LoadingSpinner;
