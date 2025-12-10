'use client'

import { useState, useEffect, useRef, useId } from 'react'
import { useSession } from 'next-auth/react'
import { SunIcon, PencilIcon, XIcon } from '@heroicons/react/outline'

interface Phase {
  _id: string
  phaseNumber: number
  name: string
  affirmation: string
}

// Max length for affirmations
const MAX_AFFIRMATION_LENGTH = 150

export default function DailyAffirmation() {
  const { data: session } = useSession()
  const [affirmation, setAffirmation] = useState('')
  const [phaseName, setPhaseName] = useState('')
  const [phaseId, setPhaseId] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedAffirmation, setEditedAffirmation] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  const headingId = useId()
  const modalId = useId()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initialRenderTimeRef = useRef(performance.now())

  // Track affirmation view
  useEffect(() => {
    if (affirmation && !isLoading && typeof window.trackEvent === 'function') {
      window.trackEvent('affirmation_view', {
        phase: session?.user?.currentPhaseNumber,
        affirmation
      })
    }
  }, [affirmation, isLoading, session?.user?.currentPhaseNumber])

  useEffect(() => {
    const fetchCurrentPhase = async () => {
      if (session?.user?.id) {
        setIsLoading(true)
        try {
          const res = await fetch('/api/phases')
          const phases = await res.json()
          const currentPhase = phases.find(
            (p: Phase) => p.phaseNumber === session.user.currentPhaseNumber
          )
          
          if (currentPhase) {
            setAffirmation(currentPhase.affirmation)
            setPhaseName(currentPhase.name)
            setPhaseId(currentPhase._id)
            
            // Also check localStorage for a custom affirmation
            const storedAffirmation = localStorage.getItem(`affirmation-${currentPhase._id}`)
            if (storedAffirmation) {
              setAffirmation(storedAffirmation)
            }
          }
        } catch (error) {
          console.error('Failed to fetch phase:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchCurrentPhase()
  }, [session])

  // Open the edit modal
  const handleEditClick = () => {
    setEditedAffirmation(affirmation)
    setIsEditing(true)
    // Focus the textarea after the modal opens
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }, 50)
  }

  // Close the edit modal without saving
  const handleCancel = () => {
    setIsEditing(false)
  }

  // Save the edited affirmation
  const handleSave = async () => {
    // Don't save if it's empty
    if (!editedAffirmation.trim()) {
      setIsEditing(false)
      return
    }

    // Truncate if over max length
    const truncatedAffirmation = editedAffirmation.slice(0, MAX_AFFIRMATION_LENGTH)
    
    try {
      // Save to API
      const response = await fetch(`/api/phases/${phaseId}/affirmation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affirmation: truncatedAffirmation }),
      })
      
      if (response.ok) {
        // Update state
        setAffirmation(truncatedAffirmation)
        
        // Save to localStorage as well for persistence
        localStorage.setItem(`affirmation-${phaseId}`, truncatedAffirmation)
        
        // Track edit event
        if (typeof window.trackEvent === 'function') {
          window.trackEvent('affirmation_edit', {
            phase: session?.user?.currentPhaseNumber,
            affirmation: truncatedAffirmation
          })
        }
      }
    } catch (error) {
      console.error('Failed to update affirmation:', error)
    } finally {
      setIsEditing(false)
    }
  }

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditing) {
        handleCancel()
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isEditing])

  // Format the affirmation for display
  const formatAffirmation = (text: string) => {
    if (!text) return 'Affirmation not available'
    if (text.length > MAX_AFFIRMATION_LENGTH) {
      return text.slice(0, MAX_AFFIRMATION_LENGTH) + '…'
    }
    return text
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-4 md:p-6 text-white animate-pulse">
        <div className="h-24" />
      </div>
    )
  }

  return (
    <>
      <div 
        role="region"
        aria-labelledby={headingId}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-4 md:p-6 text-white transition-opacity duration-300 ease-in-out"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <SunIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
            <h2 id={headingId} className="text-lg sm:text-xl font-semibold">Daily Affirmation</h2>
          </div>
          <button
            type="button"
            onClick={handleEditClick}
            aria-label="Edit affirmation"
            className="text-white/80 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded-md p-1"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm opacity-90">Phase: {phaseName}</p>
          <div aria-live="polite">
            <p className="text-base sm:text-lg font-medium italic">
              "{formatAffirmation(affirmation)}"
            </p>
          </div>
          <p className="text-sm opacity-75 mt-4">
            Take a moment to reflect on this affirmation as you progress through your bioelectric regeneration journey.
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div
          role="dialog"
          id={modalId}
          aria-modal="true"
          aria-labelledby={`${modalId}-title`}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 id={`${modalId}-title`} className="text-lg font-medium text-gray-900">
                Edit Your Daily Affirmation
              </h3>
              <button
                type="button"
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Close dialog"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <label htmlFor="affirmation-textarea" className="block text-sm font-medium text-gray-700 mb-2">
                Your affirmation:
              </label>
              <textarea
                id="affirmation-textarea"
                ref={textareaRef}
                value={editedAffirmation}
                onChange={(e) => setEditedAffirmation(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                maxLength={MAX_AFFIRMATION_LENGTH}
              />
              <p className="text-xs text-gray-500 mt-1">
                {MAX_AFFIRMATION_LENGTH - editedAffirmation.length} characters remaining
              </p>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Add window.trackEvent type declaration
declare global {
  interface Window {
    trackEvent?: (eventName: string, data: any) => void;
  }
}
