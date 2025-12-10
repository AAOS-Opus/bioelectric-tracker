// Mock notifications data for testing the regeneration metrics system
import { Types } from 'mongoose';

export const mockNotifications = {
  userNotifications: [
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      type: 'reminder',
      title: 'Daily Protocol Reminder',
      message: 'Don\'t forget to take your evening supplements and complete your Spooky Scalar session',
      createdAt: new Date('2025-03-15T17:00:00'),
      isRead: false,
      priority: 'medium',
      actionRequired: true,
      actionUrl: '/dashboard/protocol',
      expiresAt: new Date('2025-03-15T22:00:00')
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      type: 'milestone',
      title: 'Phase 2 Complete!',
      message: 'Congratulations on completing Phase 2 of your regeneration protocol. You\'ve made excellent progress!',
      createdAt: new Date('2025-03-02T08:00:00'),
      isRead: true,
      priority: 'high',
      actionRequired: false,
      actionUrl: '/dashboard/progress',
      expiresAt: null
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      type: 'alert',
      title: 'Low Compliance Alert',
      message: 'Your compliance with the Spooky Scalar sessions has dropped below 70% this week. This may impact your progress.',
      createdAt: new Date('2025-02-25T09:00:00'),
      isRead: true,
      priority: 'high',
      actionRequired: true,
      actionUrl: '/dashboard/compliance',
      expiresAt: null
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      type: 'system',
      title: 'New Feature Available',
      message: 'We\'ve added a new Biomarker Tracking feature to help you monitor your progress more effectively.',
      createdAt: new Date('2025-02-15T13:00:00'),
      isRead: false,
      priority: 'low',
      actionRequired: false,
      actionUrl: '/dashboard/biomarkers',
      expiresAt: null
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      type: 'insight',
      title: 'Progress Insight Available',
      message: 'A new analysis of your health trends is available. Check out your personalized insights.',
      createdAt: new Date('2025-03-10T10:00:00'),
      isRead: false,
      priority: 'medium',
      actionRequired: false,
      actionUrl: '/dashboard/insights',
      expiresAt: null
    }
  ],
  
  systemAlerts: [
    {
      _id: new Types.ObjectId().toString(),
      type: 'maintenance',
      title: 'Scheduled Maintenance',
      message: 'The system will be undergoing maintenance on March 20th from 2AM to 4AM EST. Some features may be temporarily unavailable.',
      createdAt: new Date('2025-03-18T09:00:00'),
      affectedUsers: 'all',
      severity: 'info',
      startTime: new Date('2025-03-20T02:00:00'),
      endTime: new Date('2025-03-20T04:00:00'),
      affectedFeatures: ['Session tracking', 'Reporting']
    },
    {
      _id: new Types.ObjectId().toString(),
      type: 'error',
      title: 'API Connection Issue',
      message: 'We\'re experiencing some connectivity issues with the lab results integration. Our team is working to resolve this.',
      createdAt: new Date('2025-03-16T15:30:00'),
      affectedUsers: 'subset',
      severity: 'warning',
      startTime: new Date('2025-03-16T15:00:00'),
      endTime: null,
      affectedFeatures: ['Lab result uploads', 'Biomarker analysis']
    }
  ],
  
  complianceAlerts: [
    {
      userId: 'user123',
      type: 'missed_products',
      title: 'Missed Supplements',
      message: 'You\'ve missed your Heavy Metal Detox supplement for 2 consecutive days.',
      createdAt: new Date('2025-02-22T20:00:00'),
      products: ['Heavy Metal Detox'],
      complianceRate: 71,
      recommendedAction: 'Resume normal dosage schedule. No need to double dose.'
    },
    {
      userId: 'user123',
      type: 'missed_modality',
      title: 'Missed Modality Sessions',
      message: 'You haven\'t logged any Spooky Scalar sessions in the past 3 days.',
      createdAt: new Date('2025-03-05T20:00:00'),
      modalities: ['Spooky Scalar'],
      complianceRate: 57,
      recommendedAction: 'Try to schedule at least a 15-minute session today or tomorrow.'
    },
    {
      userId: 'user123',
      type: 'low_compliance',
      title: 'Weekly Compliance Alert',
      message: 'Your overall protocol compliance has dropped to 68% this week, below your target of 80%.',
      createdAt: new Date('2025-03-09T08:00:00'),
      complianceRate: 68,
      complianceTarget: 80,
      areas: ['Product usage', 'Modality sessions'],
      recommendedAction: 'Review your schedule and set reminders for key protocol elements.'
    }
  ],
  
  healthAlerts: [
    {
      userId: 'user123',
      type: 'symptom_alert',
      title: 'Detox Reaction Alert',
      message: 'You\'ve reported severe detox symptoms for 3 consecutive days. This may require protocol adjustments.',
      createdAt: new Date('2025-02-07T13:00:00'),
      symptoms: ['Severe headache', 'Extreme fatigue', 'Nausea'],
      severity: 'high',
      recommendedAction: 'Temporarily reduce detox supplement dosage by 50% and increase hydration.',
      notifyPractitioner: true
    },
    {
      userId: 'user123',
      type: 'biomarker_alert',
      title: 'Liver Enzyme Alert',
      message: 'Your latest lab results show elevated liver enzymes (ALT: 65, AST: 58) that require attention.',
      createdAt: new Date('2025-02-28T09:00:00'),
      biomarkers: [
        { name: 'ALT', value: 65, unit: 'U/L', referenceRange: '0-44', status: 'high' },
        { name: 'AST', value: 58, unit: 'U/L', referenceRange: '0-40', status: 'high' }
      ],
      severity: 'medium',
      recommendedAction: 'Schedule a follow-up with your practitioner to discuss these results.',
      notifyPractitioner: true
    }
  ],
  
  progressNotifications: [
    {
      userId: 'user123',
      type: 'milestone',
      title: 'Detox Milestone Achieved',
      message: 'You\'ve completed 30 consecutive days of parasite protocol! This is a significant achievement.',
      createdAt: new Date('2025-03-03T10:00:00'),
      milestone: 'Protocol adherence',
      achievement: '30 days streak',
      impact: 'Significant progress in parasite elimination and detoxification'
    },
    {
      userId: 'user123',
      type: 'improvement',
      title: 'Symptom Improvement',
      message: 'Your reported energy levels have increased by 40% since starting the protocol!',
      createdAt: new Date('2025-03-12T11:00:00'),
      metric: 'Energy level',
      improvement: '40% increase',
      fromValue: 5,
      toValue: 7,
      timePeriod: '10 weeks'
    },
    {
      userId: 'user123',
      type: 'phase_transition',
      title: 'Phase 3 Started',
      message: 'You\'ve now entered Phase 3: Repair & Restore. New protocols are available in your dashboard.',
      createdAt: new Date('2025-03-02T08:00:00'),
      fromPhase: 2,
      toPhase: 3,
      completionRate: 92,
      newGoals: [
        'Cellular repair',
        'Mitochondrial support',
        'Tissue regeneration'
      ]
    }
  ]
};
