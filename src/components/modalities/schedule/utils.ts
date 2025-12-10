/**
 * Utility functions for the Weekly Schedule component
 */

// Convert minutes since midnight to formatted time string (HH:MM)
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Convert formatted time string (HH:MM) to minutes since midnight
export function parseTime(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// Get time object from minutes
export function getTimeFromMinutes(minutes: number): { hours: number; minutes: number } {
  return {
    hours: Math.floor(minutes / 60),
    minutes: minutes % 60
  };
}

// Get day name from day index (0-6 for Monday-Sunday)
export function getDayName(dayIndex: number): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayIndex];
}

// Get short day name from day index (0-6 for Monday-Sunday)
export function getShortDayName(dayIndex: number): string {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days[dayIndex];
}

// Check if two time slots overlap
export function checkTimeOverlap(
  startTime1: number,
  duration1: number,
  startTime2: number,
  duration2: number
): boolean {
  const endTime1 = startTime1 + duration1;
  const endTime2 = startTime2 + duration2;
  
  return (startTime1 < endTime2 && endTime1 > startTime2);
}

// Generate time increments for a day
export function generateTimeSlots(timeIncrement: 15 | 30 | 60): { time: string; minutes: number }[] {
  const slots = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += timeIncrement) {
    const time = formatTime(minutes);
    slots.push({ time, minutes });
  }
  return slots;
}

// Calculate position and height for a session in the grid
export function calculateSessionPosition(
  startTime: number,
  duration: number,
  timeIncrement: number
): { top: number; height: number } {
  const rowHeight = 12; // In pixels, corresponding to the height of each time slot
  
  // Calculate position
  const top = (startTime / timeIncrement) * rowHeight;
  const height = (duration / timeIncrement) * rowHeight;
  
  return { top, height };
}

// Create unique ID
export function createUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Format duration as a human-readable string (e.g., "1h 30m")
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

// Get count of sessions per day
export function getSessionsPerDay(sessions: any[]): Record<number, number> {
  return sessions.reduce((acc: Record<number, number>, session) => {
    acc[session.day] = (acc[session.day] || 0) + 1;
    return acc;
  }, {});
}

// Check if a device is touch-enabled
export function isTouchDevice(): boolean {
  return (
    typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );
}

// Determine if a day is over/under scheduled
export function getDayDensity(count: number): 'low' | 'medium' | 'high' {
  if (count <= 1) return 'low';
  if (count <= 3) return 'medium';
  return 'high';
}

// Helper for a11y
export function getA11yTimeLabel(day: string, startTime: string, endTime: string): string {
  return `${day} from ${startTime} to ${endTime}`;
}

// Generate recurring sessions based on recurrence pattern
export function generateRecurringSessions(
  baseSession: any,
  recurrencePattern: 'daily' | 'weekly' | 'biweekly' | 'monthly',
  occurrences: number
): any[] {
  const sessions = [];
  for (let i = 0; i < occurrences; i++) {
    const newSession = { ...baseSession, id: createUniqueId() };
    
    switch (recurrencePattern) {
      case 'daily':
        newSession.day = (baseSession.day + i) % 7;
        break;
      case 'weekly':
        // Same day each week, but this would extend beyond our weekly view
        // For a real implementation we would need to store actual dates
        break;
      case 'biweekly':
        if (i % 2 === 0) {
          newSession.day = baseSession.day;
        }
        break;
      case 'monthly':
        // Would require date handling beyond our current scope
        break;
    }
    
    sessions.push(newSession);
  }
  return sessions;
}

// Determine if two schedules have conflicts
export function hasScheduleConflicts(
  sessions: any[],
  day: number
): boolean {
  // Get sessions for the specific day
  const daysSessions = sessions.filter(s => s.day === day);
  
  // Check for overlaps between any two sessions
  for (let i = 0; i < daysSessions.length; i++) {
    for (let j = i + 1; j < daysSessions.length; j++) {
      if (checkTimeOverlap(
        daysSessions[i].startTime,
        daysSessions[i].duration,
        daysSessions[j].startTime,
        daysSessions[j].duration
      )) {
        return true;
      }
    }
  }
  
  return false;
}

// Find time slots available for a new session
export function findAvailableTimeSlots(
  sessions: any[],
  day: number,
  duration: number,
  minStartTime: number = 8 * 60, // 8 AM
  maxEndTime: number = 22 * 60 // 10 PM
): { startTime: number; endTime: number }[] {
  // Get sessions for the specific day
  const daysSessions = sessions
    .filter(s => s.day === day)
    .sort((a, b) => a.startTime - b.startTime);
  
  const availableSlots = [];
  let currentStartTime = minStartTime;
  
  // Go through each existing session and find gaps
  for (const session of daysSessions) {
    if (session.startTime - currentStartTime >= duration) {
      availableSlots.push({
        startTime: currentStartTime,
        endTime: session.startTime
      });
    }
    currentStartTime = Math.max(currentStartTime, session.startTime + session.duration);
  }
  
  // Add final slot after the last session
  if (maxEndTime - currentStartTime >= duration) {
    availableSlots.push({
      startTime: currentStartTime,
      endTime: maxEndTime
    });
  }
  
  return availableSlots;
}

