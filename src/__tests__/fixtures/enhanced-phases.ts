/**
 * Enhanced phase fixtures for testing advanced Phase Settings functionality
 * These fixtures include all the advanced features described in the requirements:
 * - Timeline precision
 * - Transition workflow automation
 * - Dynamic customization
 * - Affirmation management
 * - Goal tracking
 * - Notification controls
 * - Progress continuity
 * - Administrative controls
 */

export interface EnhancedPhase {
  _id: string;
  phaseNumber: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  affirmation: string;
  isCompleted: boolean;
  // Advanced features
  customizationSettings: {
    intensity: 'gentle' | 'standard' | 'intensive';
    priorities: Record<string, number>; // e.g., { detox: 0.8, energy: 0.5, immune: 0.3 }
    optionalElements: string[];
    sequence: string[];
  };
  goals: {
    id: string;
    title: string;
    description?: string;
    targetDays?: number;
    targetValue?: number;
    currentValue?: number;
    currentStreak?: number;
    unit?: string;
    milestones?: Array<{ value: number; achieved: boolean; date?: string }>;
  }[];
  notificationSettings: {
    channels: { email: boolean; push: boolean; sms: boolean };
    frequency: 'daily' | 'weekly' | 'important-only';
    quietHours: { start: string; end: string };
    customReminders?: Array<{ type: string; time: string; days: string[] }>;
  };
  history: {
    versionLog: Array<{
      date: string;
      user: string;
      changes: Record<string, { from: any; to: any }>;
      notes?: string;
    }>;
    previousAffirmations: Array<{ text: string; activeFrom: string; activeTo: string }>;
    previousGoals?: Array<{ id: string; title: string; achievedOn?: string; value?: number }>;
  };
  transitionRequirements?: {
    tasks: Array<{ id: string; description: string; isCompleted: boolean }>;
    biomarkers?: Array<{ id: string; name: string; targetRange: [number, number]; currentValue?: number }>;
    practitionerApproval?: boolean;
  };
  adminSettings?: {
    lockedBy?: string;
    lockedUntil?: string;
    practitionerNotes?: string;
    protocolOverrides?: Record<string, boolean>;
    auditLog: Array<{
      date: string;
      user: string;
      action: string;
      details?: string;
    }>;
  };
}

