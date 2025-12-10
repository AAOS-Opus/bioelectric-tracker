'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Calendar, Settings, RefreshCw, Calendar as CalendarIcon, X, Check } from 'lucide-react';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { cn } from '@/lib/utils';

// Import sub-components
import ScheduleHeader from '@/components/modalities/schedule/ScheduleHeader';
import AddSessionModal from '@/components/modalities/schedule/AddSessionModal';
import OptimizeScheduleModal from '@/components/modalities/schedule/OptimizeScheduleModal';
import SessionBlock from '@/components/modalities/schedule/SessionBlock';
import MobileScheduleView from '@/components/modalities/schedule/MobileScheduleView';
import WeeklyOverview from '@/components/modalities/schedule/WeeklyOverview';
import TemplateManager from '@/components/modalities/schedule/TemplateManager';
import useScheduleStore from '@/components/modalities/schedule/useScheduleStore';
import { getDayName, formatTime, getTimeFromMinutes } from '@/components/modalities/schedule/utils';

dayjs.extend(weekOfYear);

// Types
export type ModalityType = 'Spooky Scalar' | 'MWO' | 'Movement' | 'Mindfulness' | 'Custom';

export type ModalitySession = {
  id: string;
  modalityType: ModalityType;
  title: string;
  startTime: number; // Minutes from midnight
  duration: number; // In minutes
  day: number; // 0-6 (Monday-Sunday)
  recurring?: boolean | 'daily' | 'weekly';
  recurringDays?: number[]; // Days of week for recurring (0-6)
  color: string;
  notes?: string;
  completed?: boolean;
  userId?: string;
};

export type ScheduleTemplate = {
  id: string;
  name: string;
  description?: string;
  sessions: ModalitySession[];
  createdAt: Date;
};

export type TimeSlot = {
  time: string;
  minutes: number;
};

export type ViewMode = 'week' | 'day' | 'overview';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MODALITY_COLORS: Record<ModalityType, string> = {
  'Spooky Scalar': '#3b82f6', // Blue
  'MWO': '#10b981', // Green
  'Movement': '#f59e0b', // Yellow
  'Mindfulness': '#8b5cf6', // Purple
  'Custom': '#ef4444', // Red
};

