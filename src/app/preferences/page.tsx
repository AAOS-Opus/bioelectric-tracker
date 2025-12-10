'use client'

import React from 'react'
import PreferencesPanel from '@/components/user/PreferencesPanel'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function PreferencesPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
          <p className="text-muted-foreground mt-2">
            Customize your regeneration experience
          </p>
        </div>
        
        <PreferencesPanel />
      </div>
    </DashboardLayout>
  )
}
