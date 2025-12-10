import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';

// Simple internal debounce implementation to avoid external dependency
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string[]>;
};

export type FormState<T> = {
  values: T;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
};

export type FormConfig<T> = {
  initialValues: T;
  validationSchema?: z.ZodType<T>;
  onSubmit?: (values: T) => Promise<void>;
  persistKey?: string;
  debounceMs?: number;
};

export function useFormState<T extends Record<string, any>>(config: FormConfig<T>) {
  const {
    initialValues,
    validationSchema,
    onSubmit,
    persistKey,
    debounceMs = 300
  } = config;

  const { toast } = useToast();
  
  // Form state
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Debounced values for validation
  const debouncedValues = useDebounce(values, debounceMs);

  // Load persisted state if available
  useEffect(() => {
    if (persistKey) {
      const persisted = localStorage.getItem(persistKey);
      if (persisted) {
        try {
          const parsed = JSON.parse(persisted);
          setValues(parsed);
          setIsDirty(true);
        } catch (error) {
          console.error('Failed to parse persisted form state:', error);
        }
      }
    }
  }, [persistKey]);

  // Persist state changes
  useEffect(() => {
    if (persistKey && isDirty) {
      localStorage.setItem(persistKey, JSON.stringify(values));
    }
  }, [values, persistKey, isDirty]);

  // Validate on debounced value changes
  useEffect(() => {
    if (validationSchema && isDirty) {
      const result = validationSchema.safeParse(debouncedValues);
      if (!result.success) {
        const formattedErrors: Record<string, string[]> = {};
        result.error.errors.forEach((error) => {
          const path = error.path.join('.');
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(error.message);
        });
        setErrors(formattedErrors);
      } else {
        setErrors({});
      }
    }
  }, [debouncedValues, validationSchema, isDirty]);

  // Handle field change
  const handleChange = useCallback((
    name: string,
    value: any,
    shouldValidate = true
  ) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    setIsDirty(true);
  }, []);

  // Handle field blur
  const handleBlur = useCallback((name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Validate all fields
    if (validationSchema) {
      const result = validationSchema.safeParse(values);
      if (!result.success) {
        const formattedErrors: Record<string, string[]> = {};
        result.error.errors.forEach((error) => {
          const path = error.path.join('.');
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(error.message);
        });
        setErrors(formattedErrors);
        
        // Mark all fields as touched
        const touchedFields = Object.keys(values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {}
        );
        setTouched(touchedFields);

        toast({
          title: 'Validation Error',
          description: 'Please fix the errors in the form.',
          variant: 'destructive',
        });
        
        return;
      }
    }

    if (onSubmit) {
      try {
        setIsSubmitting(true);
        await onSubmit(values);
        toast({
          title: 'Success',
          description: 'Form submitted successfully.',
        });
        
        // Clear persisted state if successful
        if (persistKey) {
          localStorage.removeItem(persistKey);
        }
        
        setIsDirty(false);
      } catch (error) {
        console.error('Form submission error:', error);
        toast({
          title: 'Error',
          description: 'Failed to submit form. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validationSchema, onSubmit, persistKey, toast]);

  // Reset form to initial values
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
    if (persistKey) {
      localStorage.removeItem(persistKey);
    }
  }, [initialValues, persistKey]);

  // Get field error message
  const getFieldError = useCallback((name: string): string | undefined => {
    if (!touched[name] || !errors[name]) return undefined;
    return errors[name]?.[0];
  }, [touched, errors]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    isValid: Object.keys(errors).length === 0,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    getFieldError,
  };
}
