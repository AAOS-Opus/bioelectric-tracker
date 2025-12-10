'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon,
  XCircleIcon,
  RefreshIcon
} from '@heroicons/react/outline'

// Import from the expected path for tests
// This is the path that's being mocked in the test file
import { usePhaseProgress } from '../../contexts/PhaseProgressContext'

/**
 * Interface for a task in the Today's Tasks component
 */
interface Task {
  _id: string
  phaseNumber: number
  title: string
  description: string
  estimatedTimeMinutes: number
  timeBlock: 'morning' | 'afternoon' | 'evening'
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  completedAt?: string
  requiresMedia?: boolean
  mediaUrl?: string
  tutorialUrl?: string
  externalLink?: string
  createdAt: string
  updatedAt: string
}

/**
 * Modal state type for task tutorials
 */
interface ModalState {
  isOpen: boolean
  taskId: string | null
  title: string
  url: string | null
}

// Define time block and priority orders to avoid TypeScript errors
type TimeBlock = 'morning' | 'afternoon' | 'evening';
type Priority = 'high' | 'medium' | 'low';

const TIME_BLOCK_ORDER: Record<TimeBlock, number> = { 
  morning: 0, 
  afternoon: 1, 
  evening: 2 
};

const PRIORITY_ORDER: Record<Priority, number> = { 
  high: 0, 
  medium: 1, 
  low: 2 
};

/**
 * Today's Tasks component displays a checklist of daily protocol items 
 * specific to the user's current regeneration phase
 */
