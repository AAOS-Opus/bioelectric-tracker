'use client'

import React, { useState, useEffect } from 'react'
import { User } from '@/types/user'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from '@/components/ui/use-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { AlertCircle, MessageSquare, Mail, Phone } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { BellRing, Clock } from 'lucide-react'

interface CommunicationPreferencesFormProps {
  user: User;
  onSaveSuccess: () => void;
}

export default function CommunicationPreferencesForm({ user, onSaveSuccess }: CommunicationPreferencesFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Notification channel preferences
  const [settings, setSettings] = useState({
    email: user.preferences?.notificationSettings?.email ?? true,
    inApp: user.preferences?.notificationSettings?.inApp ?? true,
    sms: user.preferences?.notificationSettings?.sms ?? false,
    pushNotifications: true,
  })
  
  // Communication frequency and timing
  const [frequency, setFrequency] = useState({
    dailyReminders: true,
    weeklyProgressReports: true,
    phaseTransitionAlerts: true,
    protocolUpdates: true,
    marketingCommunications: false,
  })
  
  const [quietHours, setQuietHours] = useState({
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
    timezone: 'America/Los_Angeles',
  })
  
  const [notificationVolume, setNotificationVolume] = useState(7) // Scale of 1-10
  
  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }))
  }
  
  const handleFrequencyChange = (setting: keyof typeof frequency) => {
    setFrequency(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }))
  }
  
  const handleQuietHoursToggle = () => {
    setQuietHours(prev => ({
      ...prev,
      enabled: !prev.enabled
    }))
  }
  
  const saveSettings = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/user/communication-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationSettings: {
            email: settings.email,
            inApp: settings.inApp,
            sms: settings.sms,
            pushNotifications: settings.pushNotifications,
            frequency: frequency,
            quietHours: quietHours,
            notificationVolume: notificationVolume
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update communication preferences')
      }

      onSaveSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to update communication preferences')
    } finally {
      setIsSaving(false)
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
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Choose how you'd like to receive updates and reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <Mail className="h-5 w-5 mt-0.5 text-blue-500" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications" className="font-medium">
                    Email Notifications
                  </Label>
                  <Switch 
                    id="email-notifications"
                    checked={settings.email}
                    onCheckedChange={() => handleSettingChange('email')}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Receive important updates and summaries via email
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <BellRing className="h-5 w-5 mt-0.5 text-blue-500" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="in-app-notifications" className="font-medium">
                    In-App Notifications
                  </Label>
                  <Switch 
                    id="in-app-notifications"
                    checked={settings.inApp}
                    onCheckedChange={() => handleSettingChange('inApp')}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Receive real-time updates when using the app
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="sms-notifications" className="font-medium">
                    SMS notifications
                  </Label>
                  <p className="text-xs text-gray-500">
                    Receive timely reminders via text message
                  </p>
                </div>
                <Switch 
                  id="sms-notifications"
                  checked={settings.sms}
                  onCheckedChange={() => handleSettingChange('sms')}
                  disabled={!user.phoneNumber}
                  aria-label="Toggle SMS notifications"
                />
              </div>
              {!user.phoneNumber && (
                <div className="text-xs text-amber-600 flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  <span>Add a phone number in your personal info to enable SMS notifications</span>
                </div>
              )}
            </div>
            
            <div className="flex items-start space-x-4">
              <BellRing className="h-5 w-5 mt-0.5 text-blue-500" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications" className="font-medium">
                    Push Notifications
                  </Label>
                  <Switch 
                    id="push-notifications"
                    checked={settings.pushNotifications}
                    onCheckedChange={() => handleSettingChange('pushNotifications')}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Receive alerts on your device even when not using the app
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Customize what types of notifications you receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="daily-reminders" className="font-medium">
                    Daily Protocol Reminders
                  </Label>
                  <Switch 
                    id="daily-reminders"
                    checked={frequency.dailyReminders}
                    onCheckedChange={() => handleFrequencyChange('dailyReminders')}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Receive daily reminders about your scheduled protocols and treatments
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="weekly-reports" className="font-medium">
                    Weekly Progress Reports
                  </Label>
                  <Switch 
                    id="weekly-reports"
                    checked={frequency.weeklyProgressReports}
                    onCheckedChange={() => handleFrequencyChange('weeklyProgressReports')}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Receive a summary of your weekly progress and biomarker trends
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="phase-transitions" className="font-medium">
                    Phase Transition Alerts
                  </Label>
                  <Switch 
                    id="phase-transitions"
                    checked={frequency.phaseTransitionAlerts}
                    onCheckedChange={() => handleFrequencyChange('phaseTransitionAlerts')}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Be notified when you're advancing to the next phase of your regeneration program
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="protocol-updates" className="font-medium">
                    Protocol Updates
                  </Label>
                  <Switch 
                    id="protocol-updates"
                    checked={frequency.protocolUpdates}
                    onCheckedChange={() => handleFrequencyChange('protocolUpdates')}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Receive notifications when your treatment protocol is updated
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="marketing" className="font-medium">
                    Marketing Communications
                  </Label>
                  <Switch 
                    id="marketing"
                    checked={frequency.marketingCommunications}
                    onCheckedChange={() => handleFrequencyChange('marketingCommunications')}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Receive information about new features, products, and regenerative health news
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>
            Set time periods when you don't want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="quiet-hours" className="font-medium">Enable Quiet Hours</Label>
              <p className="text-sm text-gray-500">Pause all notifications during specific times</p>
            </div>
            <Switch 
              id="quiet-hours"
              checked={quietHours.enabled}
              onCheckedChange={handleQuietHoursToggle}
            />
          </div>
          
          {quietHours.enabled && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">From</Label>
                <Input 
                  id="start-time"
                  type="time"
                  value={quietHours.startTime}
                  onChange={(e) => setQuietHours(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-time">To</Label>
                <Input 
                  id="end-time"
                  type="time"
                  value={quietHours.endTime}
                  onChange={(e) => setQuietHours(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select 
                  value={quietHours.timezone}
                  onValueChange={(value) => setQuietHours(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Japan Standard Time (JST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Australian Eastern Time (AET)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Frequency</CardTitle>
          <CardDescription>
            Adjust how often you'd like to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Notification Volume</Label>
            <div className="space-y-1">
              <Slider
                defaultValue={[notificationVolume]}
                max={10}
                min={1}
                step={1}
                onValueChange={(values) => setNotificationVolume(values[0])}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Fewer</span>
                <span>Balanced</span>
                <span>More</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Current setting: {
                notificationVolume <= 3 ? 'Minimal - only critical alerts' :
                notificationVolume <= 7 ? 'Balanced - important notifications only' :
                'Comprehensive - receive all updates'
              }
            </p>
          </div>
          
          <div className="pt-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Clock className="h-4 w-4 text-blue-500" />
              <AlertTitle>Communication Schedule</AlertTitle>
              <AlertDescription className="text-sm">
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Daily protocol reminders: 8:00 AM in your local time</li>
                  <li>Weekly progress reports: Mondays at 9:00 AM</li>
                  <li>Monthly health insights: 1st of each month</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end space-x-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => {
            setSettings({
              email: true,
              inApp: true,
              sms: false,
              pushNotifications: true,
            })
            setFrequency({
              dailyReminders: true,
              weeklyProgressReports: true,
              phaseTransitionAlerts: true,
              protocolUpdates: true,
              marketingCommunications: false,
            })
            setQuietHours({
              enabled: false,
              startTime: '22:00',
              endTime: '07:00',
              timezone: 'America/Los_Angeles',
            })
            setNotificationVolume(7)
          }}
        >
          Reset to Defaults
        </Button>
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
            'Save Preferences'
          )}
        </Button>
      </div>
    </div>
  )
}
