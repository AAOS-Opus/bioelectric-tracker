import React, { useRef, useEffect } from 'react';
import { usePreferredMotion } from '../../hooks/useMotion';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  label?: string;
  inline?: boolean;
  progress?: number;
  timeRemaining?: number | null;
}

export function LoadingSpinner({
  size = 'medium',
  color = 'currentColor',
  label,
  inline = false,
  progress,
  timeRemaining
}: LoadingSpinnerProps) {
  const prefersReducedMotion = usePreferredMotion();
  const spinnerRef = useRef<SVGSVGElement>(null);
  
  // Set color as CSS variable instead of inline style
  useEffect(() => {
    if (spinnerRef.current && color !== 'currentColor') {
      spinnerRef.current.style.setProperty('--spinner-color', color);
    }
  }, [color]);
  
  return (
    <div
      className={`${styles.container} ${inline ? styles.inline : ''} ${styles[size]}`}
      role="status"
      aria-label={label || 'Loading'}
    >
      {prefersReducedMotion ? (
        <div className={styles.reducedMotion}>
          {progress ? `${Math.round(progress)}%` : '...'}
        </div>
      ) : (
        <svg
          ref={spinnerRef}
          className={`${styles.spinner} ${color !== 'currentColor' ? styles.customColor : ''}`}
          viewBox="0 0 50 50"
        >
          <circle
            className={styles.track}
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="5"
          />
          <circle
            className={styles.progress}
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="5"
            strokeDasharray={progress ? `${progress} 100` : undefined}
          />
        </svg>
      )}
      
      {label && (
        <span className={styles.label}>
          {label}
          {timeRemaining !== null && (
            <span className={styles.estimate}>
              {` (${timeRemaining}s remaining)`}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
