// Mock health data for testing the health index calculator
export const mockHealthData = {
  standardDataset: {
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
  
  incompleteDataset: {
    sleep_quality: [
      { date: '2025-03-01', value: 0.65 },
      { date: '2025-03-02', value: 0.67 },
      // Missing days 03, 04
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
    // Missing digestion_quality completely
    mental_clarity: [
      { date: '2025-03-01', value: 0.55 },
      { date: '2025-03-02', value: 0.58 },
      { date: '2025-03-03', value: 0.60 },
      { date: '2025-03-04', value: 0.65 },
      { date: '2025-03-05', value: 0.68 },
      { date: '2025-03-06', value: 0.70 },
      { date: '2025-03-07', value: 0.72 }
    ]
  },
  
  invalidDataset: {
    sleep_quality: [
      { date: '2025-03-01', value: -0.1 }, // Invalid negative value
      { date: '2025-03-02', value: 0.67 },
      { date: '2025-03-03', value: 0.68 },
      { date: '2025-03-04', value: 1.2 }, // Invalid value > 1
      { date: '2025-03-05', value: 0.72 },
      { date: '2025-03-06', value: 0.73 },
      { date: '2025-03-07', value: 0.75 }
    ],
    energy_level: [
      { date: '2025-03-01', value: 0.60 },
      { date: '2025-03-02', value: 0.62 },
      { date: '2025-03-03', value: 'high' }, // Invalid string value
      { date: '2025-03-04', value: 0.70 },
      { date: '2025-03-05', value: 0.75 },
      { date: '2025-03-06', value: 0.78 },
      { date: '2025-03-07', value: 0.81 }
    ],
    mental_clarity: [
      { date: 'invalid date', value: 0.55 }, // Invalid date format
      { date: '2025-03-02', value: 0.58 },
      { date: '2025-03-03', value: 0.60 },
      { date: '2025-03-04', value: 0.65 },
      { date: '2025-03-05', value: 0.68 },
      { date: '2025-03-06', value: 0.70 },
      { date: '2025-03-07', value: 0.72 }
    ]
  },
  
  weeklyAverage: {
    sleep_quality: 0.7,
    energy_level: 0.7,
    digestion_quality: 0.74,
    mental_clarity: 0.64,
    inflammation_markers: 0.33
  },
  
  threeMonthDataset: [
    // Array of 90 days of data for each metric, showing trends over time
    ...Array(90).fill(0).map((_, i) => {
      const date = new Date(2025, 0, i + 1); // Start from Jan 1, 2025
      const dateStr = date.toISOString().split('T')[0];
      
      // Creating a gradual improvement trend
      const day = i + 1;
      const sleepQuality = 0.5 + (day / 450); // 0.5 to 0.7 over 90 days
      const energyLevel = 0.45 + (day / 360); // 0.45 to 0.7 over 90 days
      const digestionQuality = 0.6 + (day / 600); // 0.6 to 0.75 over 90 days
      const mentalClarity = 0.4 + (day / 300); // 0.4 to 0.7 over 90 days
      const inflammationMarkers = 0.6 - (day / 450); // 0.6 to 0.4 over 90 days (decreasing is good)
      
      return {
        date: dateStr,
        metrics: {
          sleep_quality: sleepQuality,
          energy_level: energyLevel,
          digestion_quality: digestionQuality,
          mental_clarity: mentalClarity,
          inflammation_markers: inflammationMarkers
        }
      };
    })
  ],
  
  largeDataset: {
    // Large dataset with 1000 data points for stress testing
    metrics: [...Array(10).fill(0).map(() => ({
      sleep_quality: [...Array(100).fill(0).map(() => ({ date: new Date().toISOString().split('T')[0], value: Math.random() * 0.3 + 0.5 }))],
      energy_level: [...Array(100).fill(0).map(() => ({ date: new Date().toISOString().split('T')[0], value: Math.random() * 0.3 + 0.5 }))],
      digestion_quality: [...Array(100).fill(0).map(() => ({ date: new Date().toISOString().split('T')[0], value: Math.random() * 0.3 + 0.5 }))],
      mental_clarity: [...Array(100).fill(0).map(() => ({ date: new Date().toISOString().split('T')[0], value: Math.random() * 0.3 + 0.5 }))],
      inflammation_markers: [...Array(100).fill(0).map(() => ({ date: new Date().toISOString().split('T')[0], value: Math.random() * 0.3 + 0.2 }))]
    }))]
  }
};
