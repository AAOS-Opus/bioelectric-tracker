'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface Phase {
  _id: string
  phaseNumber: number
  name: string
  description: string
  startDate: string
  endDate: string
  affirmation: string
  completionPercentage: number
}

interface PhaseProgressContextType {
  currentPhase: Phase | null
  progress: number
  updateProgress: (newProgress: number) => void
  loading: boolean
  error: string | null
  refreshPhaseData: () => Promise<void>
}

const PhaseProgressContext = createContext<PhaseProgressContextType>({
  currentPhase: null,
  progress: 0,
  updateProgress: () => {},
  loading: true,
  error: null,
  refreshPhaseData: async () => {}
})

export const usePhaseProgress = () => useContext(PhaseProgressContext)

interface PhaseProgressProviderProps {
  children: ReactNode
}

export const PhaseProgressProvider = ({ children }: PhaseProgressProviderProps) => {
  const { data: session } = useSession()
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPhaseData = async () => {
    if (!session?.user?.id) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Get the user's current phase number
      const phaseNumber = session.user.currentPhaseNumber
      
      // Fetch the current phase
      const res = await fetch(`/api/phases/current`)
      
      if (!res.ok) {
        throw new Error('Failed to fetch phase data')
      }
      
      const phase = await res.json()
      setCurrentPhase(phase)
      setProgress(phase.completionPercentage || 0)
      
      // Track analytics event
      if (typeof window !== 'undefined' && window.trackEvent) {
        window.trackEvent('phase_progress_view', {
          phaseNumber,
          progress: phase.completionPercentage
        })
      }
    } catch (err) {
      console.error('Error fetching phase data:', err)
      setError('Failed to load phase information')
    } finally {
      setLoading(false)
    }
  }

  // Fetch phase data when session changes
  useEffect(() => {
    fetchPhaseData()
  }, [session])

  // Update progress locally and in the backend
  const updateProgress = async (newProgress: number) => {
    // Update locally first (optimistic update)
    setProgress(newProgress)
    
    if (!currentPhase) return
    
    try {
      // Update in the backend
      const res = await fetch(`/api/phases/${currentPhase._id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress })
      })
      
      if (!res.ok) {
        throw new Error('Failed to update phase progress')
      }
      
      // Track analytics event
      if (typeof window !== 'undefined' && window.trackEvent) {
        window.trackEvent('phase_progress_update', {
          phaseNumber: currentPhase.phaseNumber,
          progress: newProgress
        })
      }
    } catch (err) {
      console.error('Error updating phase progress:', err)
      // We could revert the optimistic update here if needed
    }
  }

  // Expose a function to manually refresh phase data
  const refreshPhaseData = async () => {
    await fetchPhaseData()
  }

  const value = {
    currentPhase,
    progress,
    updateProgress,
    loading,
    error,
    refreshPhaseData
  }

  return (
    <PhaseProgressContext.Provider value={value}>
      {children}
    </PhaseProgressContext.Provider>
  )
}