export default function TodaysTasks() {
  const { data: session } = useSession()
  const { updateProgress } = usePhaseProgress()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryingTaskId, setRetryingTaskId] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    taskId: null,
    title: '',
    url: null
  })
  
  // Maintain a queue of offline updates for background sync
  const offlineQueue = useRef<Array<{taskId: string, completed: boolean}>>([])
  
  // Track if we're offline
  const [isOffline, setIsOffline] = useState(false)
  
  /**
   * Track online/offline status
   */
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    
    // Set initial state
    setIsOffline(!navigator.onLine)
    
    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  /**
   * Fetch tasks from the API and filter by the user's current phase
   */
  const fetchTasks = useCallback(async () => {
    if (!session?.user?.id) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Get the user's current phase number
      const phaseNumber = session.user.currentPhaseNumber
      
      // Fetch tasks for the current phase
      const res = await fetch(`/api/tasks?phaseNumber=${phaseNumber}`)
      
      if (!res.ok) {
        throw new Error('Failed to fetch tasks')
      }
      
      const data = await res.json()
      
      // Sort tasks: first by time block, then by priority
      const sortedTasks = [...data].sort((a, b) => {
        // First sort by time block
        const timeBlockDiff = TIME_BLOCK_ORDER[a.timeBlock as TimeBlock] - TIME_BLOCK_ORDER[b.timeBlock as TimeBlock]
        
        if (timeBlockDiff !== 0) return timeBlockDiff
        
        // Then sort by priority (high → low)
        return PRIORITY_ORDER[a.priority as Priority] - PRIORITY_ORDER[b.priority as Priority]
      })
      
      setTasks(sortedTasks)
      
      // Track task view event for analytics
      if (typeof window !== 'undefined' && 'trackEvent' in window) {
        (window as any).trackEvent('tasks_view', {
          taskCount: sortedTasks.length,
          phaseNumber
        })
      }
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError('Failed to load tasks. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [session])
  
  /**
   * Fetch tasks on component mount and session change
   */
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])
  
  /**
   * Set up refresh event listener (for cross-device sync)
   */
  useEffect(() => {
    const handleRefresh = () => {
      fetchTasks()
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('refresh-product-data', handleRefresh)
      window.addEventListener('midnight-reset', handleRefresh)
      
      return () => {
        window.removeEventListener('refresh-product-data', handleRefresh)
        window.removeEventListener('midnight-reset', handleRefresh)
      }
    }
  }, [fetchTasks])
  
  /**
   * Process the offline queue when coming back online
   */
  useEffect(() => {
    if (!isOffline && offlineQueue.current.length > 0) {
      // Process the offline queue
      const processQueue = async () => {
        const queue = [...offlineQueue.current]
        offlineQueue.current = []
        
        for (const item of queue) {
          try {
            await updateTaskStatus(item.taskId, item.completed, false)
          } catch (err) {
            console.error('Failed to process offline queue item:', err)
            // Add back to queue if it fails
            offlineQueue.current.push(item)
          }
        }
      }
      
      processQueue()
    }
  }, [isOffline])
  
  /**
   * Toggle task completion status with optimistic UI updates
   */
  const toggleTaskCompletion = async (taskId: string) => {
    const taskIndex = tasks.findIndex(t => t._id === taskId)
    if (taskIndex === -1) return
    
    const task = tasks[taskIndex]
    const newCompletedStatus = !task.completed
    
    // Update task optimistically
    updateTaskOptimistically(taskId, newCompletedStatus)
    
    try {
      // Persist the change
      await updateTaskStatus(taskId, newCompletedStatus)
    } catch (err) {
      // Revert optimistic update on error
      updateTaskOptimistically(taskId, !newCompletedStatus)
      
      setError('Failed to update task. Please try again.')
    }
  }
  
  /**
   * Update task status in the UI (optimistic update)
   */
  const updateTaskOptimistically = (taskId: string, completed: boolean) => {
    setTasks(prev => prev.map(task => {
      if (task._id === taskId) {
        return {
          ...task,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined
        }
      }
      return task
    }))
    
    // Update phase progress context
    if (tasks.length > 0) {
      const completedCount = tasks.filter(t => 
        t._id === taskId ? completed : t.completed
      ).length
      
      updateProgress(completedCount / tasks.length)
    }
  }
  
  /**
   * Update task status in the API
   */
  const updateTaskStatus = async (taskId: string, completed: boolean, handleOffline = true) => {
    // If offline, queue the update for later
    if (isOffline && handleOffline) {
      offlineQueue.current.push({ taskId, completed })
      return
    }
    
    const endpoint = completed 
      ? `/api/tasks/${taskId}/complete` 
      : `/api/tasks/${taskId}/uncomplete`
    
    setRetryingTaskId(taskId)
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString()
        })
      })
      
      if (!res.ok) {
        throw new Error('Failed to update task status')
      }
      
      const task = tasks.find(t => t._id === taskId)
      
      // Track analytics event
      if (typeof window !== 'undefined' && 'trackEvent' in window && task) {
        (window as any).trackEvent(completed ? 'task_completed' : 'task_uncompleted', {
          taskId,
          taskTitle: task.title,
          phaseNumber: task.phaseNumber,
          timestamp: new Date().toISOString()
        })
      }
      
    } catch (err) {
      console.error('Error updating task status:', err)
      throw err
    } finally {
      setRetryingTaskId(null)
    }
  }
  
  /**
   * Retry a failed task update
   */
  const retryTaskUpdate = async (taskId: string, completed: boolean) => {
    setError(null)
    
    try {
      // Update optimistically again
      updateTaskOptimistically(taskId, completed)
      
      // Try to update in the API
      await updateTaskStatus(taskId, completed)
    } catch (err) {
      setError('Unable to update status. Please try again.')
    }
  }
  
  /**
   * Open the tutorial modal for a task
   */
  const openTutorial = (task: Task) => {
    if (task.tutorialUrl) {
      setModal({
        isOpen: true,
        taskId: task._id,
        title: task.title,
        url: task.tutorialUrl
      })
    }
  }
  
  /**
   * Close the tutorial modal
   */
  const closeModal = () => {
    setModal({
      isOpen: false,
      taskId: null,
      title: '',
      url: null
    })
  }
  
  /**
   * Group tasks by time block
   */
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.timeBlock]) {
      acc[task.timeBlock] = []
    }
    acc[task.timeBlock].push(task)
    return acc
  }, {} as Record<string, Task[]>)
  
  /**
   * Get responsive class based on screen size
   */
  const getResponsiveClass = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return 'mobile-view'
      if (window.innerWidth < 1024) return 'tablet-view'
      return 'desktop-view'
    }
    return ''
  }
  
  // Loading state
  if (loading) {
    return (
      <div data-testid="todays-tasks-panel" className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div 
      data-testid="todays-tasks-panel" 
      className={`bg-white rounded-lg shadow p-6 ${getResponsiveClass()}`}
      aria-live="polite"
    >
      <h2 id="tasks-heading" className="text-xl font-semibold text-gray-900 mb-4">Today's Tasks</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <XCircleIcon className="h-5 w-5 mr-2" />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)} 
            className="ml-auto text-red-700 hover:text-red-800"
            aria-label="Dismiss error"
          >
            <XCircleIcon className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {tasks.length === 0 ? (
        <p className="text-gray-500">No tasks for today</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([timeBlock, blockTasks]) => (
            <section key={timeBlock} aria-labelledby={`${timeBlock}-heading`} className="space-y-2">
              <h3 id={`${timeBlock}-heading`} className="text-md font-medium text-gray-700 capitalize">
                {timeBlock}
              </h3>
              
              <ul className="space-y-2">
                {blockTasks.map(task => {
                  const isOverdue = task.timeBlock === 'morning' && new Date().getHours() >= 12 && !task.completed
                  
                  return (
                    <li 
                      key={task._id} 
                      data-testid="task-item"
                      className={`
                        p-3 rounded-lg border
                        ${task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}
                        ${isOverdue ? 'border-yellow-300 overdue' : ''}
                        ${task.priority === 'high' ? 'border-l-4 border-l-blue-500' : ''}
                      `}
                    >
                      <div className="flex items-start sm:items-center">
                        <div className="flex-shrink-0 mt-1 sm:mt-0">
                          {retryingTaskId === task._id ? (
                            <RefreshIcon className="h-5 w-5 text-gray-400 animate-spin" />
                          ) : task.completed ? (
                            <input
                              type="checkbox"
                              id={`task-${task._id}`}
                              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={true}
                              onChange={() => toggleTaskCompletion(task._id)}
                              aria-labelledby={`task-label-${task._id}`}
                              aria-checked="true"
                            />
                          ) : (
                            <input
                              type="checkbox"
                              id={`task-${task._id}`}
                              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={false}
                              onChange={() => toggleTaskCompletion(task._id)}
                              aria-labelledby={`task-label-${task._id}`}
                              aria-checked="false"
                            />
                          )}
                        </div>
                        
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <label 
                              id={`task-label-${task._id}`}
                              htmlFor={`task-${task._id}`}
                              className={`text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}
                            >
                              {task.title}
                              {task.priority === 'high' && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Priority
                                </span>
                              )}
                              {isOverdue && !task.completed && (
                                <span 
                                  data-testid="overdue-indicator"
                                  className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                                >
                                  Overdue
                                </span>
                              )}
                            </label>
                            
                            <div className="flex items-center space-x-2">
                              {task.requiresMedia && task.tutorialUrl && (
                                <button
                                  type="button"
                                  className="text-gray-400 hover:text-gray-500"
                                  onClick={() => openTutorial(task)}
                                  aria-label={`Open tutorial for ${task.title}`}
                                >
                                  <InformationCircleIcon className="h-5 w-5" />
                                </button>
                              )}
                              <div className="text-xs text-gray-500 flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {task.estimatedTimeMinutes} min
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                          
                          {task.completedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Completed at {new Date(task.completedAt).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
      
      {/* Tutorial Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tutorial: {modal.title}</h3>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Close tutorial"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            
            {modal.url && (
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  data-testid="tutorial-video"
                  src={modal.url}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-md"
                  title={`Tutorial for ${modal.title}`}
                ></iframe>
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
