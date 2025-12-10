"use client";

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle } from 'lucide-react';
import { emailSchema, passwordSchema } from '@/lib/form-utils';
import { useToast } from '@/components/ui/use-toast';
import { Form, FormField, FormInput, FormSubmit } from '@/components/ui/form';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginError {
  type: 'validation' | 'credentials' | 'server' | 'unknown';
  message: string;
}

const initialValues: LoginFormData = {
  email: '',
  password: '',
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';

  // Form state
  const [values, setValues] = useState<LoginFormData>(initialValues);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [loginError, setLoginError] = useState<LoginError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof LoginFormData>>(new Set());

  // Field validation
  const validateField = (name: keyof LoginFormData, value: string) => {
    try {
      if (name === 'email') {
        emailSchema.parse(value);
      } else if (name === 'password') {
        passwordSchema.parse(value);
      }
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Invalid value';
      }
      return 'Invalid value';
    }
  };

  // Handle input changes
  const handleChange = (name: keyof LoginFormData, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));

    // Clear previous errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (loginError) {
      setLoginError(null);
    }
  };

  // Handle input blur
  const handleBlur = (name: keyof LoginFormData) => {
    setTouchedFields(prev => new Set(prev).add(name));
    const error = validateField(name, values[name]);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Parse NextAuth error into user-friendly message
  const parseLoginError = (error: string): LoginError => {
    switch (error) {
      case 'CredentialsSignin':
        return {
          type: 'credentials',
          message: 'Invalid credentials. Please check your email and password.'
        };
      case 'AccessDenied':
        return {
          type: 'credentials',
          message: 'Access denied. Please verify your account.'
        };
      case 'OAuthAccountNotLinked':
        return {
          type: 'credentials',
          message: 'Account linking error. Please try again.'
        };
      default:
        if (error.includes('404')) {
          return {
            type: 'credentials',
            message: 'User not found. Please check your email address.'
          };
        }
        if (error.includes('401')) {
          return {
            type: 'credentials',
            message: 'Invalid credentials. Please check your email and password.'
          };
        }
        if (error.includes('500')) {
          return {
            type: 'server',
            message: 'Server error, please try again later.'
          };
        }
        return {
          type: 'unknown',
          message: 'Login failed. Please try again.'
        };
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Partial<LoginFormData> = {};
    Object.keys(values).forEach(key => {
      const fieldName = key as keyof LoginFormData;
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoginError({
        type: 'validation',
        message: 'Please fix the errors below and try again.'
      });
      return;
    }

    setIsSubmitting(true);
    setLoginError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
        const parsedError = parseLoginError(result.error);
        setLoginError(parsedError);
      } else if (result?.ok) {
        // Success - redirect to dashboard
        toast({
          title: 'Login Successful',
          description: 'Welcome back! Redirecting to dashboard...',
          variant: 'success',
        });

        // Store remember me preference if enabled
        if (rememberMe) {
          localStorage.setItem('rememberEmail', values.email);
        } else {
          localStorage.removeItem('rememberEmail');
        }

        // Clear form and redirect
        setValues(initialValues);
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError({
        type: 'unknown',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize remember me from localStorage
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
      setValues(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Show registration success message
  useEffect(() => {
    if (searchParams?.get('registered')) {
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created. Please sign in.',
        variant: 'success',
      });
    }
  }, [searchParams, toast]);

  // Check if form is valid
  const isFormValid = values.email && values.password && Object.keys(errors).length === 0;
  const getFieldError = (field: keyof LoginFormData) => errors[field];

  return (
    <div className="mt-8 space-y-6">
      {/* Login Error Display */}
      {loginError && (
        <div
          className={cn(
            "flex items-center gap-2 p-4 rounded-md border",
            "bg-destructive/10 border-destructive/20 text-destructive",
            "animate-in slide-in-from-top-2 duration-300"
          )}
          role="alert"
          aria-describedby="login-error"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p id="login-error" className="text-sm font-medium">
            {loginError.message}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-4">
          {/* Email Field */}
          <FormField
            label="Email address"
            error={getFieldError('email')}
            required
          >
            <FormInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={values.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="Enter your email address"
              error={getFieldError('email')}
              disabled={isSubmitting}
              aria-describedby={getFieldError('email') ? 'email-error' : undefined}
              className={cn(
                "transition-all duration-200",
                isSubmitting && "opacity-60 cursor-not-allowed"
              )}
            />
          </FormField>

          {/* Password Field */}
          <FormField
            label="Password"
            error={getFieldError('password')}
            required
          >
            <FormInput
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={values.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              placeholder="Enter your password"
              error={getFieldError('password')}
              disabled={isSubmitting}
              aria-describedby={getFieldError('password') ? 'password-error' : undefined}
              className={cn(
                "transition-all duration-200",
                isSubmitting && "opacity-60 cursor-not-allowed"
              )}
            />
          </FormField>
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isSubmitting}
              className={cn(
                "h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            />
            <label
              htmlFor="remember-me"
              className={cn(
                "ml-2 block text-sm text-gray-700 dark:text-gray-300",
                isSubmitting && "opacity-60"
              )}
            >
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link
              href="/auth/forgot-password"
              className={cn(
                "font-medium text-primary hover:text-primary/90 transition-colors",
                isSubmitting && "pointer-events-none opacity-60"
              )}
              tabIndex={isSubmitting ? -1 : 0}
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !isFormValid}
          className={cn(
            "group relative w-full flex justify-center py-3 px-4 border border-transparent",
            "text-sm font-medium rounded-md text-white transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            isFormValid && !isSubmitting
              ? "bg-primary hover:bg-primary/90 shadow-sm hover:shadow"
              : "bg-gray-400 cursor-not-allowed",
            isSubmitting && "bg-primary/80"
          )}
          aria-describedby={loginError ? 'login-error' : undefined}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            'Sign in'
          )}
        </button>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link
              href="/auth/register"
              className={cn(
                "font-medium text-primary hover:text-primary/90 transition-colors",
                isSubmitting && "pointer-events-none opacity-60"
              )}
              tabIndex={isSubmitting ? -1 : 0}
            >
              Create an account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