export const enhancedPhasesMock: EnhancedPhase[] = [
  {
    _id: 'phase1',
    phaseNumber: 1,
    name: 'Detoxification',
    description: 'First phase focusing on detoxification',
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: '2025-01-31T00:00:00.000Z',
    affirmation: 'My body is cleansing and healing itself every day',
    isCompleted: false,
    customizationSettings: {
      intensity: 'standard',
      priorities: { detox: 0.8, energy: 0.5, immune: 0.3 },
      optionalElements: ['liver support', 'lymphatic drainage'],
      sequence: ['morning protocol', 'midday protocol', 'evening protocol']
    },
    goals: [
      { 
        id: 'goal1', 
        title: 'Complete daily protocols', 
        description: 'Follow the complete protocol every day',
        targetDays: 28, 
        currentStreak: 5,
        milestones: [
          { value: 7, achieved: false },
          { value: 14, achieved: false },
          { value: 21, achieved: false },
          { value: 28, achieved: false }
        ]
      },
      { 
        id: 'goal2', 
        title: 'Reduce toxin markers', 
        description: 'Lower key toxicity biomarkers',
        targetValue: -30, 
        unit: '%', 
        currentValue: -5,
        milestones: [
          { value: -10, achieved: false },
          { value: -20, achieved: false },
          { value: -30, achieved: false }
        ]
      }
    ],
    notificationSettings: {
      channels: { email: true, push: true, sms: false },
      frequency: 'daily',
      quietHours: { start: '22:00', end: '07:00' },
      customReminders: [
        { type: 'protocol', time: '08:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        { type: 'journal', time: '20:00', days: ['Monday', 'Thursday'] }
      ]
    },
    history: {
      versionLog: [
        {
          date: '2024-12-15T14:30:00.000Z',
          user: 'system',
          changes: { 
            startDate: { from: null, to: '2025-01-01T00:00:00.000Z' },
            endDate: { from: null, to: '2025-01-31T00:00:00.000Z' }
          },
          notes: 'Initial phase setup'
        }
      ],
      previousAffirmations: []
    },
    transitionRequirements: {
      tasks: [
        { id: 'task1', description: 'Complete all daily protocols for at least 21 days', isCompleted: false },
        { id: 'task2', description: 'Record final detox biomarkers', isCompleted: false },
        { id: 'task3', description: 'Complete transition questionnaire', isCompleted: false }
      ],
      biomarkers: [
        { id: 'bm1', name: 'Liver enzymes', targetRange: [10, 30], currentValue: 45 },
        { id: 'bm2', name: 'Inflammatory markers', targetRange: [0, 2], currentValue: 3.5 }
      ],
      practitionerApproval: false
    },
    adminSettings: {
      lockedBy: undefined,
      lockedUntil: undefined,
      practitionerNotes: 'Standard protocol appropriate for patient profile',
      protocolOverrides: {},
      auditLog: [
        {
          date: '2024-12-15T14:30:00.000Z',
          user: 'system',
          action: 'Phase created',
          details: 'Generated during user onboarding'
        }
      ]
    }
  },
  {
    _id: 'phase2',
    phaseNumber: 2,
    name: 'Rebuilding',
    description: 'Second phase focusing on cellular repair',
    startDate: '2025-02-01T00:00:00.000Z',
    endDate: '2025-02-28T00:00:00.000Z',
    affirmation: 'My cells are regenerating with powerful energy',
    isCompleted: false,
    customizationSettings: {
      intensity: 'gentle',
      priorities: { detox: 0.3, energy: 0.8, immune: 0.5 },
      optionalElements: ['mitochondrial support', 'cellular hydration'],
      sequence: ['morning energetics', 'afternoon protocols', 'evening rest']
    },
    goals: [
      { 
        id: 'goal3', 
        title: 'Improve energy levels', 
        description: 'Increase daily energy and reduce fatigue',
        targetValue: 50, 
        unit: '%', 
        currentValue: 0,
        milestones: [
          { value: 15, achieved: false },
          { value: 30, achieved: false },
          { value: 50, achieved: false }
        ]
      },
      {
        id: 'goal4',
        title: 'Complete mitochondrial protocols',
        description: 'Complete the daily mitochondrial support protocol',
        targetDays: 25,
        currentStreak: 0,
        milestones: [
          { value: 7, achieved: false },
          { value: 14, achieved: false },
          { value: 21, achieved: false },
          { value: 25, achieved: false }
        ]
      }
    ],
    notificationSettings: {
      channels: { email: true, push: true, sms: false },
      frequency: 'daily',
      quietHours: { start: '22:00', end: '07:00' }
    },
    history: {
      versionLog: [
        {
          date: '2024-12-15T14:30:00.000Z',
          user: 'system',
          changes: { 
            startDate: { from: null, to: '2025-02-01T00:00:00.000Z' },
            endDate: { from: null, to: '2025-02-28T00:00:00.000Z' }
          },
          notes: 'Initial phase setup'
        }
      ],
      previousAffirmations: []
    },
    transitionRequirements: {
      tasks: [
        { id: 'task4', description: 'Complete all energy restoration protocols', isCompleted: false },
        { id: 'task5', description: 'Record energy biomarkers', isCompleted: false }
      ],
      biomarkers: [
        { id: 'bm3', name: 'ATP production', targetRange: [70, 100], currentValue: 55 },
        { id: 'bm4', name: 'Cellular hydration', targetRange: [80, 100], currentValue: 65 }
      ],
      practitionerApproval: false
    },
    adminSettings: {
      lockedBy: undefined,
      lockedUntil: undefined,
      practitionerNotes: 'Standard protocol appropriate for patient profile',
      protocolOverrides: {},
      auditLog: [
        {
          date: '2024-12-15T14:30:00.000Z',
          user: 'system',
          action: 'Phase created',
          details: 'Generated during user onboarding'
        }
      ]
    }
  },
  {
    _id: 'phase3',
    phaseNumber: 3,
    name: 'Revitalization',
    description: 'Third phase focusing on energy restoration',
    startDate: '2025-03-01T00:00:00.000Z',
    endDate: '2025-03-31T00:00:00.000Z',
    affirmation: 'My vitality increases with each passing day',
    isCompleted: false,
    customizationSettings: {
      intensity: 'intensive',
      priorities: { detox: 0.2, energy: 0.7, immune: 0.9 },
      optionalElements: ['nervous system support', 'adrenal regeneration'],
      sequence: ['morning protocols', 'noon scalar sessions', 'evening frequency therapy']
    },
    goals: [
      { 
        id: 'goal5', 
        title: 'Complete all modality sessions', 
        description: 'Finish all prescribed frequency and scalar sessions',
        targetDays: 30, 
        currentStreak: 0,
        milestones: [
          { value: 10, achieved: false },
          { value: 20, achieved: false },
          { value: 30, achieved: false }
        ]
      },
      {
        id: 'goal6',
        title: 'Improve immune biomarkers',
        description: 'Enhance immune system function measurements',
        targetValue: 40,
        unit: '%',
        currentValue: 0,
        milestones: [
          { value: 15, achieved: false },
          { value: 25, achieved: false },
          { value: 40, achieved: false }
        ]
      }
    ],
    notificationSettings: {
      channels: { email: true, push: true, sms: false },
      frequency: 'daily',
      quietHours: { start: '22:00', end: '07:00' }
    },
    history: {
      versionLog: [
        {
          date: '2024-12-15T14:30:00.000Z',
          user: 'system',
          changes: { 
            startDate: { from: null, to: '2025-03-01T00:00:00.000Z' },
            endDate: { from: null, to: '2025-03-31T00:00:00.000Z' }
          },
          notes: 'Initial phase setup'
        }
      ],
      previousAffirmations: []
    },
    transitionRequirements: {
      tasks: [
        { id: 'task6', description: 'Complete all immune support protocols', isCompleted: false },
        { id: 'task7', description: 'Record immune biomarkers', isCompleted: false }
      ],
      biomarkers: [
        { id: 'bm5', name: 'T-cell activity', targetRange: [80, 100], currentValue: 60 },
        { id: 'bm6', name: 'Inflammatory response', targetRange: [0, 3], currentValue: 5 }
      ],
      practitionerApproval: false
    },
    adminSettings: {
      lockedBy: undefined,
      lockedUntil: undefined,
      practitionerNotes: 'Standard protocol appropriate for patient profile',
      protocolOverrides: {},
      auditLog: [
        {
          date: '2024-12-15T14:30:00.000Z',
          user: 'system',
          action: 'Phase created',
          details: 'Generated during user onboarding'
        }
      ]
    }
  },
  {
    _id: 'phase4',
    phaseNumber: 4,
    name: 'Maintenance',
    description: 'Fourth phase focusing on long-term health maintenance',
    startDate: '2025-04-01T00:00:00.000Z',
    endDate: '2025-04-30T00:00:00.000Z',
    affirmation: 'I maintain optimal health with consistent practices',
    isCompleted: false,
    customizationSettings: {
      intensity: 'standard',
      priorities: { detox: 0.4, energy: 0.4, immune: 0.6 },
      optionalElements: ['periodic detox', 'maintenance protocols'],
      sequence: ['morning maintenance', 'weekly detox', 'monthly deep cleanse']
    },
    goals: [
      { 
        id: 'goal7', 
        title: 'Maintain health markers', 
        description: 'Keep all biomarkers within optimal ranges',
        targetValue: 0, 
        unit: '%', 
        currentValue: 0,
        milestones: [
          { value: 90, achieved: false } // 90% of markers in range
        ]
      },
      {
        id: 'goal8',
        title: 'Establish maintenance routine',
        description: 'Consistently follow maintenance protocols',
        targetDays: 28,
        currentStreak: 0,
        milestones: [
          { value: 14, achieved: false },
          { value: 28, achieved: false }
        ]
      }
    ],
    notificationSettings: {
      channels: { email: true, push: true, sms: false },
      frequency: 'weekly',
      quietHours: { start: '22:00', end: '07:00' }
    },
    history: {
      versionLog: [
        {
          date: '2024-12-15T14:30:00.000Z',
          user: 'system',
          changes: { 
            startDate: { from: null, to: '2025-04-01T00:00:00.000Z' },
            endDate: { from: null, to: '2025-04-30T00:00:00.000Z' }
          },
          notes: 'Initial phase setup'
        }
      ],
      previousAffirmations: []
    },
    transitionRequirements: {
      tasks: [
        { id: 'task8', description: 'Establish long-term maintenance plan', isCompleted: false },
        { id: 'task9', description: 'Final biomarker assessment', isCompleted: false }
      ],
      biomarkers: [
        { id: 'bm7', name: 'Overall health score', targetRange: [85, 100], currentValue: 75 }
      ],
      practitionerApproval: false
    },
    adminSettings: {
      lockedBy: undefined,
      lockedUntil: undefined,
      practitionerNotes: 'Standard protocol appropriate for patient profile',
      protocolOverrides: {},
      auditLog: [
        {
          date: '2024-12-15T14:30:00.000Z',
          user: 'system',
          action: 'Phase created',
          details: 'Generated during user onboarding'
        }
      ]
    }
  }
];
