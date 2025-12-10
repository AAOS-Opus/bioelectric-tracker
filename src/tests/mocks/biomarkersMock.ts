// Mock biomarker data for testing the regeneration metrics system
import { Types } from 'mongoose';

export const mockBiomarkers = {
  labTests: [
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      testName: 'Comprehensive Metabolic Panel',
      testDate: '2025-01-01',
      phaseNumber: 1,
      weekNumber: 1,
      results: [
        { marker: 'ALT', value: 45, unit: 'U/L', referenceRange: '0-44', status: 'high' },
        { marker: 'AST', value: 42, unit: 'U/L', referenceRange: '0-40', status: 'high' },
        { marker: 'ALP', value: 80, unit: 'U/L', referenceRange: '40-120', status: 'normal' },
        { marker: 'GGT', value: 70, unit: 'U/L', referenceRange: '0-65', status: 'high' },
        { marker: 'Bilirubin', value: 0.8, unit: 'mg/dL', referenceRange: '0.1-1.2', status: 'normal' },
        { marker: 'BUN', value: 16, unit: 'mg/dL', referenceRange: '7-25', status: 'normal' },
        { marker: 'Creatinine', value: 0.9, unit: 'mg/dL', referenceRange: '0.5-1.5', status: 'normal' },
        { marker: 'Glucose', value: 105, unit: 'mg/dL', referenceRange: '70-99', status: 'high' }
      ],
      interpretation: 'Mild liver enzyme elevation suggesting liver stress. Blood glucose slightly elevated.',
      notes: 'Baseline test before starting protocol',
      uploadedBy: 'user',
      uploadDate: '2025-01-03'
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      testName: 'Comprehensive Metabolic Panel',
      testDate: '2025-03-01',
      phaseNumber: 3,
      weekNumber: 9,
      results: [
        { marker: 'ALT', value: 32, unit: 'U/L', referenceRange: '0-44', status: 'normal' },
        { marker: 'AST', value: 29, unit: 'U/L', referenceRange: '0-40', status: 'normal' },
        { marker: 'ALP', value: 75, unit: 'U/L', referenceRange: '40-120', status: 'normal' },
        { marker: 'GGT', value: 48, unit: 'U/L', referenceRange: '0-65', status: 'normal' },
        { marker: 'Bilirubin', value: 0.6, unit: 'mg/dL', referenceRange: '0.1-1.2', status: 'normal' },
        { marker: 'BUN', value: 14, unit: 'mg/dL', referenceRange: '7-25', status: 'normal' },
        { marker: 'Creatinine', value: 0.8, unit: 'mg/dL', referenceRange: '0.5-1.5', status: 'normal' },
        { marker: 'Glucose', value: 92, unit: 'mg/dL', referenceRange: '70-99', status: 'normal' }
      ],
      interpretation: 'Liver enzymes have normalized. Blood glucose improved to normal range.',
      notes: 'Good improvement after completing two phases',
      uploadedBy: 'user',
      uploadDate: '2025-03-05'
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      testName: 'Inflammation Panel',
      testDate: '2025-01-01',
      phaseNumber: 1,
      weekNumber: 1,
      results: [
        { marker: 'CRP', value: 3.2, unit: 'mg/L', referenceRange: '<3.0', status: 'high' },
        { marker: 'ESR', value: 15, unit: 'mm/hr', referenceRange: '0-15', status: 'normal' },
        { marker: 'Homocysteine', value: 12.5, unit: 'µmol/L', referenceRange: '<11.4', status: 'high' },
        { marker: 'Fibrinogen', value: 325, unit: 'mg/dL', referenceRange: '200-400', status: 'normal' }
      ],
      interpretation: 'Mild systemic inflammation present.',
      notes: 'Baseline inflammatory markers',
      uploadedBy: 'user',
      uploadDate: '2025-01-03'
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      testName: 'Inflammation Panel',
      testDate: '2025-03-01',
      phaseNumber: 3,
      weekNumber: 9,
      results: [
        { marker: 'CRP', value: 1.8, unit: 'mg/L', referenceRange: '<3.0', status: 'normal' },
        { marker: 'ESR', value: 10, unit: 'mm/hr', referenceRange: '0-15', status: 'normal' },
        { marker: 'Homocysteine', value: 9.2, unit: 'µmol/L', referenceRange: '<11.4', status: 'normal' },
        { marker: 'Fibrinogen', value: 290, unit: 'mg/dL', referenceRange: '200-400', status: 'normal' }
      ],
      interpretation: 'Inflammatory markers have normalized.',
      notes: 'Good improvement after two phases',
      uploadedBy: 'user',
      uploadDate: '2025-03-05'
    }
  ],
  
  biomarkerTrends: {
    liverEnzymes: {
      alt: [
        { date: '2025-01-01', value: 45 },
        { date: '2025-03-01', value: 32 }
      ],
      ast: [
        { date: '2025-01-01', value: 42 },
        { date: '2025-03-01', value: 29 }
      ],
      ggt: [
        { date: '2025-01-01', value: 70 },
        { date: '2025-03-01', value: 48 }
      ]
    },
    inflammationMarkers: {
      crp: [
        { date: '2025-01-01', value: 3.2 },
        { date: '2025-03-01', value: 1.8 }
      ],
      homocysteine: [
        { date: '2025-01-01', value: 12.5 },
        { date: '2025-03-01', value: 9.2 }
      ]
    },
    metabolicMarkers: {
      glucose: [
        { date: '2025-01-01', value: 105 },
        { date: '2025-03-01', value: 92 }
      ]
    }
  },
  
  detoxSymptoms: [
    {
      userId: 'user123',
      date: '2025-01-10',
      phaseNumber: 1,
      weekNumber: 2,
      symptoms: [
        { name: 'Fatigue', severity: 3, duration: 'All day', notes: 'Mostly in the afternoon' },
        { name: 'Headache', severity: 2, duration: '2-3 hours', notes: 'After taking supplements' }
      ]
    },
    {
      userId: 'user123',
      date: '2025-02-05',
      phaseNumber: 2,
      weekNumber: 6,
      symptoms: [
        { name: 'Fatigue', severity: 4, duration: 'All day', notes: 'Worse than usual' },
        { name: 'Headache', severity: 3, duration: 'Most of day', notes: 'Needed to rest' },
        { name: 'Skin breakouts', severity: 2, duration: '3 days', notes: 'Small rash on face and back' },
        { name: 'Joint pain', severity: 2, duration: 'Intermittent', notes: 'Noticed in knees and elbows' }
      ]
    },
    {
      userId: 'user123',
      date: '2025-02-20',
      phaseNumber: 2,
      weekNumber: 8,
      symptoms: [
        { name: 'Fatigue', severity: 2, duration: 'Afternoon only', notes: 'Improving' },
        { name: 'Headache', severity: 1, duration: '1 hour', notes: 'Much milder' },
        { name: 'Skin breakouts', severity: 1, duration: 'Resolving', notes: 'Almost cleared up' }
      ]
    }
  ],
  
  parasiteActivity: [
    {
      userId: 'user123',
      date: '2025-02-07',
      phaseNumber: 2,
      weekNumber: 6,
      observation: 'Noticed strange flecks in stool',
      parasiteType: 'Unknown',
      confirmationMethod: 'Visual',
      severity: 'Mild',
      associatedSymptoms: ['Digestive discomfort', 'Bloating'],
      notes: 'First signs of parasite release'
    },
    {
      userId: 'user123',
      date: '2025-02-15',
      phaseNumber: 2,
      weekNumber: 7,
      observation: 'Larger parasitic material in stool',
      parasiteType: 'Possibly roundworm',
      confirmationMethod: 'Visual',
      severity: 'Moderate',
      associatedSymptoms: ['Digestive discomfort', 'Fatigue', 'Irritability'],
      notes: 'Continuing parasite protocol with increased binders'
    }
  ],
  
  healthScores: {
    overall: [
      { date: '2025-01-05', score: 65 },
      { date: '2025-01-12', score: 68 },
      { date: '2025-01-19', score: 70 },
      { date: '2025-01-26', score: 73 },
      { date: '2025-02-02', score: 72 },
      { date: '2025-02-09', score: 70 },
      { date: '2025-02-16', score: 75 },
      { date: '2025-02-23', score: 78 },
      { date: '2025-03-02', score: 80 },
      { date: '2025-03-09', score: 83 },
      { date: '2025-03-15', score: 85 }
    ],
    liverFunction: [
      { date: '2025-01-05', score: 60 },
      { date: '2025-03-15', score: 82 }
    ],
    digestiveHealth: [
      { date: '2025-01-05', score: 58 },
      { date: '2025-03-15', score: 80 }
    ],
    immuneFunction: [
      { date: '2025-01-05', score: 63 },
      { date: '2025-03-15', score: 84 }
    ],
    energyLevels: [
      { date: '2025-01-05', score: 55 },
      { date: '2025-03-15', score: 80 }
    ]
  }
};
