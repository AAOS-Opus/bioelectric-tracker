import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Button variants using class-variance-authority
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// Button props interface
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  feedbackDuration?: number;
  disableOnSuccess?: boolean;
  disableOnError?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      children,
      isLoading = false,
      loadingText,
      icon,
      iconPosition = 'left',
      disabled,
      onClick,
      type = 'button',
      feedbackDuration = 2000,
      disableOnSuccess = true,
      disableOnError = false,
      ...props
    },
    ref
  ) => {
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [showError, setShowError] = React.useState(false);
    const [isDisabled, setIsDisabled] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    // Cleanup timeouts on unmount
    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    // Handle click with debounce and async support
    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isProcessing || isDisabled) return;

      try {
        setIsProcessing(true);
        setShowError(false);
        setShowSuccess(false);

        if (onClick) {
          await onClick(e);
        }

        setShowSuccess(true);
        if (disableOnSuccess) {
          setIsDisabled(true);
        }
      } catch (error) {
        console.error('Button action failed:', error);
        setShowError(true);
        if (disableOnError) {
          setIsDisabled(true);
        }
      } finally {
        setIsProcessing(false);

        // Reset states after feedbackDuration
        timeoutRef.current = setTimeout(() => {
          setShowSuccess(false);
          setShowError(false);
          if (!disableOnSuccess && !disableOnError) {
            setIsDisabled(false);
          }
        }, feedbackDuration);
      }
    };

    // Determine button state
    const buttonState = isProcessing
      ? 'processing'
      : showSuccess
      ? 'success'
      : showError
      ? 'error'
      : 'idle';

    // ARIA attributes based on button state
    const ariaAttributes = {
      'aria-busy': isProcessing ? 'true' : 'false',
      'aria-disabled': (disabled || isDisabled) ? 'true' : 'false',
      'aria-live': 'polite',
    };

    // Render loading spinner or icon
    const renderIcon = () => {
      if (isProcessing) {
        return <Loader2 className="w-4 h-4 animate-spin" />;
      }
      return icon;
    };

    // Render button content
    const renderContent = () => {
      const iconElement = renderIcon();
      const textElement = isProcessing && loadingText ? loadingText : children;

      return (
        <>
          {iconPosition === 'left' && iconElement && (
            <span className="mr-2">{iconElement}</span>
          )}
          {textElement}
          {iconPosition === 'right' && iconElement && (
            <span className="ml-2">{iconElement}</span>
          )}
        </>
      );
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          buttonVariants({ variant, size, className }),
          isProcessing && 'cursor-wait',
          showSuccess && 'bg-success text-success-foreground',
          showError && 'bg-destructive text-destructive-foreground'
        )}
        disabled={disabled || isDisabled || isProcessing}
        onClick={handleClick}
        {...ariaAttributes}
        {...props}
      >
        {renderContent()}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
