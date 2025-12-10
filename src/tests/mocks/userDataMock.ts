// Mock user data for testing the regeneration metrics system
export const mockUserData = {
  standardUser: {
    id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    programStartDate: '2025-01-15',
    currentPhase: 2,
    preferences: {
      notifications: true,
      dashboardLayout: 'detailed',
      theme: 'light'
    },
    engagement: {
      level: 'medium',
      sessionsPerWeek: 5,
      averageSessionDuration: 15,
      lastLoginDate: '2025-03-20'
    }
  },
  userWithMilestones: {
    id: 'user456',
    name: 'Milestone User',
    email: 'milestone@example.com',
    programStartDate: '2025-01-01',
    currentPhase: 3,
    preferences: {
      notifications: true,
      dashboardLayout: 'compact',
      theme: 'dark'
    },
    engagement: {
      level: 'high',
      sessionsPerWeek: 12,
      averageSessionDuration: 25,
      lastLoginDate: '2025-03-22'
    },
    achievements: [
      {
        id: 'ach001',
        type: 'streak',
        value: 14,
        date: '2025-03-15',
        description: 'Completed 14 consecutive days of treatment'
      },
      {
        id: 'ach002',
        type: 'improvement',
        metric: 'energy_level',
        percentImprovement: 25,
        date: '2025-03-10',
        description: 'Energy levels improved by 25% over 30 days'
      }
    ]
  },
  lowEngagementUser: {
    id: 'user789',
    name: 'Low Engagement User',
    email: 'low@example.com',
    programStartDate: '2025-02-01',
    currentPhase: 1,
    preferences: {
      notifications: false,
      dashboardLayout: 'minimal',
      theme: 'light'
    },
    engagement: {
      level: 'low',
      sessionsPerWeek: 2,
      averageSessionDuration: 5,
      lastLoginDate: '2025-03-15'
    }
  }
};

export const mockUserList = [
  mockUserData.standardUser,
  mockUserData.userWithMilestones,
  mockUserData.lowEngagementUser
];
