// Mock progress notes data for testing the regeneration metrics system
import { Types } from 'mongoose';

export const mockProgressNotes = {
  weeklyNotes: [
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      date: '2025-01-05',
      weekNumber: 1,
      phaseNumber: 1,
      energyLevel: 6,
      sleepQuality: 7,
      digestiveFunction: 5,
      painLevels: {
        overall: 4,
        locations: [
          { area: 'Lower back', intensity: 5 },
          { area: 'Joints', intensity: 3 }
        ]
      },
      mentalClarity: 6,
      detoxSymptoms: ['Mild headache', 'Fatigue'],
      mood: 'Neutral',
      observations: 'Starting to feel small changes in energy throughout the day.',
      biomarkers: {
        weight: 185.5,
        bloodPressure: '125/85',
        heartRate: 72,
        bloodSugar: 105,
        inflammation: 'CRP: 2.8'
      },
      productCompliance: 85,
      modalityCompliance: 70,
      dietaryCompliance: 80,
      weeklyGoals: [
        { goal: 'Take all supplements daily', achieved: true },
        { goal: 'Daily Spooky Scalar sessions', achieved: false },
        { goal: 'Stay hydrated (2L+ water)', achieved: true }
      ],
      weeklyScore: 75
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      date: '2025-01-12',
      weekNumber: 2,
      phaseNumber: 1,
      energyLevel: 7,
      sleepQuality: 8,
      digestiveFunction: 6,
      painLevels: {
        overall: 3,
        locations: [
          { area: 'Lower back', intensity: 4 },
          { area: 'Joints', intensity: 2 }
        ]
      },
      mentalClarity: 7,
      detoxSymptoms: ['Mild headache'],
      mood: 'Positive',
      observations: 'Energy improvements continuing, sleep is more restful.',
      biomarkers: {
        weight: 184.0,
        bloodPressure: '122/82',
        heartRate: 70,
        bloodSugar: 102,
        inflammation: 'CRP: 2.5'
      },
      productCompliance: 90,
      modalityCompliance: 80,
      dietaryCompliance: 85,
      weeklyGoals: [
        { goal: 'Take all supplements daily', achieved: true },
        { goal: 'Daily Spooky Scalar sessions', achieved: true },
        { goal: 'Stay hydrated (2L+ water)', achieved: true }
      ],
      weeklyScore: 82
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      date: '2025-02-02',
      weekNumber: 5,
      phaseNumber: 2,
      energyLevel: 5,
      sleepQuality: 6,
      digestiveFunction: 4,
      painLevels: {
        overall: 4,
        locations: [
          { area: 'Head', intensity: 5 },
          { area: 'Abdomen', intensity: 4 }
        ]
      },
      mentalClarity: 5,
      detoxSymptoms: ['Headache', 'Fatigue', 'Skin breakouts', 'Irritability'],
      mood: 'Frustrated',
      observations: 'Experiencing stronger detox reactions this week. Increased fatigue and some skin issues appearing.',
      biomarkers: {
        weight: 182.0,
        bloodPressure: '120/80',
        heartRate: 74,
        bloodSugar: 100,
        inflammation: 'CRP: 3.2'
      },
      productCompliance: 95,
      modalityCompliance: 90,
      dietaryCompliance: 80,
      weeklyGoals: [
        { goal: 'Complete parasite protocol', achieved: true },
        { goal: 'Daily binders', achieved: true },
        { goal: 'Increase water intake', achieved: false }
      ],
      weeklyScore: 70
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      date: '2025-03-15',
      weekNumber: 11,
      phaseNumber: 3,
      energyLevel: 8,
      sleepQuality: 8,
      digestiveFunction: 7,
      painLevels: {
        overall: 2,
        locations: [
          { area: 'Lower back', intensity: 2 }
        ]
      },
      mentalClarity: 8,
      detoxSymptoms: [],
      mood: 'Positive',
      observations: 'Substantial improvements in energy, focus, and overall wellbeing. Sleeping better than I have in years.',
      biomarkers: {
        weight: 178.5,
        bloodPressure: '118/75',
        heartRate: 68,
        bloodSugar: 95,
        inflammation: 'CRP: 1.8'
      },
      productCompliance: 95,
      modalityCompliance: 90,
      dietaryCompliance: 90,
      weeklyGoals: [
        { goal: 'Mitochondrial support protocol', achieved: true },
        { goal: 'Daily MWO sessions', achieved: true },
        { goal: 'Liver support herbs', achieved: true }
      ],
      weeklyScore: 88
    }
  ],
  
  symptomTrends: {
    energyLevels: [
      { week: 1, value: 6 },
      { week: 2, value: 7 },
      { week: 3, value: 6 },
      { week: 4, value: 6 },
      { week: 5, value: 5 },
      { week: 6, value: 6 },
      { week: 7, value: 7 },
      { week: 8, value: 7 },
      { week: 9, value: 7 },
      { week: 10, value: 7 },
      { week: 11, value: 8 }
    ],
    sleepQuality: [
      { week: 1, value: 7 },
      { week: 2, value: 8 },
      { week: 3, value: 7 },
      { week: 4, value: 7 },
      { week: 5, value: 6 },
      { week: 6, value: 7 },
      { week: 7, value: 7 },
      { week: 8, value: 8 },
      { week: 9, value: 8 },
      { week: 10, value: 8 },
      { week: 11, value: 8 }
    ],
    painLevels: [
      { week: 1, value: 4 },
      { week: 2, value: 3 },
      { week: 3, value: 3 },
      { week: 4, value: 3 },
      { week: 5, value: 4 },
      { week: 6, value: 3 },
      { week: 7, value: 3 },
      { week: 8, value: 3 },
      { week: 9, value: 2 },
      { week: 10, value: 2 },
      { week: 11, value: 2 }
    ],
    mentalClarity: [
      { week: 1, value: 6 },
      { week: 2, value: 7 },
      { week: 3, value: 7 },
      { week: 4, value: 6 },
      { week: 5, value: 5 },
      { week: 6, value: 6 },
      { week: 7, value: 7 },
      { week: 8, value: 7 },
      { week: 9, value: 7 },
      { week: 10, value: 8 },
      { week: 11, value: 8 }
    ]
  },
  
  biomarkerTrends: {
    weight: [
      { date: '2025-01-05', value: 185.5 },
      { date: '2025-01-12', value: 184.0 },
      { date: '2025-01-19', value: 183.5 },
      { date: '2025-01-26', value: 183.0 },
      { date: '2025-02-02', value: 182.0 },
      { date: '2025-02-09', value: 181.5 },
      { date: '2025-02-16', value: 180.5 },
      { date: '2025-02-23', value: 180.0 },
      { date: '2025-03-02', value: 179.5 },
      { date: '2025-03-09', value: 179.0 },
      { date: '2025-03-15', value: 178.5 }
    ],
    bloodPressure: [
      { date: '2025-01-05', systolic: 125, diastolic: 85 },
      { date: '2025-01-12', systolic: 122, diastolic: 82 },
      { date: '2025-01-19', systolic: 122, diastolic: 82 },
      { date: '2025-01-26', systolic: 121, diastolic: 81 },
      { date: '2025-02-02', systolic: 120, diastolic: 80 },
      { date: '2025-02-09', systolic: 120, diastolic: 80 },
      { date: '2025-02-16', systolic: 119, diastolic: 79 },
      { date: '2025-02-23', systolic: 119, diastolic: 78 },
      { date: '2025-03-02', systolic: 118, diastolic: 78 },
      { date: '2025-03-09', systolic: 118, diastolic: 76 },
      { date: '2025-03-15', systolic: 118, diastolic: 75 }
    ],
    inflammation: [
      { date: '2025-01-05', crp: 2.8 },
      { date: '2025-01-12', crp: 2.5 },
      { date: '2025-01-19', crp: 2.5 },
      { date: '2025-01-26', crp: 2.4 },
      { date: '2025-02-02', crp: 3.2 },
      { date: '2025-02-09', crp: 2.9 },
      { date: '2025-02-16', crp: 2.6 },
      { date: '2025-02-23', crp: 2.3 },
      { date: '2025-03-02', crp: 2.1 },
      { date: '2025-03-09', crp: 1.9 },
      { date: '2025-03-15', crp: 1.8 }
    ]
  },
  
  complianceTrends: {
    product: [
      { week: 1, value: 85 },
      { week: 2, value: 90 },
      { week: 3, value: 88 },
      { week: 4, value: 90 },
      { week: 5, value: 95 },
      { week: 6, value: 92 },
      { week: 7, value: 94 },
      { week: 8, value: 93 },
      { week: 9, value: 95 },
      { week: 10, value: 94 },
      { week: 11, value: 95 }
    ],
    modality: [
      { week: 1, value: 70 },
      { week: 2, value: 80 },
      { week: 3, value: 85 },
      { week: 4, value: 85 },
      { week: 5, value: 90 },
      { week: 6, value: 88 },
      { week: 7, value: 90 },
      { week: 8, value: 90 },
      { week: 9, value: 90 },
      { week: 10, value: 88 },
      { week: 11, value: 90 }
    ],
    dietary: [
      { week: 1, value: 80 },
      { week: 2, value: 85 },
      { week: 3, value: 80 },
      { week: 4, value: 75 },
      { week: 5, value: 80 },
      { week: 6, value: 85 },
      { week: 7, value: 85 },
      { week: 8, value: 85 },
      { week: 9, value: 90 },
      { week: 10, value: 85 },
      { week: 11, value: 90 }
    ]
  },
  
  notesWithBreakthroughs: [
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user789',
      date: '2025-02-15',
      weekNumber: 4,
      phaseNumber: 1,
      observations: 'Major breakthrough today! After 3 weeks of consistent Spooky Scalar sessions, I noticed a significant reduction in brain fog and dramatic energy improvement. Woke up feeling refreshed for the first time in years.',
      breakthroughFactors: [
        'Consistent Spooky Scalar usage',
        'Increased hydration',
        'Binder supplementation',
        'Improved sleep routine'
      ],
      breakthroughMetrics: {
        energyIncrease: '+40%',
        mentalClarityImprovement: 'Substantial',
        symptomReduction: ['Brain fog', 'Fatigue', 'Joint pain']
      }
    }
  ],
  
  notesWithRegressions: [
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user789',
      date: '2025-03-01',
      weekNumber: 6,
      phaseNumber: 2,
      observations: 'Experiencing a regression this week. Energy levels dropped significantly and old symptoms returned (headaches, joint pain, digestive issues). Possibly related to travel last week and disruption of protocol.',
      regressionFactors: [
        'Travel disruption',
        'Missed supplements for 3 days',
        'Poor sleep',
        'Dietary non-compliance'
      ],
      correctionPlan: [
        'Double hydration for 3 days',
        'Resume full supplement protocol with 25% increased dosage of binders',
        'Daily sauna sessions',
        'Extra rest'
      ]
    }
  ]
};
