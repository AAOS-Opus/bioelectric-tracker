// Mock treatment plan data for testing the regeneration metrics system
import { Types } from 'mongoose';

export const mockTreatmentPlans = {
  standardPlans: [
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      name: 'Standard 4-Phase Protocol',
      description: 'Complete liver and colon regeneration program',
      startDate: '2025-01-01',
      endDate: '2025-05-24',
      totalDuration: 144, // days
      currentPhase: 3,
      phaseIds: ['phase1_id', 'phase2_id', 'phase3_id', 'phase4_id'],
      isCustomized: false,
      overallProgress: 65,
      creator: 'System',
      lastModified: '2025-03-15'
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user456',
      name: 'Modified Liver Focus Protocol',
      description: 'Emphasis on liver support with extended detoxification',
      startDate: '2025-02-15',
      endDate: '2025-07-15',
      totalDuration: 150, // days
      currentPhase: 1,
      phaseIds: ['phase1_id', 'phase2_id', 'phase3_id', 'phase4_id'],
      isCustomized: true,
      customizations: [
        {
          phaseNumber: 2,
          durationChange: 14, // added 14 days
          productAdditions: ['Advanced Liver Support', 'GI Detox'],
          productRemovals: []
        }
      ],
      overallProgress: 20,
      creator: 'Dr. Smith',
      lastModified: '2025-02-20'
    }
  ],
  
  phaseProtocols: [
    {
      phaseNumber: 1,
      name: 'Preparation Phase Protocol',
      duration: 28,
      productSchedule: [
        {
          productId: 'prod001',
          productName: 'Liver Support',
          dosage: '2 capsules',
          frequency: '2x daily',
          timing: 'Morning and evening with meals',
          duration: 'Entire phase'
        },
        {
          productId: 'prod002',
          productName: 'Digestive Enzymes',
          dosage: '1 capsule',
          frequency: '3x daily',
          timing: 'With meals',
          duration: 'Entire phase'
        },
        {
          productId: 'prod003',
          productName: 'Probiotics',
          dosage: '1 capsule',
          frequency: '1x daily',
          timing: 'Morning on empty stomach',
          duration: 'Entire phase'
        }
      ],
      modalitySchedule: [
        {
          modalityId: 'mod001',
          modalityName: 'Spooky Scalar',
          frequency: '5x weekly',
          duration: '30 minutes',
          protocol: 'Liver Support',
          notes: 'Run the Liver Support and Detox Prep programs'
        },
        {
          modalityId: 'mod003',
          modalityName: 'PEMF',
          frequency: '3x weekly',
          duration: '20 minutes',
          protocol: 'Relaxation',
          notes: 'Focus on abdominal area'
        },
        {
          modalityId: 'mod005',
          modalityName: 'Sauna',
          frequency: '2x weekly',
          duration: '25 minutes',
          protocol: 'Gentle Detox',
          notes: 'Start with shorter sessions and increase gradually'
        }
      ],
      dietaryGuidelines: [
        'Eliminate processed foods',
        'Remove alcohol and caffeine',
        'Increase water intake to 2-3 liters daily',
        'Focus on organic vegetables and fruits',
        'Include liver-supporting foods (beets, cruciferous vegetables, garlic, turmeric)'
      ],
      lifestyleRecommendations: [
        'Gentle exercise 30 minutes daily',
        'Improve sleep hygiene',
        'Dry skin brushing',
        'Deep breathing exercises',
        'Reduce exposure to environmental toxins'
      ]
    },
    {
      phaseNumber: 2,
      name: 'Deep Detoxification Protocol',
      duration: 32,
      productSchedule: [
        {
          productId: 'prod004',
          productName: 'Heavy Metal Detox',
          dosage: '1 capsule, increasing to 2',
          frequency: '2x daily',
          timing: 'With meals',
          duration: 'Entire phase'
        },
        {
          productId: 'prod005',
          productName: 'Parasite Protocol',
          dosage: 'As directed',
          frequency: 'As directed',
          timing: 'As directed',
          duration: 'Days 1-15, then 3 days off, then days 19-32'
        },
        {
          productId: 'prod006',
          productName: 'Binders',
          dosage: '1 scoop',
          frequency: '2x daily',
          timing: '30 minutes before meals',
          duration: 'Entire phase'
        },
        {
          productId: 'prod001',
          productName: 'Liver Support',
          dosage: '2 capsules',
          frequency: '2x daily',
          timing: 'Morning and evening with meals',
          duration: 'Entire phase'
        }
      ],
      modalitySchedule: [
        {
          modalityId: 'mod001',
          modalityName: 'Spooky Scalar',
          frequency: 'Daily',
          duration: '30 minutes',
          protocol: 'Parasite Programs',
          notes: 'Alternate between different parasite programs'
        },
        {
          modalityId: 'mod002',
          modalityName: 'MWO',
          frequency: '3x weekly',
          duration: '30 minutes',
          protocol: 'Detox Support',
          notes: 'Use in the evening'
        },
        {
          modalityId: 'mod004',
          modalityName: 'Red Light Therapy',
          frequency: '4x weekly',
          duration: '15 minutes',
          protocol: 'Liver Focus',
          notes: 'Position over liver area'
        },
        {
          modalityId: 'mod005',
          modalityName: 'Sauna',
          frequency: '3x weekly',
          duration: '25 minutes',
          protocol: 'Detox',
          notes: 'Ensure adequate hydration before and after'
        }
      ],
      dietaryGuidelines: [
        'Anti-parasitic diet (avoid sugar, refined carbs)',
        'Increase fiber intake',
        'Add bitter foods to support bile flow',
        'Include detox-supporting herbs (cilantro, parsley)',
        'Stay well hydrated (3+ liters daily)'
      ],
      lifestyleRecommendations: [
        'Coffee enemas (if approved by practitioner)',
        'Epsom salt baths',
        'Lymphatic massage',
        'Castor oil packs over liver',
        'Adequate rest periods'
      ]
    }
  ],
  
  customProtocols: [
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user789',
      name: 'Enhanced Liver Protocol',
      targetedConditions: ['Fatty liver', 'Elevated liver enzymes', 'Chemical sensitivity'],
      products: [
        {
          productId: 'prod010',
          productName: 'Advanced Liver Complex',
          dosage: '2 capsules',
          frequency: '3x daily',
          timing: 'With meals',
          duration: '60 days'
        },
        {
          productId: 'prod011',
          productName: 'Milk Thistle Ultra',
          dosage: '1 teaspoon',
          frequency: '2x daily',
          timing: 'Morning and evening',
          duration: '60 days'
        },
        {
          productId: 'prod012',
          productName: 'Glutathione Liposomal',
          dosage: '2 pumps',
          frequency: '2x daily',
          timing: 'Morning and midday',
          duration: '60 days'
        }
      ],
      modalities: [
        {
          modalityId: 'mod001',
          modalityName: 'Spooky Scalar',
          customSettings: 'Liver regeneration frequencies',
          frequency: 'Daily',
          duration: '45 minutes'
        },
        {
          modalityId: 'mod004',
          modalityName: 'Red Light Therapy',
          customSettings: 'Liver focus',
          frequency: 'Daily',
          duration: '20 minutes'
        }
      ],
      specialInstructions: 'Focus heavily on liver support. Double hydration. Weekly castor oil packs. Monitor liver enzymes every 3 weeks.',
      createdBy: 'Dr. Johnson',
      createdDate: '2025-02-10',
      expirationDate: '2025-04-10'
    }
  ],
  
  protocolCompliance: {
    productAdherence: [
      { week: 1, adherenceRate: 82 },
      { week: 2, adherenceRate: 88 },
      { week: 3, adherenceRate: 90 },
      { week: 4, adherenceRate: 92 },
      { week: 5, adherenceRate: 85 },
      { week: 6, adherenceRate: 88 },
      { week: 7, adherenceRate: 91 },
      { week: 8, adherenceRate: 94 },
      { week: 9, adherenceRate: 95 },
      { week: 10, adherenceRate: 93 },
      { week: 11, adherenceRate: 96 }
    ],
    modalityAdherence: [
      { week: 1, adherenceRate: 70 },
      { week: 2, adherenceRate: 75 },
      { week: 3, adherenceRate: 80 },
      { week: 4, adherenceRate: 85 },
      { week: 5, adherenceRate: 85 },
      { week: 6, adherenceRate: 90 },
      { week: 7, adherenceRate: 90 },
      { week: 8, adherenceRate: 90 },
      { week: 9, adherenceRate: 88 },
      { week: 10, adherenceRate: 92 },
      { week: 11, adherenceRate: 95 }
    ],
    dietaryAdherence: [
      { week: 1, adherenceRate: 75 },
      { week: 2, adherenceRate: 80 },
      { week: 3, adherenceRate: 80 },
      { week: 4, adherenceRate: 85 },
      { week: 5, adherenceRate: 80 },
      { week: 6, adherenceRate: 75 },
      { week: 7, adherenceRate: 80 },
      { week: 8, adherenceRate: 85 },
      { week: 9, adherenceRate: 88 },
      { week: 10, adherenceRate: 90 },
      { week: 11, adherenceRate: 92 }
    ]
  }
};
