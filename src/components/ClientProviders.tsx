'use client'

import { ReactNode } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import providers with SSR disabled to prevent localStorage/window access during SSR
const PreferencesProvider = dynamic(
  () => import('@/contexts/PreferencesContext').then(mod => mod.PreferencesProvider),
  { ssr: false }
)

const PhaseProgressProvider = dynamic(
  () => import('@/contexts/PhaseProgressContext').then(mod => mod.PhaseProgressProvider),
  { ssr: false }
)

interface ClientProvidersProps {
  children: ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <PreferencesProvider>
      <PhaseProgressProvider>
        {children}
      </PhaseProgressProvider>
    </PreferencesProvider>
  )
}
