import React, { forwardRef, useCallback, useRef, useEffect, memo } from 'react';
import { LoadingSpinner } from '../feedback/LoadingSpinner';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'outline';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  isDisabled?: boolean;
  disabledReason?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ripple?: boolean;
}

const ButtonComponent = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'medium',
  className = '',
  children,
  fullWidth = false,
  isLoading = false,
  loadingText,
  isDisabled = false,
  disabledReason,
  leftIcon,
  rightIcon,
  ripple = true,
  onClick,
  onFocus,
  onBlur,
  ...rest
}, ref) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const rippleRef = useRef<HTMLSpanElement | null>(null);
  
  // Forward the ref
  useEffect(() => {
    if (ref && 'current' in ref) {
      ref.current = buttonRef.current;
    }
  }, [ref]);
  
  // Memoize ripple effect handler
  const createRipple = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!ripple || isDisabled || isLoading) return;
    
    const button = event.currentTarget;
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    // Remove any existing ripple
    if (rippleRef.current) {
      button.removeChild(rippleRef.current);
    }
    
    const rippleElement = document.createElement('span');
    rippleElement.style.width = `${diameter}px`;
    rippleElement.style.height = `${diameter}px`;
    rippleElement.style.left = `${event.clientX - (button.getBoundingClientRect().left + radius)}px`;
    rippleElement.style.top = `${event.clientY - (button.getBoundingClientRect().top + radius)}px`;
    rippleElement.className = styles.ripple;
    
    rippleRef.current = rippleElement;
    button.appendChild(rippleElement);
    
    // Clean up ripple after animation
    const removeRipple = () => {
      if (rippleRef.current) {
        rippleRef.current.removeEventListener('animationend', removeRipple);
        try {
          button.removeChild(rippleRef.current);
        } catch (e) {
          // Button might have been removed from DOM
        }
        rippleRef.current = null;
      }
    };
    
    rippleElement.addEventListener('animationend', removeRipple);
  }, [ripple, isDisabled, isLoading]);
  
  // Memoize click handler
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    
    if (!isDisabled && !isLoading && onClick) {
      onClick(e);
    }
  }, [createRipple, onClick, isDisabled, isLoading]);
  
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    isLoading ? styles.loading : '',
    isDisabled ? styles.disabled : '',
    className
  ].filter(Boolean).join(' ');
  
  // Set up tooltip for disabled buttons
  useEffect(() => {
    if (!buttonRef.current) return;
    
    if (isDisabled && disabledReason) {
      buttonRef.current.setAttribute('data-tooltip', disabledReason);
      buttonRef.current.classList.add(styles.hasTooltip);
    } else {
      buttonRef.current.removeAttribute('data-tooltip');
      buttonRef.current.classList.remove(styles.hasTooltip);
    }
  }, [isDisabled, disabledReason]);
  
  return (
    <button
      ref={buttonRef}
      className={buttonClasses}
      onClick={handleClick}
      disabled={isDisabled}
      {...(isDisabled ? { "aria-disabled": "true" } : { "aria-disabled": "false" })}
      {...(isLoading ? { "aria-busy": "true" } : { "aria-busy": "false" })}
      type={rest.type || 'button'}
      onFocus={onFocus}
      onBlur={onBlur}
      {...rest}
    >
      {isLoading && (
        <span className={styles.loadingWrapper}>
          <LoadingSpinner 
            size="small" 
            inline 
            label={loadingText ? undefined : 'Loading'}
          />
        </span>
      )}
      
      <span className={styles.contentWrapper}>
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        {loadingText && isLoading ? loadingText : children}
        {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
      </span>
    </button>
  );
});

export const Button = memo(ButtonComponent);

Button.displayName = 'Button';
