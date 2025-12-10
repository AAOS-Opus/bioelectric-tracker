'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ModalitySession } from '../WeeklySchedule';
import { getDayName, formatTime } from './utils';
import { motion } from 'framer-motion';
import './schedule.css';

interface MobileScheduleViewProps {
  sessions: ModalitySession[];
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  timeIncrement: number;
  onSessionClick: (sessionId: string) => void;
  onAddSession: () => void;
}

export default function MobileScheduleView({
  sessions,
  selectedDay,
  setSelectedDay,
  timeIncrement,
  onSessionClick,
  onAddSession
}: MobileScheduleViewProps) {
  const dayName = getDayName(selectedDay);
  const sessionsForDay = sessions.filter(session => session.day === selectedDay);
  
  // Group sessions by time for better organization
  const groupedSessions: Record<string, ModalitySession[]> = {};
  
  sessionsForDay.forEach(session => {
    const timeKey = formatTime(session.startTime);
    if (!groupedSessions[timeKey]) {
      groupedSessions[timeKey] = [];
    }
    groupedSessions[timeKey].push(session);
  });
  
  // Sort times for display
  const sortedTimes = Object.keys(groupedSessions).sort((a, b) => {
    const [aHours, aMinutes] = a.split(':').map(Number);
    const [bHours, bMinutes] = b.split(':').map(Number);
    
    if (aHours !== bHours) return aHours - bHours;
    return aMinutes - bMinutes;
  });

  const navigateDay = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedDay(selectedDay === 0 ? 6 : selectedDay - 1);
    } else {
      setSelectedDay(selectedDay === 6 ? 0 : selectedDay + 1);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Day navigation */}
      <div className="flex justify-between items-center mb-4 px-1">
        <button
          onClick={() => navigateDay('prev')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        
        <h3 className="text-lg font-medium text-gray-900">{dayName}</h3>
        
        <button
          onClick={() => navigateDay('next')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Next day"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      
      {/* Day selector tabs */}
      <div className="flex space-x-1 overflow-x-auto scrollbar-hide pb-2 mb-4" role="tablist" aria-label="Days of the week">
        {[...Array(7)].map((_, dayIndex) => {
          const isSelected = selectedDay === dayIndex;
          const dayName = getDayName(dayIndex);
          
          // Create day tabs with proper aria attributes
          return (
            <button
              key={dayIndex}
              onClick={() => setSelectedDay(dayIndex)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-none ${
                isSelected
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-controls={`day-${dayIndex}-panel`}
              aria-label={`${dayName} day tab`}
              role="tab"
              id={`day-${dayIndex}-tab`}
              {...(isSelected ? {'aria-selected': 'true'} : {'aria-selected': 'false'})}
            >
              {dayName.substring(0, 3)}
            </button>
          );
        })}
      </div>
      
      {/* Sessions list for selected day */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4">
        {sortedTimes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-sm text-gray-500 mb-4">No sessions scheduled for {dayName}</p>
            <button
              onClick={onAddSession}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              aria-label="Add session"
            >
              <Plus className="h-4 w-4 mr-1.5 inline-block" />
              Add Session
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTimes.map(time => (
              <div key={time} className="relative">
                <div className="text-sm font-medium text-gray-500 sticky top-0 bg-white py-1 z-10 border-b">
                  {time}
                </div>
                <ul className="mt-1 space-y-2">
                  {groupedSessions[time].map(session => (
                    <li key={session.id}>
                      <button
                        onClick={() => onSessionClick(session.id)}
                        className={`session-block bg-${session.modalityType.toLowerCase().replace(' ', '-')} ${
                          session.completed ? 'opacity-60' : 'opacity-100'
                        }`}
                        aria-label={`${session.modalityType} session for ${formatTime(session.startTime)} duration ${session.duration} minutes`}
                      >
                        <div className="flex justify-between items-start text-white">
                          <div>
                            <h4 className="font-medium">
                              {session.title || session.modalityType}
                            </h4>
                            <p className="text-sm opacity-90">
                              {formatTime(session.startTime)} - {formatTime(session.startTime + session.duration)} ({session.duration} min)
                            </p>
                            {session.notes && (
                              <p className="text-xs mt-1 opacity-90 line-clamp-2">
                                {session.notes}
                              </p>
                            )}
                          </div>
                          
                          {session.completed && (
                            <span className="bg-white bg-opacity-20 text-white text-xs px-2 py-0.5 rounded-full">
                              Completed
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Floating add button */}
      <button
        onClick={onAddSession}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        aria-label="Add new session"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
