'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { CalendarIcon, CheckIcon, ExclamationTriangleIcon as ExclamationIcon } from '@heroicons/react/24/outline'

interface Phase {
  _id: string
  phaseNumber: number
  name: string
  description: string
  startDate: string
  endDate?: string
  affirmation: string
  isCompleted: boolean
}

export default function PhaseSettings() {
  const { data: session } = useSession()
  const [phases, setPhases] = useState<Phase[]>([])
  const [editingPhase, setEditingPhase] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPhases = async () => {
      if (session?.user?.id) {
        try {
          const res = await fetch('/api/phases')
          const data = await res.json()
          // Sort phases by number
          const sortedPhases = data.sort((a: Phase, b: Phase) => a.phaseNumber - b.phaseNumber)
          setPhases(sortedPhases)
          setLoading(false)
        } catch (error) {
          console.error('Failed to fetch phases:', error)
          setError('Failed to load phases')
          setLoading(false)
        }
      }
    }

    fetchPhases()
  }, [session])

  const handleDateChange = async (phaseId: string, field: 'startDate' | 'endDate', value: string) => {
    try {
      const response = await fetch(`/api/phases/${phaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })

      if (response.ok) {
        const updatedPhase = await response.json()
        setPhases(prev =>
          prev.map(phase =>
            phase._id === phaseId ? { ...phase, [field]: value } : phase
          )
        )
        // If this is a start date change, update the previous phase's end date
        if (field === 'startDate') {
          const currentPhase = phases.find(p => p._id === phaseId)
          if (currentPhase && currentPhase.phaseNumber > 1) {
            const previousPhase = phases.find(
              p => p.phaseNumber === currentPhase.phaseNumber - 1
            )
            if (previousPhase) {
              // Set previous phase end date to one day before this phase's start
              const prevEndDate = new Date(value)
              prevEndDate.setDate(prevEndDate.getDate() - 1)
              handleDateChange(previousPhase._id, 'endDate', prevEndDate.toISOString().split('T')[0])
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to update phase:', error)
      setError('Failed to update phase dates')
    }
  }

  const togglePhaseCompletion = async (phaseId: string) => {
    const phase = phases.find(p => p._id === phaseId)
    if (!phase) return

    try {
      const response = await fetch(`/api/phases/${phaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isCompleted: !phase.isCompleted
        })
      })

      if (response.ok) {
        setPhases(prev =>
          prev.map(p =>
            p._id === phaseId ? { ...p, isCompleted: !p.isCompleted } : p
          )
        )
      }
    } catch (error) {
      console.error('Failed to update phase completion:', error)
      setError('Failed to update phase completion status')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <CalendarIcon className="h-6 w-6 text-indigo-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Phase Settings</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <ExclamationIcon className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {phases.map((phase) => (
          <div
            key={phase._id}
            className={`border rounded-lg p-4 ${
              phase.isCompleted
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Phase {phase.phaseNumber}: {phase.name}
              </h3>
              <button
                onClick={() => togglePhaseCompletion(phase._id)}
                className={`flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                  phase.isCompleted
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {phase.isCompleted && <CheckIcon className="h-4 w-4 mr-1" />}
                {phase.isCompleted ? 'Completed' : 'Mark Complete'}
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">{phase.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor={`startDate-${phase._id}`} className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  id={`startDate-${phase._id}`}
                  type="date"
                  value={phase.startDate?.split('T')[0] || ''}
                  onChange={(e) => handleDateChange(phase._id, 'startDate', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  min={
                    phases.find(p => p.phaseNumber === phase.phaseNumber - 1)?.endDate?.split('T')[0]
                  }
                  max={phase.endDate?.split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor={`endDate-${phase._id}`} className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  id={`endDate-${phase._id}`}
                  type="date"
                  value={phase.endDate?.split('T')[0] || ''}
                  onChange={(e) => handleDateChange(phase._id, 'endDate', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  min={phase.startDate?.split('T')[0]}
                  max={
                    phases.find(p => p.phaseNumber === phase.phaseNumber + 1)?.startDate?.split('T')[0]
                  }
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Daily Affirmation
              </label>
              <p className="mt-1 text-sm text-gray-600 italic">
                "{phase.affirmation}"
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
