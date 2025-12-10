'use client'

import React, { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePreferences } from '@/contexts/PreferencesContext'
import { useToast } from '@/components/ui/use-toast'
import { Clock, Globe, Accessibility, Bell, Moon, Sun, Monitor } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const PreferencesPanel = () => {
  const {
    preferences,
    setPreference,
    setDisplayPreference,
    setReminderPreference,
    setAccessibilityPreference,
    resetPreferences,
    isLoading,
    isSyncing,
    syncStatus,
    lastSyncedAt
  } = usePreferences()
  
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('display')
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex justify-center items-center min-h-[300px]">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    )
  }
  
  // Format the last synced time in a user-friendly way
  const formatLastSynced = () => {
    if (!lastSyncedAt) return 'Never'
    
    const date = new Date(lastSyncedAt)
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>
          Customize your Bioelectric Regeneration experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="display" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span>Display</span>
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Reminders</span>
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="flex items-center gap-2">
              <Accessibility className="h-4 w-4" />
              <span>Accessibility</span>
            </TabsTrigger>
            <TabsTrigger value="localization" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Localization</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Display Tab */}
          <TabsContent value="display" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="theme" className="border-b">
                <AccordionTrigger className="py-4">
                  <div className="flex items-center gap-2">
                    {preferences.theme === 'light' && <Sun className="h-5 w-5" />}
                    {preferences.theme === 'dark' && <Moon className="h-5 w-5" />}
                    {preferences.theme === 'system' && <Monitor className="h-5 w-5" />}
                    <span>Theme</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-1">
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant={preferences.theme === 'light' ? 'default' : 'outline'}
                      className="flex flex-col items-center justify-center p-4 h-auto"
                      onClick={() => setPreference('theme', 'light')}
                    >
                      <Sun className="h-6 w-6 mb-2" />
                      <span>Light</span>
                    </Button>
                    <Button
                      variant={preferences.theme === 'dark' ? 'default' : 'outline'}
                      className="flex flex-col items-center justify-center p-4 h-auto"
                      onClick={() => setPreference('theme', 'dark')}
                    >
                      <Moon className="h-6 w-6 mb-2" />
                      <span>Dark</span>
                    </Button>
                    <Button
                      variant={preferences.theme === 'system' ? 'default' : 'outline'}
                      className="flex flex-col items-center justify-center p-4 h-auto"
                      onClick={() => setPreference('theme', 'system')}
                    >
                      <Monitor className="h-6 w-6 mb-2" />
                      <span>System</span>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="measurements" className="border-b">
                <AccordionTrigger className="py-4">
                  <div className="flex items-center gap-2">
                    <span>Measurement Units</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-1">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="unit-system">Unit System</Label>
                      <Select 
                        value={preferences.display.measurementUnit}
                        onValueChange={(value) => 
                          setDisplayPreference('measurementUnit', value as 'imperial' | 'metric')
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select units" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="imperial">Imperial (lb, in)</SelectItem>
                          <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="dashboard" className="border-b">
                <AccordionTrigger className="py-4">
                  <div className="flex items-center gap-2">
                    <span>Dashboard Layout</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-1">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="default-view">Default View</Label>
                      <Select
                        value={preferences.display.defaultDashboardView}
                        onValueChange={(value) => 
                          setDisplayPreference('defaultDashboardView', value as any)
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select view" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily Focus</SelectItem>
                          <SelectItem value="weekly">Weekly Overview</SelectItem>
                          <SelectItem value="calendar">Calendar</SelectItem>
                          <SelectItem value="progress">Progress</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          {/* Reminders Tab */}
          <TabsContent value="reminders" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="reminder-timing" className="border-b">
                <AccordionTrigger className="py-4">Reminder Timing</AccordionTrigger>
                <AccordionContent className="pb-4 pt-1">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="lead-time">Default Lead Time (minutes)</Label>
                      <Input
                        id="lead-time"
                        type="number"
                        className="w-24"
                        value={preferences.reminderDefaults.leadTime}
                        onChange={(e) => 
                          setReminderPreference('leadTime', parseInt(e.target.value, 10))
                        }
                        min={0}
                        max={1440}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="quiet-hours" className="border-b">
                <AccordionTrigger className="py-4">Quiet Hours</AccordionTrigger>
                <AccordionContent className="pb-4 pt-1">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable-quiet-hours">Enable Quiet Hours</Label>
                      <Switch
                        id="enable-quiet-hours"
                        checked={preferences.reminderDefaults.enableQuietHours}
                        onCheckedChange={(checked) => 
                          setReminderPreference('enableQuietHours', checked)
                        }
                      />
                    </div>
                    
                    {preferences.reminderDefaults.enableQuietHours && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="quiet-hours-start">Quiet Hours Start</Label>
                          <Input
                            id="quiet-hours-start"
                            type="time"
                            className="w-32"
                            value={preferences.reminderDefaults.quietHoursStart}
                            onChange={(e) => 
                              setReminderPreference('quietHoursStart', e.target.value)
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="quiet-hours-end">Quiet Hours End</Label>
                          <Input
                            id="quiet-hours-end"
                            type="time"
                            className="w-32"
                            value={preferences.reminderDefaults.quietHoursEnd}
                            onChange={(e) => 
                              setReminderPreference('quietHoursEnd', e.target.value)
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="urgent-bypass">Allow Urgent During Quiet Hours</Label>
                          <Switch
                            id="urgent-bypass"
                            checked={preferences.reminderDefaults.allowUrgentDuringQuietHours}
                            onCheckedChange={(checked) => 
                              setReminderPreference('allowUrgentDuringQuietHours', checked)
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="notification-channels" className="border-b">
                <AccordionTrigger className="py-4">Notification Channels</AccordionTrigger>
                <AccordionContent className="pb-4 pt-1">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="in-app-notifications">In-App Notifications</Label>
                      <Switch
                        id="in-app-notifications"
                        checked={preferences.notificationSettings.inApp}
                        onCheckedChange={(checked) => 
                          setPreference('notificationSettings', {
                            ...preferences.notificationSettings,
                            inApp: checked
                          })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <Switch
                        id="email-notifications"
                        checked={preferences.notificationSettings.email}
                        onCheckedChange={(checked) => 
                          setPreference('notificationSettings', {
                            ...preferences.notificationSettings,
                            email: checked
                          })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <Switch
                        id="sms-notifications"
                        checked={preferences.notificationSettings.sms}
                        onCheckedChange={(checked) => 
                          setPreference('notificationSettings', {
                            ...preferences.notificationSettings,
                            sms: checked
                          })
                        }
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          {/* Accessibility Tab */}
          <TabsContent value="accessibility" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="motion" className="border-b">
                <AccordionTrigger className="py-4">Motion & Animation</AccordionTrigger>
                <AccordionContent className="pb-4 pt-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reduced-motion">
                      <div>
                        <span className="font-medium">Reduced Motion</span>
                        <p className="text-sm text-muted-foreground">
                          Minimize non-essential animations
                        </p>
                      </div>
                    </Label>
                    <Switch
                      id="reduced-motion"
                      checked={preferences.display.accessibility.reducedMotion}
                      onCheckedChange={(checked) => 
                        setAccessibilityPreference('reducedMotion', checked)
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="visual" className="border-b">
                <AccordionTrigger className="py-4">Visual Enhancements</AccordionTrigger>
                <AccordionContent className="pb-4 pt-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="high-contrast">
                      <div>
                        <span className="font-medium">High Contrast</span>
                        <p className="text-sm text-muted-foreground">
                          Improve text readability and color distinction
                        </p>
                      </div>
                    </Label>
                    <Switch
                      id="high-contrast"
                      checked={preferences.display.accessibility.highContrast}
                      onCheckedChange={(checked) => 
                        setAccessibilityPreference('highContrast', checked)
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="large-text">
                      <div>
                        <span className="font-medium">Larger Text</span>
                        <p className="text-sm text-muted-foreground">
                          Increase text size throughout the application
                        </p>
                      </div>
                    </Label>
                    <Switch
                      id="large-text"
                      checked={preferences.display.accessibility.largeText}
                      onCheckedChange={(checked) => 
                        setAccessibilityPreference('largeText', checked)
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="screen-reader" className="border-b">
                <AccordionTrigger className="py-4">Screen Reader Support</AccordionTrigger>
                <AccordionContent className="pb-4 pt-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="screen-reader-optimized">
                      <div>
                        <span className="font-medium">Screen Reader Optimized</span>
                        <p className="text-sm text-muted-foreground">
                          Enhance compatibility with screen readers
                        </p>
                      </div>
                    </Label>
                    <Switch
                      id="screen-reader-optimized"
                      checked={preferences.display.accessibility.screenReaderOptimized}
                      onCheckedChange={(checked) => 
                        setAccessibilityPreference('screenReaderOptimized', checked)
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          {/* Localization Tab */}
          <TabsContent value="localization" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="language" className="border-b">
                <AccordionTrigger className="py-4">Language & Region</AccordionTrigger>
                <AccordionContent className="pb-4 pt-1">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={preferences.display.language}
                        onValueChange={(value) => 
                          setDisplayPreference('language', value as any)
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="date-time" className="border-b">
                <AccordionTrigger className="py-4">Date & Time Format</AccordionTrigger>
                <AccordionContent className="pb-4 pt-1">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="date-format">Date Format</Label>
                      <Select
                        value={preferences.display.dateFormat}
                        onValueChange={(value) => 
                          setDisplayPreference('dateFormat', value as any)
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="time-format">Time Format</Label>
                      <Select
                        value={preferences.display.timeFormat}
                        onValueChange={(value) => 
                          setDisplayPreference('timeFormat', value as any)
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                          <SelectItem value="24h">24 Hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <div className="text-sm text-muted-foreground">
          {isSyncing ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner size="sm" /> Syncing...
            </span>
          ) : (
            <span>Last synced: {formatLastSynced()}</span>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => {
            resetPreferences()
            toast({
              title: "Preferences Reset",
              description: "Your preferences have been reset to default values.",
            })
          }}
        >
          Reset to Defaults
        </Button>
      </CardFooter>
    </Card>
  )
}

export default PreferencesPanel
