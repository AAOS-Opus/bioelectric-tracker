import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Form root component
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
}

const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ className, onSubmit, children, isSubmitting, ...props }, ref) => {
    if (isSubmitting) {
      return (
        <form
          ref={ref}
          onSubmit={onSubmit}
          aria-busy="true"
          className={cn('space-y-6', className)}
          {...props}
        >
          {children}
        </form>
      );
    } else {
      return (
        <form
          ref={ref}
          onSubmit={onSubmit}
          aria-busy="false"
          className={cn('space-y-6', className)}
          {...props}
        >
          {children}
        </form>
      );
    }
  }
);
Form.displayName = 'Form';

// Form field wrapper
interface FormFieldProps {
  children: React.ReactNode;
  label?: string;
  error?: string;
  className?: string;
  required?: boolean;
  description?: string;
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ children, label, error, className, required, description, ...props }, ref) => {
    const id = React.useId();
    const errorId = `${id}-error`;
    const descriptionId = `${id}-description`;

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}
            {required && (
              <span className="text-red-500 dark:text-red-400 ml-1">*</span>
            )}
          </label>
        )}
        {description && (
          <p
            id={descriptionId}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {description}
          </p>
        )}
        {children}
        {error && (
          <p
            id={errorId}
            className="text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
FormField.displayName = 'FormField';

// Form submit button
interface FormSubmitProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isSubmitting?: boolean;
  loadingText?: string;
}

const FormSubmit = forwardRef<HTMLButtonElement, FormSubmitProps>(
  (
    {
      className,
      isSubmitting = false,
      loadingText = 'Please wait...',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = isSubmitting || disabled;
    const busy = isSubmitting;

    // Use conditional rendering to avoid template expressions in ARIA attributes
    if (busy) {
      return (
        <button
          ref={ref}
          type="submit"
          disabled={isDisabled}
          className={cn(
            'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
            className
          )}
          aria-busy="true"
          {...props}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {loadingText}
            </>
          ) : (
            children
          )}
        </button>
      );
    } else {
      return (
        <button
          ref={ref}
          type="submit"
          disabled={isDisabled}
          className={cn(
            'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
            className
          )}
          aria-busy="false"
          {...props}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {loadingText}
            </>
          ) : (
            children
          )}
        </button>
      );
    }
  }
);
FormSubmit.displayName = 'FormSubmit';

// Form input
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, error, 'aria-describedby': ariaDescribedby, ...props }, ref) => {
    const errorId = error ? `${props.id}-error` : undefined;
    const invalid = error;
    
    return (
      <input
        ref={ref}
        type={props.type}
        {...(error ? { 'aria-invalid': 'true' } : { 'aria-invalid': 'false' })}
        className={cn(
          'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:focus:border-primary',
          'text-gray-900 dark:text-gray-100 dark:bg-gray-800',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors',
          error && 'border-red-500 dark:border-red-400',
          className
        )}
        aria-describedby={cn(errorId, ariaDescribedby)}
        {...props}
      />
    );
  }
);
FormInput.displayName = 'FormInput';

export { Form, FormField, FormSubmit, FormInput };
