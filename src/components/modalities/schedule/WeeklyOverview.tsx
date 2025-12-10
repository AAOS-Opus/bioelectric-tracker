'use client';

import { useState } from 'react';
import { ModalitySession } from '../WeeklySchedule';
import { getDayName, getShortDayName, getDayDensity, getSessionsPerDay, formatTime } from './utils';
import { motion } from 'framer-motion';
import './schedule.css';

interface WeeklyOverviewProps {
  sessions: ModalitySession[];
  onSessionClick: (sessionId: string) => void;
  onDayClick: (day: number) => void;
}

export default function WeeklyOverview({
  sessions,
  onSessionClick,
  onDayClick
}: WeeklyOverviewProps) {
  // Count sessions per day
  const sessionsPerDay = getSessionsPerDay(sessions);
  
  // Count sessions per modality type
  const sessionsByType: Record<string, number> = {};
  sessions.forEach(session => {
    sessionsByType[session.modalityType] = (sessionsByType[session.modalityType] || 0) + 1;
  });
  
  // Group sessions by modality for the visualization
  const modalityTypes = Array.from(new Set(sessions.map(s => s.modalityType)));
  
  // Calculate total minutes spent per modality
  const minutesPerModality: Record<string, number> = {};
  sessions.forEach(session => {
    minutesPerModality[session.modalityType] = (minutesPerModality[session.modalityType] || 0) + session.duration;
  });
  
  // Calculate adherence percentage if any sessions are marked completed
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.completed).length;
  const adherencePercentage = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800">Total Sessions</h3>
          <p className="mt-2 text-3xl font-bold text-blue-900">{totalSessions}</p>
          <p className="text-sm text-blue-700">
            {Object.keys(sessionsPerDay).length} days scheduled
          </p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800">Adherence Rate</h3>
          <p className="mt-2 text-3xl font-bold text-green-900">{adherencePercentage}%</p>
          <p className="text-sm text-green-700">
            {completedSessions} of {totalSessions} completed
          </p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-purple-800">Total Time</h3>
          <p className="mt-2 text-3xl font-bold text-purple-900">
            {Object.values(minutesPerModality).reduce((total, mins) => total + mins, 0)} min
          </p>
          <p className="text-sm text-purple-700">
            Across {modalityTypes.length} modality types
          </p>
        </div>
      </div>
      
      {/* Weekly heatmap */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Weekly Distribution</h3>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, dayIndex) => {
            const count = sessionsPerDay[dayIndex] || 0;
            const density = getDayDensity(count);
            
            return (
              <button
                key={dayIndex}
                className={`text-center p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 day-${density} cursor-pointer`}
                onClick={() => onDayClick(dayIndex)}
                aria-label={`${getDayName(dayIndex)} with ${count} sessions`}
              >
                <div className="font-medium">{getShortDayName(dayIndex)}</div>
                <div className="text-lg font-bold mt-1">{count}</div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Modality breakdown */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Modality Breakdown</h3>
        <div className="space-y-3">
          {modalityTypes.map(type => {
            const modalitySessions = sessions.filter(s => s.modalityType === type);
            const minutes = minutesPerModality[type] || 0;
            const percentage = totalSessions > 0 
              ? Math.round((modalitySessions.length / totalSessions) * 100) 
              : 0;
              
            return (
              <div key={type} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className={`modality-indicator color-${type.toLowerCase().replace(' ', '-')}`}
                    ></div>
                    <h4 className="font-medium">{type}</h4>
                  </div>
                  <div className="text-sm text-gray-500">
                    {modalitySessions.length} sessions ({percentage}%)
                  </div>
                </div>
                
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full color-${type.toLowerCase().replace(' ', '-')} w-${Math.round(percentage / 5) * 5}`}
                  ></div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  Total time: {minutes} minutes
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Recent sessions */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Sessions</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No sessions scheduled yet</p>
          ) : (
            sessions
              .slice()
              .sort((a, b) => {
                // Sort by day first
                if (a.day !== b.day) return a.day - b.day;
                // Then by start time
                return a.startTime - b.startTime;
              })
              .slice(0, 5) // Show only first 5 upcoming sessions
              .map(session => (
                <motion.div
                  key={session.id}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => onSessionClick(session.id)}
                >
                  <div 
                    className={`modality-indicator-sm color-${session.modalityType.toLowerCase().replace(' ', '-')}`}
                  ></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{session.title || session.modalityType}</div>
                    <div className="text-xs text-gray-500">
                      {getDayName(session.day)}, {formatTime(session.startTime)} ({session.duration} min)
                    </div>
                  </div>
                  {session.completed && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                      Completed
                    </span>
                  )}
                </motion.div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
