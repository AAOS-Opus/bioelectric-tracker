'use client'

import { SessionProvider } from 'next-auth/react'
import React from 'react'
import { PhaseProgressProvider } from '@/contexts/PhaseProgressContext'

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PhaseProgressProvider>
        {children}
      </PhaseProgressProvider>
    </SessionProvider>
  )
}
