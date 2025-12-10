'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { SparklesIcon, ClockIcon, PlusIcon } from '@heroicons/react/24/outline'

interface Modality {
  _id: string
  name: string
  description: string
  recommendedFrequency: string
}

interface ModalitySession {
  _id: string
  modalityId: string
  date: string
  duration: number
  isCompleted: boolean
  notes?: string
}

export default function ModalityScheduler() {
  const { data: session } = useSession()
  const [modalities, setModalities] = useState<Modality[]>([])
  const [sessions, setSessions] = useState<ModalitySession[]>([])
  const [selectedModality, setSelectedModality] = useState<string>('')
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: 30,
    notes: ''
  })

  useEffect(() => {
    const fetchModalitiesAndSessions = async () => {
      if (session?.user?.id) {
        try {
          // Fetch modalities
          const modalitiesRes = await fetch('/api/modalities')
          const modalitiesData = await modalitiesRes.json()
          setModalities(modalitiesData)

          // Fetch today's and future sessions
          const today = new Date().toISOString().split('T')[0]
          const sessionsRes = await fetch(`/api/modality-sessions?from=${today}`)
          const sessionsData = await sessionsRes.json()
          setSessions(sessionsData)
        } catch (error) {
          console.error('Failed to fetch modality data:', error)
        }
      }
    }

    fetchModalitiesAndSessions()
  }, [session])

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedModality) return

    try {
      const datetime = new Date(`${formData.date}T${formData.time}`)
      const response = await fetch('/api/modality-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modalityId: selectedModality,
          date: datetime.toISOString(),
          duration: formData.duration,
          notes: formData.notes
        })
      })

      if (response.ok) {
        const newSession = await response.json()
        setSessions(prev => [...prev, newSession])
        setShowScheduleForm(false)
        setFormData({
          date: new Date().toISOString().split('T')[0],
          time: '09:00',
          duration: 30,
          notes: ''
        })
      }
    } catch (error) {
      console.error('Failed to schedule session:', error)
    }
  }

  const toggleSessionCompletion = async (sessionId: string) => {
    try {
      const session = sessions.find(s => s._id === sessionId)
      if (!session) return

      const response = await fetch(`/api/modality-sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isCompleted: !session.isCompleted
        })
      })

      if (response.ok) {
        setSessions(prev =>
          prev.map(s =>
            s._id === sessionId ? { ...s, isCompleted: !s.isCompleted } : s
          )
        )
      }
    } catch (error) {
      console.error('Failed to update session:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <SparklesIcon className="h-6 w-6 text-indigo-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Modality Scheduler</h2>
        </div>
        <button
          onClick={() => setShowScheduleForm(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Schedule Session
        </button>
      </div>

      {/* Schedule Form */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Schedule New Session</h3>
            <form onSubmit={handleScheduleSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Modality
                </label>
                <select
                  aria-label="Select modality type"
                  value={selectedModality}
                  onChange={(e) => setSelectedModality(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a modality</option>
                  {modalities.map((modality) => (
                    <option key={modality._id} value={modality._id}>
                      {modality.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="session-date" className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    id="session-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                    aria-label="Session date"
                    placeholder="Select session date"
                  />
                </div>
                <div>
                  <label htmlFor="session-time" className="block text-sm font-medium text-gray-700">
                    Time
                  </label>
                  <input
                    id="session-time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                    aria-label="Session time"
                    placeholder="Select session time"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  Duration (minutes)
                </label>
                <input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  min="1"
                  required
                />
              </div>

              <div>
                <label htmlFor="session-notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="session-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                  aria-label="Session notes"
                  placeholder="Enter any notes about this session"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowScheduleForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Upcoming Sessions</h3>
        {sessions.length === 0 ? (
          <p className="text-gray-500">No upcoming sessions scheduled</p>
        ) : (
          sessions.map((session) => {
            const modality = modalities.find(m => m._id === session.modalityId)
            return (
              <div
                key={session._id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  session.isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {modality?.name}
                  </h4>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {new Date(session.date).toLocaleString()} ({session.duration} min)
                  </div>
                  {session.notes && (
                    <p className="text-sm text-gray-500 mt-1">{session.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleSessionCompletion(session._id)}
                  className={`ml-4 px-3 py-1 rounded-md text-sm font-medium ${
                    session.isCompleted
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  {session.isCompleted ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
