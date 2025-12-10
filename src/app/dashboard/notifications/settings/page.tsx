'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Switch } from '@headlessui/react'
import { BellIcon, ClockIcon, DevicePhoneMobileIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

interface NotificationSettings {
  dailyReminders: boolean
  weeklyReports: boolean
  phaseTransitions: boolean
  healthInsights: boolean
  modalityAlerts: boolean
  preferredTime: string
  timezone: string
  channels: {
    email: boolean
    inApp: boolean
    sms: boolean
  }
  phoneNumber?: string
}

export default function NotificationSettings() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<NotificationSettings>({
    dailyReminders: true,
    weeklyReports: true,
    phaseTransitions: true,
    healthInsights: true,
    modalityAlerts: true,
    preferredTime: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    channels: {
      email: true,
      inApp: true,
      sms: false
    }
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (session?.user?.email) {
      fetchSettings()
    }
  }, [session])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error)
    }
  }

  const saveSettings = async () => {
    if (!session?.user?.email) return
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (!response.ok) throw new Error('Failed to save settings')
    } catch (error) {
      console.error('Error saving notification settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
        <div className="border-b border-gray-100 pb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Notification Settings</h1>
          <p className="mt-2 text-sm text-gray-500">
            Customize how and when you receive updates about your regeneration journey.
          </p>
        </div>

        {/* Notification Types */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Notification Types</h2>
          <div className="grid gap-6">
            {[
              { id: 'dailyReminders', label: 'Daily Protocol Reminders', description: 'Get reminders about your daily products and protocols' },
              { id: 'modalityAlerts', label: 'Modality Session Alerts', description: 'Receive preparation instructions before scheduled sessions' },
              { id: 'weeklyReports', label: 'Weekly Progress Reports', description: 'Review your weekly adherence and biomarker trends' },
              { id: 'phaseTransitions', label: 'Phase Transition Celebrations', description: 'Celebrate your progress as you complete each phase' },
              { id: 'healthInsights', label: 'Health Insights', description: 'Receive personalized insights based on your biomarkers' }
            ].map(({ id, label, description }) => (
              <div key={id} className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{label}</h3>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
                <Switch
                  checked={settings[id as keyof typeof settings] as boolean}
                  onChange={(checked) => setSettings(prev => ({ ...prev, [id]: checked }))}
                  className={`${
                    settings[id as keyof typeof settings] ? 'bg-blue-500' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                >
                  <span className="sr-only">Enable {label}</span>
                  <span
                    className={`${
                      settings[id as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Channels */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Delivery Channels</h2>
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive updates in your inbox</p>
                </div>
              </div>
              <Switch
                checked={settings.channels.email}
                onChange={(checked) => 
                  setSettings(prev => ({ 
                    ...prev, 
                    channels: { ...prev.channels, email: checked } 
                  }))
                }
                className={`${
                  settings.channels.email ? 'bg-blue-500' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
              >
                <span className="sr-only">Enable email notifications</span>
                <span
                  className={`${
                    settings.channels.email ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BellIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">In-App Notifications</h3>
                  <p className="text-sm text-gray-500">Get notifications while using the app</p>
                </div>
              </div>
              <Switch
                checked={settings.channels.inApp}
                onChange={(checked) => 
                  setSettings(prev => ({ 
                    ...prev, 
                    channels: { ...prev.channels, inApp: checked } 
                  }))
                }
                className={`${
                  settings.channels.inApp ? 'bg-blue-500' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
              >
                <span className="sr-only">Enable in-app notifications</span>
                <span
                  className={`${
                    settings.channels.inApp ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                  <p className="text-sm text-gray-500">Get text messages for important updates</p>
                </div>
              </div>
              <Switch
                checked={settings.channels.sms}
                onChange={(checked) => 
                  setSettings(prev => ({ 
                    ...prev, 
                    channels: { ...prev.channels, sms: checked } 
                  }))
                }
                className={`${
                  settings.channels.sms ? 'bg-blue-500' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
              >
                <span className="sr-only">Enable SMS notifications</span>
                <span
                  className={`${
                    settings.channels.sms ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>

            {settings.channels.sms && (
              <div className="ml-8">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={settings.phoneNumber || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="+1 (555) 555-5555"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timing Preferences */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Timing Preferences</h2>
          <div className="grid gap-6">
            <div>
              <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-700">
                Preferred Time for Daily Notifications
              </label>
              <div className="mt-1 flex items-center space-x-3">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <input
                  type="time"
                  name="preferredTime"
                  id="preferredTime"
                  value={settings.preferredTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, preferredTime: e.target.value }))}
                  className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-6 border-t border-gray-100">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isSaving ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  )
}
