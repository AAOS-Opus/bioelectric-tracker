// Mock health trend data for testing the regeneration metrics system
export const mockHealthTrends = {
  recentHealthData: {
    sleep_quality: [
      { date: '2025-03-01', value: 0.65 },
      { date: '2025-03-02', value: 0.67 },
      { date: '2025-03-03', value: 0.68 },
      { date: '2025-03-04', value: 0.70 },
      { date: '2025-03-05', value: 0.72 },
      { date: '2025-03-06', value: 0.73 },
      { date: '2025-03-07', value: 0.75 }
    ],
    energy_level: [
      { date: '2025-03-01', value: 0.60 },
      { date: '2025-03-02', value: 0.62 },
      { date: '2025-03-03', value: 0.65 },
      { date: '2025-03-04', value: 0.70 },
      { date: '2025-03-05', value: 0.75 },
      { date: '2025-03-06', value: 0.78 },
      { date: '2025-03-07', value: 0.81 }
    ],
    digestion_quality: [
      { date: '2025-03-01', value: 0.70 },
      { date: '2025-03-02', value: 0.72 },
      { date: '2025-03-03', value: 0.74 },
      { date: '2025-03-04', value: 0.75 },
      { date: '2025-03-05', value: 0.75 },
      { date: '2025-03-06', value: 0.76 },
      { date: '2025-03-07', value: 0.78 }
    ],
    mental_clarity: [
      { date: '2025-03-01', value: 0.55 },
      { date: '2025-03-02', value: 0.58 },
      { date: '2025-03-03', value: 0.60 },
      { date: '2025-03-04', value: 0.65 },
      { date: '2025-03-05', value: 0.68 },
      { date: '2025-03-06', value: 0.70 },
      { date: '2025-03-07', value: 0.72 }
    ],
    inflammation_markers: [
      { date: '2025-03-01', value: 0.40 },
      { date: '2025-03-02', value: 0.38 },
      { date: '2025-03-03', value: 0.35 },
      { date: '2025-03-04', value: 0.32 },
      { date: '2025-03-05', value: 0.30 },
      { date: '2025-03-06', value: 0.28 },
      { date: '2025-03-07', value: 0.25 }
    ]
  },
  
  milestoneData: {
    sleep_quality: [
      { date: '2025-01-15', value: 0.45 },
      { date: '2025-02-01', value: 0.55 },
      { date: '2025-02-15', value: 0.60 },
      { date: '2025-03-01', value: 0.65 },
      { date: '2025-03-15', value: 0.75 }
    ],
    energy_level: [
      { date: '2025-01-15', value: 0.40 },
      { date: '2025-02-01', value: 0.50 },
      { date: '2025-02-15', value: 0.60 },
      { date: '2025-03-01', value: 0.70 },
      { date: '2025-03-15', value: 0.80 }
    ],
    modality_sessions: [
      { date: '2025-03-01', value: 1 },
      { date: '2025-03-02', value: 1 },
      { date: '2025-03-03', value: 1 },
      { date: '2025-03-04', value: 1 },
      { date: '2025-03-05', value: 1 },
      { date: '2025-03-06', value: 1 },
      { date: '2025-03-07', value: 1 },
      { date: '2025-03-08', value: 1 },
      { date: '2025-03-09', value: 1 },
      { date: '2025-03-10', value: 1 },
      { date: '2025-03-11', value: 1 },
      { date: '2025-03-12', value: 1 },
      { date: '2025-03-13', value: 1 },
      { date: '2025-03-14', value: 1 }
    ],
    recovery_rate: [
      { date: '2025-01-15', value: 0.30 },
      { date: '2025-02-01', value: 0.40 },
      { date: '2025-02-15', value: 0.55 },
      { date: '2025-03-01', value: 0.65 },
      { date: '2025-03-15', value: 0.75 }
    ]
  },
  
  seasonalPatterns: {
    sleep_quality: [
      { date: '2024-03-15', value: 0.70 },
      { date: '2024-06-15', value: 0.75 },
      { date: '2024-09-15', value: 0.68 },
      { date: '2024-12-15', value: 0.65 },
      { date: '2025-03-15', value: 0.72 }
    ],
    energy_level: [
      { date: '2024-03-15', value: 0.65 },
      { date: '2024-06-15', value: 0.80 },
      { date: '2024-09-15', value: 0.75 },
      { date: '2024-12-15', value: 0.60 },
      { date: '2025-03-15', value: 0.70 }
    ]
  },
  
  volatileTrends: {
    anxiety_level: [
      { date: '2025-03-01', value: 0.40 },
      { date: '2025-03-02', value: 0.65 },
      { date: '2025-03-03', value: 0.30 },
      { date: '2025-03-04', value: 0.55 },
      { date: '2025-03-05', value: 0.25 },
      { date: '2025-03-06', value: 0.60 },
      { date: '2025-03-07', value: 0.35 }
    ]
  }
};
