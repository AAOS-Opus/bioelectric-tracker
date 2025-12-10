'use client'

import React, { useState } from 'react'
import { User } from '@/types/user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from '@/components/ui/use-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { AlertCircle, LogOut, UserX, Download, RefreshCw, X, AlertTriangle, Archive } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@/hooks/useUser'

interface AccountManagementFormProps {
  user: User;
  onAction: (action: 'export' | 'suspend' | 'reactivate' | 'delete') => void;
}

export default function AccountManagementForm({ user, onAction }: AccountManagementFormProps) {
  const { logout } = useUser()
  const [isExporting, setIsExporting] = useState(false)
  const [isSuspending, setIsSuspending] = useState(false)
  const [isReactivating, setIsReactivating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  
  // Account status - in a real app, this would come from the user object
  const [accountStatus, setAccountStatus] = useState<'active' | 'suspended'>('active')
  
  const exportUserData = async () => {
    setIsExporting(true)
    setError(null)

    try {
      const response = await fetch('/api/user/export-data', {
        method: 'GET',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to export data')
      }
      
      // Convert the response to a blob and create a download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `bioelectric_data_${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: 'Data exported successfully',
        description: 'Your data has been downloaded to your device.',
      })
      
      onAction('export')
    } catch (err: any) {
      setError(err.message || 'Failed to export user data')
      toast({
        title: 'Export failed',
        description: err.message || 'There was an error exporting your data.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }
  
  const suspendAccount = async () => {
    setIsSuspending(true)
    setError(null)

    try {
      const response = await fetch('/api/user/suspend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: feedbackText,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to suspend account')
      }
      
      setAccountStatus('suspended')
      setShowSuspendDialog(false)
      setFeedbackText('')
      
      toast({
        title: 'Account suspended',
        description: 'Your account has been temporarily suspended. You can reactivate it at any time.',
      })
      
      onAction('suspend')
    } catch (err: any) {
      setError(err.message || 'Failed to suspend account')
      toast({
        variant: 'destructive',
        title: 'Error suspending account',
        description: err.message || 'There was an error suspending your account.',
      })
    } finally {
      setIsSuspending(false)
    }
  }
  
  const reactivateAccount = async () => {
    setIsReactivating(true)
    setError(null)

    try {
      const response = await fetch('/api/user/reactivate', {
        method: 'POST',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to reactivate account')
      }
      
      setAccountStatus('active')
      
      toast({
        title: 'Account reactivated',
        description: 'Your account has been successfully reactivated.',
      })
      
      onAction('reactivate')
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate account')
      toast({
        variant: 'destructive',
        title: 'Error reactivating account',
        description: err.message || 'There was an error reactivating your account.',
      })
    } finally {
      setIsReactivating(false)
    }
  }
  
  const deleteAccount = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: feedbackText,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete account')
      }
      
      // Close dialog and log the user out
      setShowDeleteDialog(false)
      setFeedbackText('')
      
      toast({
        title: 'Account deleted',
        description: 'Your account and data have been permanently deleted.',
      })
      
      onAction('delete')
      
      // Give time for the toast to be seen before logout
      setTimeout(() => {
        logout()
        window.location.href = '/'
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to delete account')
      toast({
        variant: 'destructive',
        title: 'Error deleting account',
        description: err.message || 'There was an error deleting your account.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            View and manage your account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Account Status</p>
              <div className="flex items-center mt-1">
                <div 
                  className={`h-2 w-2 rounded-full mr-2 ${
                    accountStatus === 'active' ? 'bg-green-500' : 'bg-amber-500'
                  }`}
                />
                <p className="font-medium">
                  {accountStatus === 'active' ? 'Active' : 'Suspended'}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Member Since</p>
              <p className="font-medium mt-1">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Current Phase</p>
              <p className="font-medium mt-1">Phase {user.currentPhaseId}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">Program Start Date</p>
              <p className="font-medium mt-1">
                {new Date(user.programStartDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export and manage your personal data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-start space-x-4">
              <Download className="h-6 w-6 text-blue-500 mt-1" />
              <div className="space-y-2">
                <h4 className="font-medium">Export Your Data</h4>
                <p className="text-sm text-gray-500">
                  Download a copy of all your personal data including profile information, journal entries, 
                  biomarker readings, and progress reports.
                </p>
                <Button 
                  onClick={exportUserData}
                  disabled={isExporting}
                  aria-label="Export all your data"
                >
                  {isExporting ? (
                    <>
                      <LoadingSpinner className="mr-2" size="sm" />
                      Exporting...
                    </>
                  ) : (
                    'Export Data'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Management</CardTitle>
          <CardDescription>
            Options for managing your account status and subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {accountStatus === 'active' ? (
              <div className="flex items-start space-x-4">
                <Archive className="h-6 w-6 text-amber-500 mt-1" />
                <div className="space-y-2">
                  <h4 className="font-medium">Temporarily Suspend Account</h4>
                  <p className="text-sm text-gray-500">
                    Pause your account temporarily. Your data will be preserved, but you won't be able
                    to access the application until you reactivate your account.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => setShowSuspendDialog(true)}
                    disabled={isSuspending}
                    aria-label="Suspend your account temporarily"
                  >
                    {isSuspending ? (
                      <>
                        <LoadingSpinner className="mr-2" size="sm" />
                        Suspending...
                      </>
                    ) : (
                      'Suspend Account'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-4">
                <RefreshCw className="h-6 w-6 text-green-500 mt-1" />
                <div className="space-y-2">
                  <h4 className="font-medium">Reactivate Account</h4>
                  <p className="text-sm text-gray-500">
                    Reactivate your suspended account to regain access to all features and your data.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={reactivateAccount}
                    disabled={isReactivating}
                    aria-label="Reactivate your suspended account"
                  >
                    {isReactivating ? (
                      <>
                        <LoadingSpinner className="mr-2" size="sm" />
                        Reactivating...
                      </>
                    ) : (
                      'Reactivate Account'
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-start space-x-4">
                <X className="h-6 w-6 text-red-500 mt-1" />
                <div className="space-y-2">
                  <h4 className="font-medium">Delete Account</h4>
                  <p className="text-sm text-gray-500">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button 
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                    aria-label="Permanently delete your account and all data"
                  >
                    {isDeleting ? (
                      <>
                        <LoadingSpinner className="mr-2" size="sm" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Account'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Suspension Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend Your Account</DialogTitle>
            <DialogDescription>
              Your account will be temporarily deactivated. You can reactivate it at any time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Account will be suspended</AlertTitle>
              <AlertDescription>
                While suspended, you won't be able to access the application or receive notifications.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="suspend-feedback">Why are you suspending your account? (Optional)</Label>
              <Textarea 
                id="suspend-feedback"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Please let us know why you're suspending your account..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => {
                setShowSuspendDialog(false)
                setFeedbackText('')
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              onClick={suspendAccount}
              disabled={isSuspending}
            >
              {isSuspending ? (
                <>
                  <LoadingSpinner className="mr-2" size="sm" />
                  Suspending...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Suspend Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Deletion Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Your Account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning: Data Loss</AlertTitle>
              <AlertDescription>
                All your personal data, journal entries, biomarker data, and progress will be permanently deleted.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="delete-feedback">Why are you deleting your account? (Optional)</Label>
              <Textarea 
                id="delete-feedback"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Please let us know why you're deleting your account..."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                Type "DELETE" to confirm
              </Label>
              <Input 
                id="delete-confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="uppercase"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setConfirmationText('')
                setFeedbackText('')
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={deleteAccount}
              disabled={isDeleting || confirmationText !== 'DELETE'}
            >
              {isDeleting ? (
                <>
                  <LoadingSpinner className="mr-2" size="sm" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
