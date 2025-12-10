'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ChartBarIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline'
import BiomarkerChart from './BiomarkerChart'
import Skeleton from '../ui/Skeleton'

interface ProgressNote {
  _id: string
  date: string
  weekNumber: number
  content: string
  biomarkers: {
    [key: string]: number
  }
  phaseId: string
}

interface Phase {
  _id: string
  phaseNumber: number
  name: string
  startDate: string
  endDate?: string
}

const BIOMARKER_FIELDS = [
  { key: 'energyLevel', label: 'Energy Level (1-10)', type: 'number', min: 1, max: 10 },
  { key: 'sleepQuality', label: 'Sleep Quality (1-10)', type: 'number', min: 1, max: 10 },
  { key: 'inflammation', label: 'Inflammation Level (1-10)', type: 'number', min: 1, max: 10 },
  { key: 'digestiveHealth', label: 'Digestive Health (1-10)', type: 'number', min: 1, max: 10 },
  { key: 'mentalClarity', label: 'Mental Clarity (1-10)', type: 'number', min: 1, max: 10 }
]

export default function ProgressJournal() {
  const { data: session } = useSession()
  const [notes, setNotes] = useState<ProgressNote[]>([])
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedBiomarker, setSelectedBiomarker] = useState(BIOMARKER_FIELDS[0].key)
  const [formData, setFormData] = useState<{
    content: string
    biomarkers: { [key: string]: string | number }
  }>({
    content: '',
    biomarkers: BIOMARKER_FIELDS.reduce((acc, field) => ({
      ...acc,
      [field.key]: ''
    }), {} as { [key: string]: string | number })
  })

  useEffect(() => {
    const fetchNotesAndPhase = async () => {
      if (session?.user?.id) {
        try {
          setLoading(true)
          // Fetch current phase
          const phaseRes = await fetch('/api/phases')
          const phases = await phaseRes.json()
          const current = phases.find((p: Phase) => 
            p.phaseNumber === session.user.currentPhaseNumber
          )
          setCurrentPhase(current)

          // Fetch progress notes
          const notesRes = await fetch('/api/progress-notes')
          const notesData = await notesRes.json()
          setNotes(notesData)
        } catch (error) {
          console.error('Failed to fetch progress data:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchNotesAndPhase()
  }, [session])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="flex items-center mb-6">
          <Skeleton className="h-6 w-6 mr-2" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPhase) return

    try {
      const response = await fetch('/api/progress-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phaseId: currentPhase._id,
          content: formData.content,
          biomarkers: formData.biomarkers,
          date: new Date().toISOString(),
          weekNumber: Math.ceil(
            (new Date().getTime() - new Date(currentPhase.startDate).getTime()) / 
            (7 * 24 * 60 * 60 * 1000)
          )
        })
      })

      if (response.ok) {
        const newNote = await response.json()
        setNotes(prev => [newNote, ...prev])
        setShowForm(false)
        setFormData({
          content: '',
          biomarkers: BIOMARKER_FIELDS.reduce((acc, field) => ({
            ...acc,
            [field.key]: ''
          }), {} as { [key: string]: string | number })
        })
      }
    } catch (error) {
      console.error('Failed to save progress note:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ChartBarIcon className="h-6 w-6 text-indigo-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Progress Journal</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          aria-label="Add new progress entry"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add Entry
        </button>
      </div>

      {/* Biomarker Chart */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Biomarker Trends</h3>
          <select
            value={selectedBiomarker}
            onChange={(e) => setSelectedBiomarker(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            aria-label="Select biomarker to display"
            id="biomarker-select"
          >
            {BIOMARKER_FIELDS.map((field) => (
              <option key={field.key} value={field.key}>
                {field.label}
              </option>
            ))}
          </select>
        </div>
        {notes.length > 0 ? (
          <BiomarkerChart
            data={notes}
            biomarkerKey={selectedBiomarker}
            label={BIOMARKER_FIELDS.find(f => f.key === selectedBiomarker)?.label || ''}
          />
        ) : (
          <p className="text-gray-500 text-center py-8">
            No biomarker data available yet. Add your first progress entry to start tracking.
          </p>
        )}
      </div>

      {/* Entry Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-4">New Progress Entry</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Observations & Notes
                </label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    content: e.target.value 
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={4}
                  required
                  aria-label="Progress notes and observations"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BIOMARKER_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label
                      htmlFor={field.key}
                      className="block text-sm font-medium text-gray-700"
                    >
                      {field.label}
                    </label>
                    <input
                      id={field.key}
                      type={field.type}
                      min={field.min}
                      max={field.max}
                      value={formData.biomarkers[field.key]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        biomarkers: {
                          ...prev.biomarkers,
                          [field.key]: e.target.value
                        }
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                      aria-label={field.label}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Notes List */}
      <div className="space-y-6">
        {notes.length === 0 ? (
          <p className="text-gray-500">No progress notes yet</p>
        ) : (
          notes.map((note) => (
            <div
              key={note._id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Week {note.weekNumber}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {new Date(note.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">{note.content}</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {BIOMARKER_FIELDS.map((field) => (
                  <div key={field.key} className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-500">{field.label}</p>
                    <p className="text-sm font-medium">
                      {note.biomarkers[field.key]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
