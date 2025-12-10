'use client'

import React, { useState, useEffect, useRef } from 'react'
import { User } from '@/types/user'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertCircle, Lock, Shield, Eye, EyeOff, CheckCircle } from 'lucide-react'

interface SecuritySettingsFormProps {
  user: User;
  onSaveSuccess: () => void;
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SecuritySettingsForm({ user, onSaveSuccess }: SecuritySettingsFormProps) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(user.preferences?.privacySettings?.twoFactorAuthentication || false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isSaving2FA, setIsSaving2FA] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [tfaError, setTfaError] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showVerificationCode, setShowVerificationCode] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false)
  const [activeDevices, setActiveDevices] = useState<{id: string, device: string, lastActive: string}[]>([
    { id: '1', device: 'Windows PC - Chrome', lastActive: '2 hours ago' },
    { id: '2', device: 'iPhone 13 - Safari', lastActive: 'Just now' }
  ])
  
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  })

  // Function to handle password update
  const handlePasswordUpdate = async (values: PasswordFormValues) => {
    setIsSavingPassword(true)
    setPasswordError(null)

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password')
      }

      // Reset form and show success
      passwordForm.reset()
      onSaveSuccess()
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password')
    } finally {
      setIsSavingPassword(false)
    }
  }

  // Function to toggle 2FA
  const toggle2FA = async () => {
    setIsSaving2FA(true)
    setTfaError(null)

    try {
      // If enabling 2FA, we need to first request verification
      if (!is2FAEnabled) {
        const response = await fetch('/api/user/2fa/init', {
          method: 'POST',
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to initialize 2FA')
        }

        // Show verification dialog
        setVerificationDialogOpen(true)
      } else {
        // Disabling 2FA
        const response = await fetch('/api/user/2fa/disable', {
          method: 'POST',
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to disable 2FA')
        }

        setIs2FAEnabled(false)
        onSaveSuccess()
      }
    } catch (err: any) {
      setTfaError(err.message || 'Failed to update 2FA settings')
    } finally {
      setIsSaving2FA(false)
    }
  }

  // Function to validate 2FA code
  const validate2FACode = async () => {
    setIsSaving2FA(true)
    setTfaError(null)

    try {
      const response = await fetch('/api/user/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: verificationCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Invalid verification code')
      }

      // Close dialog and update state
      setVerificationDialogOpen(false)
      setVerificationCode('')
      setIs2FAEnabled(true)
      onSaveSuccess()
    } catch (err: any) {
      setTfaError(err.message || 'Failed to verify 2FA code')
    } finally {
      setIsSaving2FA(false)
    }
  }

  // Function to terminate a session
  const terminateSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/user/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to terminate session')
      }

      // Update local state
      setActiveDevices(activeDevices.filter(device => device.id !== sessionId))
    } catch (err: any) {
      console.error('Error terminating session:', err)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '' }

    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    const labels = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong']
    
    return { 
      strength: (strength / 5) * 100, 
      label: labels[strength - 1] || 'Very Weak' 
    }
  }

  const newPassword = passwordForm.watch('newPassword')
  const passwordStrength = getPasswordStrength(newPassword)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to maintain account security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)}>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input 
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    {...passwordForm.register('currentPassword')}
                    aria-invalid={!!passwordForm.formState.errors.currentPassword}
                  />
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 -translate-y-1/2" 
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-red-500">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input 
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    {...passwordForm.register('newPassword')}
                    aria-invalid={!!passwordForm.formState.errors.newPassword}
                  />
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 -translate-y-1/2" 
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
                )}
                
                {/* Password strength indicator */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.strength <= 20 ? 'w-1/5 bg-red-500' :
                          passwordStrength.strength <= 40 ? 'w-2/5 bg-orange-500' :
                          passwordStrength.strength <= 60 ? 'w-3/5 bg-yellow-500' :
                          passwordStrength.strength <= 80 ? 'w-4/5 bg-green-400' :
                          'w-full bg-green-600'
                        }`}
                        role="progressbar"
                        aria-label="Password strength indicator"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Strength: {passwordStrength.label}
                    </p>
                  </div>
                )}
                
                <ul className="text-xs text-gray-500 mt-2 space-y-1">
                  <li className={`flex items-center ${newPassword && newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                    {newPassword && newPassword.length >= 8 ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <span className="h-3 w-3 mr-1">•</span>
                    )}
                    At least 8 characters
                  </li>
                  <li className={`flex items-center ${newPassword && /[A-Z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                    {newPassword && /[A-Z]/.test(newPassword) ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <span className="h-3 w-3 mr-1">•</span>
                    )}
                    At least one uppercase letter
                  </li>
                  <li className={`flex items-center ${newPassword && /[a-z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                    {newPassword && /[a-z]/.test(newPassword) ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <span className="h-3 w-3 mr-1">•</span>
                    )}
                    At least one lowercase letter
                  </li>
                  <li className={`flex items-center ${newPassword && /[0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                    {newPassword && /[0-9]/.test(newPassword) ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <span className="h-3 w-3 mr-1">•</span>
                    )}
                    At least one number
                  </li>
                  <li className={`flex items-center ${newPassword && /[^A-Za-z0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                    {newPassword && /[^A-Za-z0-9]/.test(newPassword) ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <span className="h-3 w-3 mr-1">•</span>
                    )}
                    At least one special character
                  </li>
                </ul>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword"
                  type="password"
                  {...passwordForm.register('confirmPassword')}
                  aria-invalid={!!passwordForm.formState.errors.confirmPassword}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              
              <Button type="submit" className="w-full mt-4" disabled={isSavingPassword}>
                {isSavingPassword ? (
                  <>
                    <LoadingSpinner className="mr-2" size="sm" />
                    Updating Password...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              Add an extra layer of security to your account with 2FA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tfaError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{tfaError}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">
                  {is2FAEnabled 
                    ? 'Your account is protected with 2FA'
                    : 'Protect your account with 2FA'}
                </p>
              </div>
              <Switch 
                checked={is2FAEnabled}
                onCheckedChange={toggle2FA}
                disabled={isSaving2FA}
              />
            </div>
            
            <div className="pt-4 pb-2">
              <div className="flex items-start space-x-3">
                <Shield className={`h-5 w-5 mt-0.5 ${is2FAEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <h4 className="text-sm font-medium">Enhanced Security</h4>
                  <p className="text-sm text-gray-500">
                    Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to sign in.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>
              Manage your active devices and sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeDevices.length === 0 ? (
              <p className="text-gray-500 text-sm py-2">No active sessions found.</p>
            ) : (
              <ul className="space-y-3">
                {activeDevices.map((session) => (
                  <li key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium text-sm">{session.device}</p>
                      <p className="text-xs text-gray-500">Last active: {session.lastActive}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => terminateSession(session.id)}
                    >
                      Sign Out
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            
            <Button 
              variant="outline"
              className="w-full mt-2"
              onClick={() => terminateSession('all')}
              disabled={activeDevices.length === 0}
            >
              Sign Out All Devices
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 2FA Verification Dialog */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Your Identity</DialogTitle>
            <DialogDescription>
              We've sent a verification code to your email address. Enter the code below to enable two-factor authentication.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Verification Code</Label>
              <div className="relative">
                <Input
                  id="verificationCode"
                  type={showVerificationCode ? "text" : "password"}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="pr-10"
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2" 
                  onClick={() => setShowVerificationCode(!showVerificationCode)}
                  aria-label={showVerificationCode ? "Hide code" : "Show code"}
                >
                  {showVerificationCode ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            
            {tfaError && (
              <p className="text-sm text-red-500">{tfaError}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setVerificationDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={validate2FACode} 
              disabled={isSaving2FA || verificationCode.length !== 6}
            >
              {isSaving2FA ? (
                <>
                  <LoadingSpinner className="mr-2" size="sm" />
                  Verifying...
                </>
              ) : (
                'Verify & Enable'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