export default function WeeklySchedule() {
  const {
    sessions,
    setSessions,
    addSession,
    updateSession,
    deleteSession,
    markSessionCompleted,
    templates,
    addTemplate,
    applyTemplate,
  } = useScheduleStore();

  // UI State
  const [timeIncrement, setTimeIncrement] = useState<15 | 30 | 60>(30);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDay, setSelectedDay] = useState<number>(dayjs().day() === 0 ? 6 : dayjs().day() - 1); // Convert Sunday (0) to 6
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [optimizationStatus, setOptimizationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const scheduleRef = useRef<HTMLDivElement>(null);

  // Generate time slots based on increment
  const timeSlots = useCallback(() => {
    const slots: TimeSlot[] = [];
    for (let minutes = 0; minutes < 24 * 60; minutes += timeIncrement) {
      const time = formatTime(minutes);
      slots.push({ time, minutes });
    }
    return slots;
  }, [timeIncrement]);

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 640 && viewMode === 'week') {
        setViewMode('day');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount

    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Handle drag and drop reordering
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const sessionToUpdate = sessions.find((s: ModalitySession) => s.id === draggableId);
    
    if (!sessionToUpdate) return;
    
    // Calculate new time based on destination
    const destDay = parseInt(destination.droppableId.split('-')[1], 10);
    const newStartTime = destination.index * timeIncrement;
    
    updateSession({
      ...sessionToUpdate,
      day: destDay,
      startTime: newStartTime,
    });
  };

  // Optimization function (simulated AI optimization)
  const optimizeSchedule = async () => {
    setOptimizationStatus('loading');
    
    // Simulate API call to optimization service
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
      
      // For now, create a simple optimization algorithm
      // This would be replaced with an actual AI service call
      const optimizedSessions = [...sessions];
      
      // Simple rules: Space out sessions throughout the week
      let day = 0;
      let timeCounter = 480; // Start at 8 AM
      
      optimizedSessions.forEach((session, index) => {
        // Distribute sessions evenly across days
        optimizedSessions[index] = {
          ...session,
          day: day,
          startTime: timeCounter
        };
        
        // Advance to next day
        day = (day + 1) % 7;
        
        // Add some variety to start times
        timeCounter = (timeCounter + 60) % (60 * 12) + 480; // Keep between 8 AM and 8 PM
      });
      
      setSessions(optimizedSessions);
      setOptimizationStatus('success');
      
      // Reset status after a delay
      setTimeout(() => {
        setOptimizationStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error optimizing schedule:', error);
      setOptimizationStatus('error');
      
      // Reset status after a delay
      setTimeout(() => {
        setOptimizationStatus('idle');
      }, 2000);
    }
  };

  // Session selection handler
  const handleSessionClick = (sessionId: string) => {
    if (isDragging) return;
    setSelectedSessionId(sessionId === selectedSessionId ? null : sessionId);
  };

  const addNewSession = (session: Omit<ModalitySession, 'id' | 'color'>) => {
    const color = MODALITY_COLORS[session.modalityType];
    addSession({
      ...session,
      id: crypto.randomUUID(),
      color
    });
    setIsAddModalOpen(false);
  };

  // Export to calendar
  const exportToCalendar = () => {
    // Create iCal format string
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Bioelectric Regeneration Tracker//WeeklySchedule//EN'
    ];
    
    // Add each session as an event
    sessions.forEach((session: ModalitySession) => {
      // Calculate date for this session (based on current week)
      const currentDate = dayjs();
      const sessionDate = currentDate.day(session.day + 1); // +1 to convert 0-based day to dayjs format
      
      const startDateTime = sessionDate.hour(Math.floor(session.startTime / 60)).minute(session.startTime % 60);
      const endDateTime = startDateTime.add(session.duration, 'minute');
      
      // Format dates for iCal
      const dtStart = startDateTime.format('YYYYMMDDTHHmmss');
      const dtEnd = endDateTime.format('YYYYMMDDTHHmmss');
      
      icalContent = [
        ...icalContent,
        'BEGIN:VEVENT',
        `UID:${session.id}@bioelectric-regeneration`,
        `DTSTAMP:${dayjs().format('YYYYMMDDTHHmmss')}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${session.modalityType}: ${session.title}`,
        'END:VEVENT'
      ];
    });
    
    icalContent.push('END:VCALENDAR');
    
    // Create and download the file
    const blob = new Blob([icalContent.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bioelectric-schedule-${dayjs().format('YYYY-MM-DD')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Determine which view to render
  const renderScheduleView = () => {
    if (windowWidth < 640) {
      return <MobileScheduleView 
        sessions={sessions}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        timeIncrement={timeIncrement}
        onSessionClick={handleSessionClick}
        onAddSession={() => setIsAddModalOpen(true)}
      />;
    }
    
    if (viewMode === 'overview') {
      return <WeeklyOverview 
        sessions={sessions}
        onSessionClick={handleSessionClick}
        onDayClick={setSelectedDay}
      />;
    }
    
    if (viewMode === 'day') {
      return (
        <div className="grid grid-cols-[80px_1fr] gap-px bg-gray-100 overflow-auto max-h-[calc(100vh-250px)]">
          {/* Time Column */}
          <div className="bg-gray-50 p-2 sticky left-0 z-10">
            <div className="h-12 flex items-center justify-center font-medium">Time</div>
            {timeSlots().map((slot) => (
              <div 
                key={slot.time}
                className="h-12 text-xs text-gray-500 flex items-center justify-end pr-2"
              >
                {slot.time}
              </div>
            ))}
          </div>

          {/* Day Column */}
          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <Droppable key={selectedDay} droppableId={`day-${selectedDay}`}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="bg-white relative min-h-full"
                >
                  <div className="h-12 bg-blue-50 flex items-center justify-center font-medium border-b">
                    {DAYS_OF_WEEK[selectedDay]}
                  </div>
                  
                  {timeSlots().map((slot, index) => (
                    <div
                      key={`${selectedDay}-${slot.time}`}
                      className="h-12 border-b border-gray-100 relative hover:bg-blue-50/30 transition-colors"
                      onClick={() => {
                        setIsAddModalOpen(true);
                        // Pre-set the time in the modal
                        // This would be handled by passing state to the modal
                      }}
                    />
                  ))}

                  <AnimatePresence>
                    {sessions
                      .filter((session: ModalitySession) => session.day === selectedDay)
                      .map((session, index) => (
                        <Draggable
                          key={session.id}
                          draggableId={session.id}
                          index={Math.floor(session.startTime / timeIncrement)}
                        >
                          {(provided, snapshot) => (
                            <SessionBlock
                              session={session}
                              provided={provided}
                              isDragging={snapshot.isDragging}
                              timeIncrement={timeIncrement}
                              isSelected={session.id === selectedSessionId}
                              onClick={() => handleSessionClick(session.id)}
                              onComplete={() => markSessionCompleted(session.id)}
                              onDelete={() => deleteSession(session.id)}
                            />
                          )}
                        </Draggable>
                      ))}
                  </AnimatePresence>
                  
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      );
    }
    
    // Week view (default)
    return (
      <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-px bg-gray-100 overflow-auto max-h-[calc(100vh-250px)]">
        {/* Time Column */}
        <div className="bg-gray-50 p-2 sticky left-0 z-10">
          <div className="h-12 flex items-center justify-center font-medium">Time</div>
          {timeSlots().map((slot) => (
            <div 
              key={slot.time}
              className="h-12 text-xs text-gray-500 flex items-center justify-end pr-2"
            >
              {slot.time}
            </div>
          ))}
        </div>

        {/* Days Columns */}
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {[...Array(7)].map((_, dayIndex) => (
            <Droppable key={dayIndex} droppableId={`day-${dayIndex}`}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="bg-white relative min-h-full"
                >
                  <div className="h-12 bg-blue-50 flex items-center justify-center font-medium border-b">
                    {DAYS_OF_WEEK[dayIndex]}
                  </div>
                  
                  {timeSlots().map((slot, index) => (
                    <div
                      key={`${dayIndex}-${slot.time}`}
                      className="h-12 border-b border-gray-100 relative hover:bg-blue-50/30 transition-colors"
                      onClick={() => {
                        setIsAddModalOpen(true);
                        // Pre-set the time in the modal
                        // This would be handled by passing state to the modal
                      }}
                    />
                  ))}

                  <AnimatePresence>
                    {sessions
                      .filter((session: ModalitySession) => session.day === dayIndex)
                      .map((session, index) => (
                        <Draggable
                          key={session.id}
                          draggableId={session.id}
                          index={Math.floor(session.startTime / timeIncrement)}
                        >
                          {(provided, snapshot) => (
                            <SessionBlock
                              session={session}
                              provided={provided}
                              isDragging={snapshot.isDragging}
                              timeIncrement={timeIncrement}
                              isSelected={session.id === selectedSessionId}
                              onClick={() => handleSessionClick(session.id)}
                              onComplete={() => markSessionCompleted(session.id)}
                              onDelete={() => deleteSession(session.id)}
                            />
                          )}
                        </Draggable>
                      ))}
                  </AnimatePresence>
                  
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>
    );
  };

  // Component to show if no sessions exist
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <Calendar className="w-16 h-16 text-gray-400" />
      <h3 className="text-lg font-medium text-gray-900">Create your first modality schedule</h3>
      <p className="text-gray-500 max-w-md">
        Schedule your sessions for the week to help stay consistent with your bioelectric regeneration protocol.
      </p>
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        aria-label="Add your first session"
      >
        <Plus className="w-4 h-4 mr-2 inline-block" />
        Add Your First Session
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg" ref={scheduleRef}>
      <ScheduleHeader 
        viewMode={viewMode}
        setViewMode={setViewMode}
        timeIncrement={timeIncrement}
        setTimeIncrement={setTimeIncrement}
        onAddSession={() => setIsAddModalOpen(true)}
        onOptimizeSchedule={() => setIsOptimizeModalOpen(true)}
        onManageTemplates={() => setIsTemplateModalOpen(true)}
        onExportCalendar={exportToCalendar}
        optimizationStatus={optimizationStatus}
      />
      
      <div className="p-4">
        {sessions.length === 0 ? (
          renderEmptyState()
        ) : (
          renderScheduleView()
        )}
      </div>
      
      {/* Modals */}
      <AddSessionModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSession={addNewSession}
        editSession={selectedSessionId ? sessions.find((s: ModalitySession) => s.id === selectedSessionId) : undefined}
        onUpdateSession={updateSession}
      />
      
      <OptimizeScheduleModal
        isOpen={isOptimizeModalOpen}
        onClose={() => setIsOptimizeModalOpen(false)}
        onOptimize={optimizeSchedule}
        sessions={sessions}
      />
      
      <TemplateManager
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        templates={templates}
        currentSessions={sessions}
        onSaveTemplate={addTemplate}
        onApplyTemplate={applyTemplate}
      />
    </div>
  );
}
