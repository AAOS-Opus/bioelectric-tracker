"use client";

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type RegisterFormData = z.infer<typeof registerSchema>

type PasswordStrength = {
  score: number; // 0-4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

interface RegisterError {
  type: 'validation' | 'email_exists' | 'server' | 'network';
  message: string;
}

export function RegisterForm() {
  const router = useRouter()
  const { toast } = useToast()

  // Form state
  const [values, setValues] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({})
  const [registerError, setRegisterError] = useState<RegisterError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Set<keyof RegisterFormData>>(new Set())
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null)

  // Password strength calculation
  const getPasswordStrength = (password: string): PasswordStrength => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const score = Object.values(requirements).filter(Boolean).length

    const strengthMap = {
      0: { label: 'Very Weak' as const, color: 'bg-red-500' },
      1: { label: 'Very Weak' as const, color: 'bg-red-500' },
      2: { label: 'Weak' as const, color: 'bg-orange-500' },
      3: { label: 'Fair' as const, color: 'bg-yellow-500' },
      4: { label: 'Strong' as const, color: 'bg-green-500' },
      5: { label: 'Very Strong' as const, color: 'bg-green-600' }
    }

    const { label, color } = strengthMap[score] || strengthMap[0]

    return {
      score,
      label,
      color,
      requirements
    }
  }

  // Field validation
  const validateField = (name: keyof RegisterFormData, value: string) => {
    try {
      if (name === 'name') {
        z.string().min(2, 'Name must be at least 2 characters').parse(value)
      } else if (name === 'email') {
        z.string().email('Invalid email address').parse(value)
      } else if (name === 'password') {
        registerSchema.shape.password.parse(value)
      } else if (name === 'confirmPassword') {
        if (value !== values.password) {
          throw new Error('Passwords do not match')
        }
      }
      return null
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Invalid value'
      }
      return error.message || 'Invalid value'
    }
  }

  // Handle input changes
  const handleChange = (name: keyof RegisterFormData, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }))

    // Real-time password strength calculation
    if (name === 'password') {
      setPasswordStrength(getPasswordStrength(value))
    }

    // Clear previous errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
    if (registerError) {
      setRegisterError(null)
    }
  }

  // Handle input blur
  const handleBlur = (name: keyof RegisterFormData) => {
    setTouchedFields(prev => new Set(prev).add(name))
    const error = validateField(name, values[name])
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  // Parse registration error
  const parseRegisterError = (status: number, message: string): RegisterError => {
    if (status === 409 || message.toLowerCase().includes('already exists')) {
      return {
        type: 'email_exists',
        message: 'An account with this email already exists.'
      }
    }
    if (status >= 500) {
      return {
        type: 'server',
        message: 'Something went wrong. Please try again.'
      }
    }
    return {
      type: 'server',
      message: message || 'Something went wrong. Please try again.'
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const newErrors: Partial<RegisterFormData> = {}
    Object.keys(values).forEach(key => {
      const fieldName = key as keyof RegisterFormData
      const error = validateField(fieldName, values[fieldName])
      if (error) {
        newErrors[fieldName] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setRegisterError({
        type: 'validation',
        message: 'Please fix the errors below and try again.'
      })
      return
    }

    setIsSubmitting(true)
    setRegisterError(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const error = parseRegisterError(response.status, data.message)
        setRegisterError(error)
        return
      }

      // Success
      toast({
        title: 'Registration Successful!',
        description: 'Your account has been created. Redirecting to login...',
        variant: 'success',
      })

      // Clear form
      setValues({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      })

      // Redirect after short delay
      setTimeout(() => {
        router.push('/auth/login?registered=true')
      }, 2000)

    } catch (error) {
      console.error('Registration error:', error)
      setRegisterError({
        type: 'network',
        message: 'Network error. Please check your connection and try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if form is valid
  const isFormValid = values.name && values.email && values.password && values.confirmPassword &&
                      Object.keys(errors).length === 0 &&
                      passwordStrength && passwordStrength.score >= 4

  return (
    <div className="mt-8 space-y-6">
      {/* Registration Error Display */}
      {registerError && (
        <div
          className={cn(
            "flex items-center gap-2 p-4 rounded-md border",
            "bg-destructive/10 border-destructive/20 text-destructive",
            "animate-in slide-in-from-top-2 duration-300"
          )}
          role="alert"
          aria-describedby="register-error"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p id="register-error" className="text-sm font-medium">
            {registerError.message}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Full Name <span className="text-red-500 dark:text-red-400 ml-1">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={values.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="Enter your full name"
              disabled={isSubmitting}
              className={cn(
                "block w-full px-3 py-2 border rounded-md shadow-sm",
                "placeholder-gray-400 dark:placeholder-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                "text-gray-900 dark:text-gray-100 dark:bg-gray-800",
                "disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200",
                errors.name
                  ? "border-red-300 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              )}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Email Address <span className="text-red-500 dark:text-red-400 ml-1">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={values.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="Enter your email address"
              disabled={isSubmitting}
              className={cn(
                "block w-full px-3 py-2 border rounded-md shadow-sm",
                "placeholder-gray-400 dark:placeholder-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                "text-gray-900 dark:text-gray-100 dark:bg-gray-800",
                "disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200",
                errors.email
                  ? "border-red-300 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              )}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Password <span className="text-red-500 dark:text-red-400 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={values.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="Create a strong password"
                disabled={isSubmitting}
                className={cn(
                  "block w-full px-3 py-2 pr-10 border rounded-md shadow-sm",
                  "placeholder-gray-400 dark:placeholder-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  "text-gray-900 dark:text-gray-100 dark:bg-gray-800",
                  "disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200",
                  errors.password
                    ? "border-red-300 dark:border-red-600"
                    : "border-gray-300 dark:border-gray-600"
                )}
                aria-describedby={errors.password ? 'password-error' : 'password-strength'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {values.password && passwordStrength && (
              <div id="password-strength" className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Password Strength:
                  </span>
                  <span className={cn(
                    "text-xs font-medium",
                    passwordStrength.score >= 4 ? "text-green-600 dark:text-green-400" :
                    passwordStrength.score >= 3 ? "text-yellow-600 dark:text-yellow-400" :
                    "text-red-600 dark:text-red-400"
                  )}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors duration-200",
                        level <= passwordStrength.score
                          ? passwordStrength.color
                          : "bg-gray-200 dark:bg-gray-700"
                      )}
                    />
                  ))}
                </div>
                <ul className="text-xs space-y-1">
                  {Object.entries(passwordStrength.requirements).map(([req, met]) => (
                    <li
                      key={req}
                      className={cn(
                        "flex items-center gap-2",
                        met ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {met ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-current" />
                      )}
                      <span>
                        {req === 'length' && '8+ characters'}
                        {req === 'uppercase' && 'Uppercase letter'}
                        {req === 'lowercase' && 'Lowercase letter'}
                        {req === 'number' && 'Number'}
                        {req === 'special' && 'Special character'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {errors.password && (
              <p id="password-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Confirm Password <span className="text-red-500 dark:text-red-400 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={values.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="Confirm your password"
                disabled={isSubmitting}
                className={cn(
                  "block w-full px-3 py-2 pr-10 border rounded-md shadow-sm",
                  "placeholder-gray-400 dark:placeholder-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  "text-gray-900 dark:text-gray-100 dark:bg-gray-800",
                  "disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200",
                  errors.confirmPassword
                    ? "border-red-300 dark:border-red-600"
                    : "border-gray-300 dark:border-gray-600"
                )}
                aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="confirm-password-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.confirmPassword}
              </p>
            )}
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
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </button>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className={cn(
                "font-medium text-primary hover:text-primary/90 transition-colors",
                isSubmitting && "pointer-events-none opacity-60"
              )}
              tabIndex={isSubmitting ? -1 : 0}
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
