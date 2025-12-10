'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Accordion } from '@/components/ui/accordion'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AlertTriangle, ChevronRight, Cog, Eye, PaintBucket, Bell, BarChart3, Globe, Database, FileText } from 'lucide-react'

// Import all preference setting components
import ThemeSettings from '@/components/preferences/ThemeSettings'
import NotificationSettings from '@/components/preferences/NotificationSettings'
import DisplayCustomization from '@/components/preferences/DisplayCustomization'
import DataVisualizationSettings from '@/components/preferences/DataVisualizationSettings'
import RegionalSettings from '@/components/preferences/RegionalSettings'
import DataHandlingSettings from '@/components/preferences/DataHandlingSettings'
import BehavioralSettings from '@/components/preferences/BehavioralSettings'
import AccessibilitySettings from '@/components/preferences/AccessibilitySettings'
import PreferenceExportImport from '@/components/preferences/PreferenceExportImport'

export default function PreferencesPage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('theme')
  const [recentChanges, setRecentChanges] = useState<Array<{ section: string, setting: string, timestamp: Date }>>([])

  // Add change to recent changes list
  const trackChange = (section: string, setting: string) => {
    setRecentChanges(prev => {
      const newChanges = [{ section, setting, timestamp: new Date() }, ...prev]
      return newChanges.slice(0, 10) // Keep only the 10 most recent changes
    })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6 max-w-screen-xl mx-auto">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Preferences Settings</h1>
          <p className="text-muted-foreground">
            Customize your bioelectric regeneration experience with personalized settings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar for navigation on larger screens */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="overflow-hidden">
              <div className="p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Cog className="w-5 h-5 mr-2" /> 
                  Settings Categories
                </h3>
                <nav className="space-y-1">
                  <NavItem 
                    icon={<PaintBucket className="w-5 h-5 text-blue-500" />} 
                    label="Theme System" 
                    active={activeTab === 'theme'} 
                    onClick={() => setActiveTab('theme')}
                  />
                  <NavItem 
                    icon={<Bell className="w-5 h-5 text-amber-500" />} 
                    label="Notifications" 
                    active={activeTab === 'notifications'} 
                    onClick={() => setActiveTab('notifications')}
                  />
                  <NavItem 
                    icon={<Eye className="w-5 h-5 text-violet-500" />} 
                    label="Display & UI" 
                    active={activeTab === 'display'} 
                    onClick={() => setActiveTab('display')}
                  />
                  <NavItem 
                    icon={<BarChart3 className="w-5 h-5 text-emerald-500" />} 
                    label="Data Visualization" 
                    active={activeTab === 'data-viz'} 
                    onClick={() => setActiveTab('data-viz')}
                  />
                  <NavItem 
                    icon={<Globe className="w-5 h-5 text-cyan-500" />} 
                    label="Regional Settings" 
                    active={activeTab === 'regional'} 
                    onClick={() => setActiveTab('regional')}
                  />
                  <NavItem 
                    icon={<Database className="w-5 h-5 text-red-500" />} 
                    label="Data Handling" 
                    active={activeTab === 'data-handling'} 
                    onClick={() => setActiveTab('data-handling')}
                  />
                  <NavItem 
                    icon={<FileText className="w-5 h-5 text-gray-500" />} 
                    label="Behavior & Input" 
                    active={activeTab === 'behavior'} 
                    onClick={() => setActiveTab('behavior')}
                  />
                </nav>
              </div>
            </Card>

            {/* Recent Changes Card */}
            {recentChanges.length > 0 && (
              <Card>
                <div className="p-6">
                  <h3 className="font-semibold mb-4">Recent Changes</h3>
                  <ul className="space-y-2 text-sm">
                    {recentChanges.map((change, i) => (
                      <li key={i} className="flex justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                        <span>
                          <span className="font-medium">{change.section}:</span> {change.setting}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(change.timestamp)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}
          </div>

          {/* Main content area */}
          <div className="lg:col-span-9 space-y-6">
            {/* Mobile Tabs */}
            <div className="lg:hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-2 md:grid-cols-4">
                  <TabsTrigger value="theme">Theme</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="display">Display</TabsTrigger>
                  <TabsTrigger value="data-viz">Charts</TabsTrigger>
                  <TabsTrigger value="regional">Region</TabsTrigger>
                  <TabsTrigger value="data-handling">Data</TabsTrigger>
                  <TabsTrigger value="behavior">Behavior</TabsTrigger>
                  <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Tab Content */}
            <div className={activeTab === 'theme' ? 'block' : 'hidden'}>
              <ThemeSettings onSettingChange={(setting) => trackChange('Theme', setting)} />
            </div>
            
            <div className={activeTab === 'notifications' ? 'block' : 'hidden'}>
              <NotificationSettings userId={session.user.id || ''} />
            </div>
            
            <div className={activeTab === 'display' ? 'block' : 'hidden'}>
              <DisplayCustomization onSettingChange={(setting) => trackChange('Display', setting)} />
            </div>
            
            <div className={activeTab === 'data-viz' ? 'block' : 'hidden'}>
              <DataVisualizationSettings onSettingChange={(setting) => trackChange('Data Visualization', setting)} />
            </div>
            
            <div className={activeTab === 'regional' ? 'block' : 'hidden'}>
              <RegionalSettings onSettingChange={(setting) => trackChange('Regional', setting)} />
            </div>
            
            <div className={activeTab === 'data-handling' ? 'block' : 'hidden'}>
              <DataHandlingSettings onSettingChange={(setting) => trackChange('Data Handling', setting)} />
            </div>
            
            <div className={activeTab === 'behavior' ? 'block' : 'hidden'}>
              <BehavioralSettings onSettingChange={(setting) => trackChange('Behavior', setting)} />
            </div>
            
            <div className={activeTab === 'accessibility' ? 'block' : 'hidden'}>
              <AccessibilitySettings onSettingChange={(setting) => trackChange('Accessibility', setting)} />
            </div>

            {/* Import/Export Section */}
            <PreferenceExportImport onSettingChange={(setting) => trackChange('Export/Import', setting)} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Helper component for navigation items
function NavItem({ icon, label, active, onClick }: { 
  icon: React.ReactNode, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full p-3 rounded-md transition duration-200 ${
        active 
          ? 'bg-primary/10 text-primary font-medium' 
          : 'hover:bg-gray-100 hover:dark:bg-gray-800'
      }`}
    >
      <div className="flex items-center">
        {icon}
        <span className="ml-3">{label}</span>
      </div>
      {active && <ChevronRight className="w-4 h-4" />}
    </button>
  )
}

// Helper function to format timestamps as "X minutes/hours ago"
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)

  if (diffMin < 1) {
    return 'just now'
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
  } else {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${month}/${day} at ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  }
}