// Optimize schedule to balance sessions across days
export function optimizeSchedule(
  sessions: any[],
  preferences: {
    spacing: boolean;
    timePreference: 'morning' | 'afternoon' | 'evening' | 'distributed';
    balanceDays: boolean;
    prioritizeAdherence: boolean;
  }
): any[] {
  // Group sessions by modality type
  const sessionsByType: Record<string, any[]> = {};
  sessions.forEach(session => {
    if (!sessionsByType[session.modalityType]) {
      sessionsByType[session.modalityType] = [];
    }
    sessionsByType[session.modalityType].push(session);
  });
  
  // Define time ranges for preferences
  const timeRanges = {
    morning: { start: 6 * 60, end: 12 * 60 }, // 6 AM - 12 PM
    afternoon: { start: 12 * 60, end: 18 * 60 }, // 12 PM - 6 PM
    evening: { start: 18 * 60, end: 22 * 60 }, // 6 PM - 10 PM
  };
  
  // Clone sessions to avoid mutating original array
  const optimizedSessions = [...sessions];
  
  if (preferences.balanceDays) {
    // Balance sessions across days
    const sessionsPerDay = getSessionsPerDay(sessions);
    const avgSessionsPerDay = sessions.length / 7;
    
    // Find overloaded and underloaded days
    const overloadedDays = Object.entries(sessionsPerDay)
      .filter(([_, count]) => count > avgSessionsPerDay + 1)
      .map(([day]) => parseInt(day));
      
    const underloadedDays = Array.from(Array(7).keys())
      .filter(day => !sessionsPerDay[day] || sessionsPerDay[day] < avgSessionsPerDay - 1);
    
    // Move sessions from overloaded to underloaded days
    if (overloadedDays.length > 0 && underloadedDays.length > 0) {
      overloadedDays.forEach(day => {
        const daySessions = optimizedSessions.filter(s => s.day === day);
        
        // Sort by least important first (assuming no weight/priority field)
        daySessions.sort((a, b) => {
          // If we prioritize adherence, keep sessions that were previously completed
          if (preferences.prioritizeAdherence) {
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;
          }
          return 0;
        });
        
        // Move sessions to underloaded days
        for (let i = 0; i < Math.min(2, daySessions.length); i++) {
          const sessionToMove = daySessions[i];
          const targetDay = underloadedDays[i % underloadedDays.length];
          
          // Find this session in our optimized list and update it
          const sessionIndex = optimizedSessions.findIndex(s => s.id === sessionToMove.id);
          if (sessionIndex >= 0) {
            optimizedSessions[sessionIndex] = {
              ...optimizedSessions[sessionIndex],
              day: targetDay
            };
          }
        }
      });
    }
  }
  
  // Adjust time slots based on time preference
  if (preferences.timePreference !== 'distributed') {
    const preferredRange = timeRanges[preferences.timePreference];
    
    optimizedSessions.forEach((session, index) => {
      // If session is not already in preferred time range, try to move it
      if (
        session.startTime < preferredRange.start || 
        session.startTime > preferredRange.end
      ) {
        // Find available slot in preferred time range
        const availableSlots = findAvailableTimeSlots(
          optimizedSessions.filter(s => s.id !== session.id),
          session.day,
          session.duration,
          preferredRange.start,
          preferredRange.end
        );
        
        if (availableSlots.length > 0) {
          // Place in first available slot
          optimizedSessions[index] = {
            ...session,
            startTime: availableSlots[0].startTime
          };
        }
      }
    });
  }
  
  // If spacing is important, adjust session times to maximize gaps
  if (preferences.spacing) {
    // Group sessions by day
    const sessionsByDay: Record<number, any[]> = {};
    for (let day = 0; day < 7; day++) {
      sessionsByDay[day] = optimizedSessions
        .filter(s => s.day === day)
        .sort((a, b) => a.startTime - b.startTime);
    }
    
    // Adjust each day's sessions
    Object.entries(sessionsByDay).forEach(([day, daySessions]) => {
      if (daySessions.length >= 2) {
        // Calculate current average gap
        let totalGap = 0;
        for (let i = 1; i < daySessions.length; i++) {
          totalGap += daySessions[i].startTime - (daySessions[i-1].startTime + daySessions[i-1].duration);
        }
        const avgGap = totalGap / (daySessions.length - 1);
        
        // If average gap is small, try to redistribute
        if (avgGap < 60) { // Less than 1 hour average gap
          // Find earliest and latest possible times
          const earliestStart = 8 * 60; // 8 AM
          const latestEnd = 22 * 60; // 10 PM
          
          // Calculate total session time
          const totalDuration = daySessions.reduce((sum, session) => sum + session.duration, 0);
          
          // Calculate ideal gap
          const availableTime = latestEnd - earliestStart;
          const idealGap = (availableTime - totalDuration) / (daySessions.length - 1);
          
          // Redistribute sessions
          let currentTime = earliestStart;
          daySessions.forEach((session, i) => {
            // Find this session in optimized list
            const sessionIndex = optimizedSessions.findIndex(s => s.id === session.id);
            if (sessionIndex >= 0) {
              // Update start time
              optimizedSessions[sessionIndex].startTime = currentTime;
              
              // Move time pointer
              currentTime += session.duration;
              if (i < daySessions.length - 1) {
                currentTime += idealGap;
              }
            }
          });
        }
      }
    });
  }
  
  return optimizedSessions;
}

