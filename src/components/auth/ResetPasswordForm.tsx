"use client";

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')
  
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  })

  if (!token) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Invalid or missing token</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>The password reset link is invalid or has expired.</p>
            </div>
            <div className="mt-4">
              <Link href="/auth/forgot-password" className="text-sm font-medium text-red-600 hover:text-red-500">
                Request a new password reset
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsSubmitting(true)
      setError('')
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
          password: data.password
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to reset password')
      }

      setIsSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login?reset=true')
      }, 3000)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="rounded-md bg-green-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Password reset successful</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Your password has been reset successfully. Redirecting to login...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          New Password
        </label>
        <div className="mt-1">
          <input
            {...register('password')}
            type="password"
            id="password"
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter your new password"
          />
          {errors.password && (
            <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <div className="mt-1">
          <input
            {...register('confirmPassword')}
            type="password"
            id="confirmPassword"
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Confirm your new password"
          />
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </form>
  )
}
