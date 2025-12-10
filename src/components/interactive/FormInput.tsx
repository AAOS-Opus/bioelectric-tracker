import React, { useCallback, useId, useRef, useState, forwardRef, InputHTMLAttributes } from 'react';
import styles from './FormInput.module.css';

export interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  helperText?: string;
  error?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  showValidation?: boolean;
  required?: boolean;
  isAnimated?: boolean;
}

function FormInputComponent({
  label,
  helperText,
  error,
  success,
  leftIcon,
  rightIcon,
  isLoading = false,
  size = 'medium',
  fullWidth = false,
  showValidation = true,
  required = false,
  isAnimated = true,
  id,
  value,
  onChange,
  onFocus,
  onBlur,
  className = '',
  disabled,
  ...rest
}: FormInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = id || useId();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  // Memoize focus handler
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    setHasInteracted(true);
    onFocus?.(e);
  }, [onFocus]);

  // Memoize blur handler
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);

  // Memoize change handler
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setHasInteracted(true);
    onChange?.(e);
  }, [onChange]);

  const hasError = Boolean(error);
  const hasSuccess = Boolean(success);
  const feedbackMessage = hasInteracted && showValidation
    ? (error || success || helperText || '')
    : helperText || '';

  const containerClasses = [
    styles.container,
    styles[size],
    fullWidth ? styles.fullWidth : '',
    isFocused ? styles.focused : '',
    disabled ? styles.disabled : '',
    hasError && styles.error,
    hasSuccess && styles.success,
    isAnimating ? styles.animating : '',
    className
  ].filter(Boolean).join(' ');

  const feedbackId = `${inputId}-feedback`;
  const feedbackRole = hasError ? 'alert' : 'status';

  return (
    <div className={containerClasses}>
      <div className={styles.inputWrapper}>
        {leftIcon && (
          <div className={styles.leftIcon}>
            {leftIcon}
          </div>
        )}
        
        <div className={styles.fieldWrapper}>
          <input
            ref={inputRef}
            id={inputId}
            className={styles.input}
            value={inputValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            {...(hasError ? { "aria-invalid": "true" } : { "aria-invalid": "false" })}
            aria-describedby={feedbackId}
            required={required}
            {...rest}
          />
          
          <label 
            htmlFor={inputId} 
            className={`${styles.label} ${isFocused || !!inputValue ? styles.floating : ''}`}
          >
            {label}
            {required && <span className={styles.requiredIndicator}>*</span>}
          </label>
          
          {isLoading && (
            <div className={styles.loadingIndicator}>
              <div className={styles.loadingSpinner} />
            </div>
          )}
        </div>
        
        {rightIcon && (
          <div className={styles.rightIcon}>
            {rightIcon}
          </div>
        )}
      </div>
      
      {feedbackMessage && (
        <div
          id={feedbackId}
          className={styles.feedback}
          {...(hasError 
            ? { role: "alert", "aria-live": "assertive" } 
            : { role: "status", "aria-live": "polite" }
          )}
        >
          {feedbackMessage}
        </div>
      )}
    </div>
  );
}

export const FormInput = React.memo(forwardRef<HTMLInputElement, FormInputProps>(FormInputComponent));