// Convert sessions to iCalendar format for export
export function generateICalString(sessions: any[]): string {
  // Basic iCal format
  let iCalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BioelectricRegenTracker//WeeklySchedule//EN'
  ];
  
  // Add an event for each session
  sessions.forEach(session => {
    // Create a date for this session - this is simplified as we don't store actual dates
    // A real implementation would use actual dates
    const today = new Date();
    const daysToAdd = (session.day - today.getDay() + 7) % 7;
    const eventDate = new Date(today);
    eventDate.setDate(today.getDate() + daysToAdd);
    
    // Set time
    const startHour = Math.floor(session.startTime / 60);
    const startMinute = session.startTime % 60;
    eventDate.setHours(startHour, startMinute, 0);
    
    // Calculate end time
    const endDate = new Date(eventDate);
    endDate.setMinutes(endDate.getMinutes() + session.duration);
    
    // Format dates for iCal
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    // Add event
    iCalContent = iCalContent.concat([
      'BEGIN:VEVENT',
      `UID:${session.id}@bioelectricregentracker`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(eventDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${session.title || session.modalityType} Session`,
      `DESCRIPTION:${session.notes || 'Bioelectric regeneration session'}`,
      'END:VEVENT'
    ]);
  });
  
  // Close calendar
  iCalContent.push('END:VCALENDAR');
  
  return iCalContent.join('\r\n');
}

// Generate a downloadable iCal file for a set of sessions
export function downloadCalendar(sessions: any[]): void {
  const iCalString = generateICalString(sessions);
  const blob = new Blob([iCalString], { type: 'text/calendar;charset=utf-8' });
  
  // Create download link
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'bioelectric-schedule.ics';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Get a color for a modality type (ensures consistency in colors)
export function getModalityColor(modalityType: string): string {
  // Simple hash function to derive color
  const colors = [
    'bg-blue-500',   // Blue
    'bg-green-500',  // Green
    'bg-purple-500', // Purple
    'bg-red-500',    // Red
    'bg-yellow-500', // Yellow
    'bg-indigo-500', // Indigo
    'bg-pink-500',   // Pink
    'bg-teal-500'    // Teal
  ];
  
  // Generate a hash from the modalityType string
  let hash = 0;
  for (let i = 0; i < modalityType.length; i++) {
    hash = ((hash << 5) - hash) + modalityType.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Map the hash to a color
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
}

// Generate a reminder time options array
export function getReminderOptions(): { value: number; label: string }[] {
  return [
    { value: 0, label: 'No reminder' },
    { value: 5, label: '5 minutes before' },
    { value: 15, label: '15 minutes before' },
    { value: 30, label: '30 minutes before' },
    { value: 60, label: '1 hour before' },
    { value: 120, label: '2 hours before' },
    { value: 1440, label: '1 day before' }
  ];
}

// Calculate adherence statistics for a set of sessions
export function calculateAdherenceStats(sessions: any[]): {
  totalSessions: number;
  completedSessions: number;
  adherenceRate: number;
  streakDays: number;
} {
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.completed).length;
  const adherenceRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
  
  // Simplified streak calculation (would need real dates for accurate calculation)
  // For demo purposes we'll just count consecutive completed sessions
  let streakDays = 0;
  let currentStreak = 0;
  
  // Group by day and check if all sessions for each day are completed
  const sessionsByDay: Record<number, any[]> = {};
  for (let day = 0; day < 7; day++) {
    sessionsByDay[day] = sessions.filter(s => s.day === day);
  }
  
  // Check consecutive days with all sessions completed
  for (let day = 0; day < 7; day++) {
    const daySessions = sessionsByDay[day];
    if (daySessions.length > 0 && daySessions.every(s => s.completed)) {
      currentStreak++;
    } else {
      // Reset streak on a day with incomplete sessions
      currentStreak = 0;
    }
    
    streakDays = Math.max(streakDays, currentStreak);
  }
  
  return { totalSessions, completedSessions, adherenceRate, streakDays };
}
