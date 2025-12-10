// Mock modality session data for testing the regeneration metrics system
import { Types } from 'mongoose';

export const mockModalitySessions = {
  validSessions: [
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      modalityId: 'mod001',
      modalityName: 'Spooky Scalar',
      date: '2025-03-01',
      startTime: '08:00',
      duration: 30, // in minutes
      intensity: 'medium',
      programs: ['Detox', 'Parasites'],
      notes: 'Felt energized afterward',
      completed: true
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      modalityId: 'mod001',
      modalityName: 'Spooky Scalar',
      date: '2025-03-02',
      startTime: '08:15',
      duration: 30,
      intensity: 'medium',
      programs: ['Detox', 'Parasites'],
      notes: '',
      completed: true
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      modalityId: 'mod001',
      modalityName: 'Spooky Scalar',
      date: '2025-03-03',
      startTime: '08:00',
      duration: 15, // shortened session
      intensity: 'medium',
      programs: ['Detox'],
      notes: 'Had to cut short due to meeting',
      completed: false
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      modalityId: 'mod002',
      modalityName: 'MWO',
      date: '2025-03-01',
      startTime: '19:00',
      duration: 30,
      intensity: 'high',
      programs: ['Rejuvenation'],
      notes: 'Nice evening session',
      completed: true
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      modalityId: 'mod002',
      modalityName: 'MWO',
      date: '2025-03-02',
      startTime: '19:15',
      duration: 30,
      intensity: 'high',
      programs: ['Rejuvenation'],
      notes: '',
      completed: true
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      modalityId: 'mod003',
      modalityName: 'PEMF',
      date: '2025-03-01',
      startTime: '14:00',
      duration: 20,
      intensity: 'low',
      programs: ['Relaxation'],
      notes: 'Afternoon session',
      completed: true
    }
  ],
  
  streakSessions: [
    // 14 consecutive days of Spooky Scalar sessions
    ...Array(14).fill(0).map((_, i) => {
      const day = i + 1;
      const date = new Date(2025, 2, day); // March 2025
      const dateStr = date.toISOString().split('T')[0];
      
      return {
        _id: new Types.ObjectId().toString(),
        userId: 'user456',
        modalityId: 'mod001',
        modalityName: 'Spooky Scalar',
        date: dateStr,
        startTime: '08:00',
        duration: 30,
        intensity: 'medium',
        programs: ['Detox', 'Parasites'],
        notes: `Day ${day} of streak`,
        completed: true
      };
    })
  ],
  
  sessionsWithSkippedDays: [
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user789',
      modalityId: 'mod001',
      modalityName: 'Spooky Scalar',
      date: '2025-03-01',
      startTime: '08:00',
      duration: 30,
      intensity: 'medium',
      programs: ['Detox'],
      notes: '',
      completed: true
    },
    // Skipped March 2nd
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user789',
      modalityId: 'mod001',
      modalityName: 'Spooky Scalar',
      date: '2025-03-03',
      startTime: '08:00',
      duration: 30,
      intensity: 'medium',
      programs: ['Detox'],
      notes: '',
      completed: true
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user789',
      modalityId: 'mod001',
      modalityName: 'Spooky Scalar',
      date: '2025-03-04',
      startTime: '08:00',
      duration: 30,
      intensity: 'medium',
      programs: ['Detox'],
      notes: '',
      completed: true
    },
    // Skipped March 5th and 6th
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user789',
      modalityId: 'mod001',
      modalityName: 'Spooky Scalar',
      date: '2025-03-07',
      startTime: '08:00',
      duration: 30,
      intensity: 'medium',
      programs: ['Detox'],
      notes: '',
      completed: true
    }
  ],
  
  aggregatedData: {
    sessionsByModality: [
      { modalityName: 'Spooky Scalar', count: 3, totalMinutes: 75, completionRate: 0.67 },
      { modalityName: 'MWO', count: 2, totalMinutes: 60, completionRate: 1.0 },
      { modalityName: 'PEMF', count: 1, totalMinutes: 20, completionRate: 1.0 }
    ],
    sessionsByProgram: [
      { program: 'Detox', count: 4, totalMinutes: 95 },
      { program: 'Parasites', count: 2, totalMinutes: 60 },
      { program: 'Rejuvenation', count: 2, totalMinutes: 60 },
      { program: 'Relaxation', count: 1, totalMinutes: 20 }
    ],
    sessionsByTimeOfDay: [
      { timeOfDay: 'morning', count: 3, totalMinutes: 75 },
      { timeOfDay: 'afternoon', count: 1, totalMinutes: 20 },
      { timeOfDay: 'evening', count: 2, totalMinutes: 60 }
    ],
    totalSessions: 6,
    totalMinutes: 155,
    overallCompletionRate: 0.83
  },
  
  weeklySessionTrend: [
    { week: '2025-02-16', sessionCount: 4, totalMinutes: 105 },
    { week: '2025-02-23', sessionCount: 5, totalMinutes: 140 },
    { week: '2025-03-02', sessionCount: 6, totalMinutes: 155 },
    { week: '2025-03-09', sessionCount: 7, totalMinutes: 190 },
    { week: '2025-03-16', sessionCount: 7, totalMinutes: 200 }
  ]
};
