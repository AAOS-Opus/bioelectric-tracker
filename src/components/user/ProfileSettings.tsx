'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useUser } from '@/hooks/useUser'
import PersonalInfoForm from './PersonalInfoForm'
import SecuritySettingsForm from './SecuritySettingsForm'
import PrivacySettingsForm from './PrivacySettingsForm'
import CommunicationPreferencesForm from './CommunicationPreferencesForm'
import AccountManagementForm from './AccountManagementForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { trackProfileEvent } from '@/lib/analytics'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import Link from 'next/link'

export interface ProfileCompletionStatus {
  personalInfo: number;
  security: number;
  privacy: number;
  communication: number;
  overall: number;
}

export const ProfileSettings = () => {
  const { user, loading, refreshUser } = useUser()
  const [activeTab, setActiveTab] = useState('personal-info')
  const [isSaving, setIsSaving] = useState(false)
  const [completionStatus, setCompletionStatus] = useState<ProfileCompletionStatus>({
    personalInfo: 0,
    security: 0,
    privacy: 0,
    communication: 0,
    overall: 0
  })

  useEffect(() => {
    // Calculate completion status when user data changes
    if (user) {
      calculateCompletionStatus()
    }
  }, [user])

  useEffect(() => {
    // Track tab changes for analytics
    if (activeTab) {
      trackProfileEvent('tab_change', { tab: activeTab })
    }
  }, [activeTab])

  const calculateCompletionStatus = () => {
    if (!user) return

    // Personal info completion
    const personalInfoFields = ['name', 'email', 'profileImage']
    const personalInfoCompleted = personalInfoFields.filter(field => !!user[field as keyof typeof user]).length
    const personalInfoPercentage = Math.round((personalInfoCompleted / personalInfoFields.length) * 100)

    // Security completion - checking if user has set up 2FA
    const securityPercentage = user.preferences?.privacySettings?.twoFactorAuthentication ? 100 : 0

    // Privacy completion
    const privacyFields = ['encryptJournalEntries', 'shareBiomarkers', 'shareJournalEntries', 'shareProgress']
    const privacyFieldsCount = 4 // Total number of privacy fields
    let privacyCompleted = 0

    if (user.preferences?.privacySettings?.encryptJournalEntries !== undefined) privacyCompleted++
    if (user.preferences?.dataSharing?.shareBiomarkers !== undefined) privacyCompleted++
    if (user.preferences?.dataSharing?.shareJournalEntries !== undefined) privacyCompleted++
    if (user.preferences?.dataSharing?.shareProgress !== undefined) privacyCompleted++

    const privacyPercentage = Math.round((privacyCompleted / privacyFieldsCount) * 100)

    // Communication preferences completion
    const communicationFields = ['email', 'inApp', 'sms']
    const communicationFieldsCount = 3
    let communicationCompleted = 0

    if (user.preferences?.notificationSettings?.email !== undefined) communicationCompleted++
    if (user.preferences?.notificationSettings?.inApp !== undefined) communicationCompleted++
    if (user.preferences?.notificationSettings?.sms !== undefined) communicationCompleted++

    const communicationPercentage = Math.round((communicationCompleted / communicationFieldsCount) * 100)

    // Overall completion
    const overall = Math.round(
      (personalInfoPercentage + securityPercentage + privacyPercentage + communicationPercentage) / 4
    )

    setCompletionStatus({
      personalInfo: personalInfoPercentage,
      security: securityPercentage,
      privacy: privacyPercentage,
      communication: communicationPercentage,
      overall
    })
  }

  const getNextIncompleteSection = (): string => {
    const { personalInfo, security, privacy, communication } = completionStatus
    
    if (personalInfo < 100) return 'personal-info'
    if (security < 100) return 'security'
    if (privacy < 100) return 'privacy'
    if (communication < 100) return 'communication'
    
    return 'personal-info' // Default to personal info if all complete
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500 mb-4">You need to be logged in to view your profile settings.</p>
        <Button onClick={() => window.location.href = '/login'}>Go to Login</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-screen-xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-gray-500 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Completion Indicator */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Profile Completion</CardTitle>
            <CardDescription>Complete your profile to get the most out of your regeneration journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Completion</span>
                <span className="text-sm text-gray-500">{completionStatus.overall}%</span>
              </div>
              <Progress value={completionStatus.overall} className="h-2" />
            </div>
            
            {completionStatus.overall < 100 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium mb-2">Complete Your Profile</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveTab(getNextIncompleteSection())}
                >
                  Continue Setup
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="personal-info" className="relative">
              Personal Info
              {completionStatus.personalInfo < 100 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="security" className="relative">
              Security
              {completionStatus.security < 100 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="privacy" className="relative">
              Privacy
              {completionStatus.privacy < 100 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="communication" className="relative">
              Communication
              {completionStatus.communication < 100 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="appearance">
              Appearance
            </TabsTrigger>
            <TabsTrigger value="account">
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal-info" className="mt-6">
            <PersonalInfoForm 
              user={user} 
              onUpdate={(updatedValues) => {
                refreshUser()
                toast({
                  title: "Profile updated",
                  description: "Your personal information has been saved successfully.",
                })
                trackProfileEvent('profile_updated', { section: 'personal_info' })
              }}
            />
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecuritySettingsForm 
              user={user}
              onSaveSuccess={() => {
                refreshUser()
                toast({
                  title: "Security settings updated",
                  description: "Your security settings have been updated successfully.",
                })
                trackProfileEvent('security_updated')
              }}
            />
          </TabsContent>

          <TabsContent value="privacy" className="mt-6">
            <PrivacySettingsForm 
              user={user}
              onSaveSuccess={() => {
                refreshUser()
                toast({
                  title: "Privacy settings updated",
                  description: "Your privacy preferences have been saved successfully.",
                })
                trackProfileEvent('privacy_updated')
              }}
            />
          </TabsContent>

          <TabsContent value="communication" className="mt-6">
            <CommunicationPreferencesForm 
              user={user} 
              onSaveSuccess={() => {
                refreshUser()
                toast({
                  title: "Communication preferences updated",
                  description: "Your notification settings have been saved successfully.",
                })
                trackProfileEvent('communication_updated')
              }}
            />
          </TabsContent>

          <TabsContent value="appearance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of your application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Theme</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Choose between light, dark, or system theme
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Theme Mode</span>
                    <ThemeToggle />
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Advanced Preferences</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Configure additional display options, accessibility settings, and more
                      </p>
                    </div>
                    <Button asChild variant="outline">
                      <Link href="/preferences">
                        Manage Preferences
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="mt-6">
            <AccountManagementForm 
              user={user} 
              onAction={(action: string) => {
                // Handle account actions (e.g., data export, account deletion)
                trackProfileEvent(`account_${action}_requested`)
                toast({
                  title: 'Action requested',
                  description: `Your ${action} request has been submitted.`,
                })
              }} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default ProfileSettings
