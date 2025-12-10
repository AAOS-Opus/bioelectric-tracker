// Mock product usage data for testing the regeneration metrics system
import { Types } from 'mongoose';

export const mockUsageData = {
  validUsageData: [
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      productId: 'prod001',
      productName: 'Zeolite',
      category: 'Detox',
      date: '2025-03-01',
      dosageTaken: 2,
      recommendedDosage: 2,
      timeOfDay: 'morning',
      notes: 'Took with water',
      compliance: true
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      productId: 'prod001',
      productName: 'Zeolite',
      category: 'Detox',
      date: '2025-03-02',
      dosageTaken: 2,
      recommendedDosage: 2,
      timeOfDay: 'morning',
      notes: '',
      compliance: true
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      productId: 'prod001',
      productName: 'Zeolite',
      category: 'Detox',
      date: '2025-03-03',
      dosageTaken: 1,
      recommendedDosage: 2,
      timeOfDay: 'morning',
      notes: 'Forgot to take second capsule',
      compliance: false
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      productId: 'prod002',
      productName: 'PQQ',
      category: 'Mitochondrial',
      date: '2025-03-01',
      dosageTaken: 1,
      recommendedDosage: 1,
      timeOfDay: 'evening',
      notes: 'Took with dinner',
      compliance: true
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      productId: 'prod002',
      productName: 'PQQ',
      category: 'Mitochondrial',
      date: '2025-03-02',
      dosageTaken: 1,
      recommendedDosage: 1,
      timeOfDay: 'evening',
      notes: '',
      compliance: true
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      productId: 'prod002',
      productName: 'PQQ',
      category: 'Mitochondrial',
      date: '2025-03-03',
      dosageTaken: 0,
      recommendedDosage: 1,
      timeOfDay: '',
      notes: 'Forgot to take',
      compliance: false
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      productId: 'prod003',
      productName: 'Fulvic Minerals',
      category: 'Detox',
      date: '2025-03-01',
      dosageTaken: 20,
      recommendedDosage: 20,
      timeOfDay: 'morning',
      notes: 'Took 20 drops in water',
      compliance: true
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      productId: 'prod004',
      productName: 'ALA',
      category: 'Mitochondrial',
      date: '2025-03-01',
      dosageTaken: 2,
      recommendedDosage: 2,
      timeOfDay: 'afternoon',
      notes: '',
      compliance: true
    }
  ],
  
  partialComplianceData: [
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user456',
      productId: 'prod001',
      productName: 'Zeolite',
      category: 'Detox',
      date: '2025-03-01',
      dosageTaken: 2,
      recommendedDosage: 2,
      timeOfDay: 'morning',
      notes: '',
      compliance: true
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user456',
      productId: 'prod001',
      productName: 'Zeolite',
      category: 'Detox',
      date: '2025-03-02',
      dosageTaken: 0,
      recommendedDosage: 2,
      timeOfDay: '',
      notes: 'Missed dose',
      compliance: false
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user456',
      productId: 'prod001',
      productName: 'Zeolite',
      category: 'Detox',
      date: '2025-03-03',
      dosageTaken: 1,
      recommendedDosage: 2,
      timeOfDay: 'morning',
      notes: 'Partial dose',
      compliance: false
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user456',
      productId: 'prod002',
      productName: 'PQQ',
      category: 'Mitochondrial',
      date: '2025-03-01',
      dosageTaken: 1,
      recommendedDosage: 1,
      timeOfDay: 'evening',
      notes: '',
      compliance: true
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user456',
      productId: 'prod002',
      productName: 'PQQ',
      category: 'Mitochondrial',
      date: '2025-03-02',
      dosageTaken: 0,
      recommendedDosage: 1,
      timeOfDay: '',
      notes: 'Missed dose',
      compliance: false
    }
  ],
  
  aggregatedData: {
    complianceByProduct: [
      { productName: 'Zeolite', compliance: 0.67 },
      { productName: 'PQQ', compliance: 0.67 },
      { productName: 'Fulvic Minerals', compliance: 1.0 },
      { productName: 'ALA', compliance: 1.0 }
    ],
    complianceByCategory: [
      { category: 'Detox', compliance: 0.8 },
      { category: 'Mitochondrial', compliance: 0.75 }
    ],
    complianceByTimeOfDay: [
      { timeOfDay: 'morning', compliance: 0.83 },
      { timeOfDay: 'afternoon', compliance: 1.0 },
      { timeOfDay: 'evening', compliance: 0.67 }
    ],
    overallCompliance: 0.78
  },
  
  weeklyComplianceTrend: [
    { week: '2025-02-16', compliance: 0.60 },
    { week: '2025-02-23', compliance: 0.65 },
    { week: '2025-03-02', compliance: 0.75 },
    { week: '2025-03-09', compliance: 0.78 },
    { week: '2025-03-16', compliance: 0.82 }
  ]
};
