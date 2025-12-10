'use client'

import React, { useState } from 'react'
import { User } from '@/types/user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from '@/components/ui/use-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { AlertCircle, LockIcon, Users, ShieldAlert, FileText } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface PrivacySettingsFormProps {
  user: User;
  onSaveSuccess: () => void;
}

export default function PrivacySettingsForm({ user, onSaveSuccess }: PrivacySettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [settings, setSettings] = useState({
    shareBiomarkers: user.preferences?.dataSharing?.shareBiomarkers ?? false,
    shareJournalEntries: user.preferences?.dataSharing?.shareJournalEntries ?? false,
    shareProgress: user.preferences?.dataSharing?.shareProgress ?? false,
    encryptJournalEntries: user.preferences?.privacySettings?.encryptJournalEntries ?? false,
  })
  
  const [practitionerAccess, setPractitionerAccess] = useState<Array<{
    id: string;
    name: string;
    email: string;
    speciality: string;
    accessGranted: string;
    lastAccess: string | null;
  }>>([
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      email: 'dr.johnson@example.com',
      speciality: 'Oncology',
      accessGranted: '2023-09-15',
      lastAccess: '2023-10-22',
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      email: 'dr.chen@example.com',
      speciality: 'Hepatology',
      accessGranted: '2023-10-01',
      lastAccess: null,
    }
  ])
  
  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }))
  }

  const saveSettings = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/user/privacy-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataSharing: {
            shareBiomarkers: settings.shareBiomarkers,
            shareJournalEntries: settings.shareJournalEntries,
            shareProgress: settings.shareProgress,
          },
          privacySettings: {
            encryptJournalEntries: settings.encryptJournalEntries,
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update privacy settings')
      }

      onSaveSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to update privacy settings')
    } finally {
      setIsSaving(false)
    }
  }

  const revokePractitionerAccess = async (practitionerId: string) => {
    try {
      const response = await fetch(`/api/user/practitioner-access/${practitionerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to revoke access')
      }

      // Update local state
      setPractitionerAccess(practitionerAccess.filter(p => p.id !== practitionerId))
    } catch (err: any) {
      setError(err.message || 'Failed to revoke practitioner access')
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
          <CardTitle>Data Sharing Permissions</CardTitle>
          <CardDescription>
            Control how your health data is shared with your authorized practitioners
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <FileText className="h-5 w-5 mt-0.5 text-blue-500" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="share-biomarkers" className="font-medium">
                    Share Biomarker Data
                  </Label>
                  <Switch 
                    id="share-biomarkers"
                    checked={settings.shareBiomarkers}
                    onCheckedChange={() => handleSettingChange('shareBiomarkers')}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Allow your practitioners to view your biomarker trends and test results
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <FileText className="h-5 w-5 mt-0.5 text-blue-500" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="share-journal" className="font-medium">
                    Share Journal Entries
                  </Label>
                  <Switch 
                    id="share-journal"
                    checked={settings.shareJournalEntries}
                    onCheckedChange={() => handleSettingChange('shareJournalEntries')}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Allow your practitioners to view your daily journal entries and emotional tracking
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <FileText className="h-5 w-5 mt-0.5 text-blue-500" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="share-progress" className="font-medium">
                    Share Progress Reports
                  </Label>
                  <Switch 
                    id="share-progress"
                    checked={settings.shareProgress}
                    onCheckedChange={() => handleSettingChange('shareProgress')}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Allow your practitioners to view your progress through the protocol phases
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enhanced Privacy Controls</CardTitle>
          <CardDescription>
            Additional security measures to protect your sensitive health information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <LockIcon className="h-5 w-5 mt-0.5 text-blue-500" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="encrypt-journal" className="font-medium">
                    Encrypt Journal Entries
                  </Label>
                  <Switch 
                    id="encrypt-journal"
                    checked={settings.encryptJournalEntries}
                    onCheckedChange={() => handleSettingChange('encryptJournalEntries')}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Add end-to-end encryption to your journal entries for maximum privacy
                </p>
              </div>
            </div>
            
            <div className="pt-2 pb-0">
              <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Privacy Notice</AlertTitle>
                <AlertDescription>
                  Your health data is always stored securely and never shared with third parties without your explicit consent. These settings control sharing with your authorized healthcare providers only.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Practitioner Access Log</CardTitle>
          <CardDescription>
            Manage and monitor healthcare practitioners with access to your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {practitionerAccess.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No practitioners currently have access to your data.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {practitionerAccess.map((practitioner) => (
                <AccordionItem key={practitioner.id} value={practitioner.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center text-left">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{practitioner.name}</p>
                        <p className="text-sm text-gray-500">{practitioner.speciality}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Email</p>
                          <p>{practitioner.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Access Granted</p>
                          <p>{new Date(practitioner.accessGranted).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Last Access</p>
                          <p>
                            {practitioner.lastAccess 
                              ? new Date(practitioner.lastAccess).toLocaleDateString() 
                              : 'Never accessed'}
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full mt-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => revokePractitionerAccess(practitioner.id)}
                      >
                        Revoke Access
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button 
          type="button" 
          onClick={saveSettings} 
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <LoadingSpinner className="mr-2" size="sm" />
              Saving...
            </>
          ) : (
            'Save Privacy Settings'
          )}
        </Button>
      </div>
    </div>
  )
}
