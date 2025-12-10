import React, { useEffect, useRef, useState } from 'react';
import { usePreferredMotion } from '../../hooks/useMotion';
import styles from './Toast.module.css';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Toast({
  type,
  message,
  duration = 5000,
  onClose,
  action
}: ToastProps) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prefersReducedMotion = usePreferredMotion();
  const toastRef = useRef<HTMLDivElement>(null);
  
  const handleClose = () => {
    if (prefersReducedMotion) {
      setVisible(false);
      onClose?.();
    } else {
      setExiting(true);
      // Wait for exit animation to complete
      setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, 300);
    }
  };
  
  // Set up auto-dismiss
  useEffect(() => {
    if (duration > 0) {
      timerRef.current = setTimeout(handleClose, duration);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [duration]);
  
  // Pause timer on hover/focus
  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };
  
  // Resume timer on mouse leave/blur
  const resumeTimer = () => {
    if (duration > 0) {
      timerRef.current = setTimeout(handleClose, duration);
    }
  };
  
  // Handle keyboard interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Announce to screen readers
  useEffect(() => {
    if (visible && toastRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'assertive');
      liveRegion.setAttribute('role', 'status');
      liveRegion.style.position = 'absolute';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      liveRegion.textContent = `${type} notification: ${message}`;
      
      document.body.appendChild(liveRegion);
      
      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(liveRegion);
      }, 1000);
    }
  }, [visible, type, message]);
  
  if (!visible) return null;
  
  const toastClasses = [
    styles.toast,
    styles[type],
    exiting ? styles.exiting : '',
    prefersReducedMotion ? styles.noAnimation : ''
  ].filter(Boolean).join(' ');
  
  return (
    <div
      ref={toastRef}
      className={toastClasses}
      role="alert"
      aria-live="assertive"
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onFocus={pauseTimer}
      onBlur={resumeTimer}
    >
      <div className={styles.iconContainer}>
        <span className={styles.statusIcon} aria-hidden="true" />
      </div>
      
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
        
        {action && (
          <button 
            className={styles.actionButton}
            onClick={() => {
              action.onClick();
              handleClose();
            }}
          >
            {action.label}
          </button>
        )}
      </div>
      
      <button
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Close notification"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
