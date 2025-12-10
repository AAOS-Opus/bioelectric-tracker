// Mock phase data for testing the regeneration metrics system
import { Types } from 'mongoose';

export const mockPhases = {
  standardPhases: [
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      phaseNumber: 1,
      name: 'Preparation',
      description: 'Getting your body ready for deep detoxification',
      startDate: '2025-01-01',
      endDate: '2025-01-28',
      duration: 28, // days
      isCompleted: true,
      completionDate: '2025-01-28',
      affirmation: 'I am preparing my body for optimal healing and regeneration',
      goals: [
        'Establish baseline habits',
        'Prepare digestive system',
        'Start gentle detox protocols'
      ],
      recommendedProducts: ['Liver Support', 'Digestive Enzymes', 'Probiotics'],
      recommendedModalities: ['Spooky Scalar', 'PEMF', 'Sauna'],
      progressPercentage: 100
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      phaseNumber: 2,
      name: 'Deep Detoxification',
      description: 'Removing toxins and pathogens from your system',
      startDate: '2025-01-29',
      endDate: '2025-03-01',
      duration: 32, // days
      isCompleted: true,
      completionDate: '2025-03-01',
      affirmation: 'I am releasing toxins and creating space for healing',
      goals: [
        'Target heavy metals',
        'Address parasitic load',
        'Support elimination pathways'
      ],
      recommendedProducts: ['Heavy Metal Detox', 'Parasite Protocol', 'Binders'],
      recommendedModalities: ['Spooky Scalar', 'MWO', 'Red Light Therapy', 'Sauna'],
      progressPercentage: 100
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      phaseNumber: 3,
      name: 'Repair & Restore',
      description: 'Rebuilding healthy tissues and restoring function',
      startDate: '2025-03-02',
      endDate: '2025-04-12',
      duration: 42, // days
      isCompleted: false,
      completionDate: null,
      affirmation: 'My body is healing and regenerating optimally',
      goals: [
        'Cellular repair',
        'Mitochondrial support',
        'Tissue regeneration'
      ],
      recommendedProducts: ['Mitochondrial Support', 'Stem Cell Activators', 'Organ Support'],
      recommendedModalities: ['Spooky Scalar', 'MWO', 'PEMF', 'Red Light Therapy'],
      progressPercentage: 60
    },
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user123',
      phaseNumber: 4,
      name: 'Optimization',
      description: 'Fine-tuning your health for long-term wellness',
      startDate: '2025-04-13',
      endDate: '2025-05-24',
      duration: 42, // days
      isCompleted: false,
      completionDate: null,
      affirmation: 'I am optimizing my health and reaching new levels of vitality',
      goals: [
        'Personalized protocols',
        'Performance enhancement',
        'Maintenance strategies'
      ],
      recommendedProducts: ['Custom Formulas', 'Adaptogens', 'Performance Enhancers'],
      recommendedModalities: ['MWO', 'Red Light Therapy', 'PEMF'],
      progressPercentage: 0
    }
  ],
  
  phasesInProgress: [
    {
      _id: new Types.ObjectId().toString(),
      userId: 'user456',
      phaseNumber: 1,
      name: 'Preparation',
      description: 'Getting your body ready for deep detoxification',
      startDate: '2025-02-15',
      endDate: '2025-03-14',
      duration: 28,
      isCompleted: false,
      completionDate: null,
      affirmation: 'I am preparing my body for optimal healing and regeneration',
      goals: [
        'Establish baseline habits',
        'Prepare digestive system',
        'Start gentle detox protocols'
      ],
      recommendedProducts: ['Liver Support', 'Digestive Enzymes', 'Probiotics'],
      recommendedModalities: ['Spooky Scalar', 'PEMF', 'Sauna'],
      progressPercentage: 50
    }
  ],
  
  phaseExtensions: [
    {
      originalPhaseId: 'phase123',
      extensionReason: 'Additional detoxification needed',
      extensionDays: 14,
      extendedEndDate: '2025-03-15',
      isCustom: false,
      notes: 'User showing signs of additional detox requirements'
    }
  ],
  
  phaseTransitions: [
    {
      fromPhase: 1,
      toPhase: 2,
      transitionDate: '2025-01-29',
      transitionTriggeredBy: 'Time-based',
      readinessScore: 85,
      readinessCriteria: {
        symptomReduction: true,
        productCompliance: true,
        modalityCompliance: true,
        biomarkerImprovements: false
      },
      notes: 'Successful transition with good compliance'
    },
    {
      fromPhase: 2,
      toPhase: 3,
      transitionDate: '2025-03-02',
      transitionTriggeredBy: 'Manual override',
      readinessScore: 70,
      readinessCriteria: {
        symptomReduction: true,
        productCompliance: false,
        modalityCompliance: true,
        biomarkerImprovements: false
      },
      notes: 'Some compliance issues but enough progress to continue'
    }
  ],
  
  // For testing phase analytics and reporting
  phaseAnalytics: {
    averageCompletionRate: {
      phase1: 92,
      phase2: 85,
      phase3: 78,
      phase4: 73
    },
    averageDurationExtensions: {
      phase1: 3, // days
      phase2: 7,
      phase3: 10,
      phase4: 5
    },
    commonExtensionReasons: {
      phase1: ['Increased stress', 'Travel disruptions', 'Illness'],
      phase2: ['Detox reactions', 'Heavy toxic load', 'Protocol adjustments'],
      phase3: ['Slower healing response', 'Additional areas of focus', 'New symptoms emerged'],
      phase4: ['Desire for further optimization', 'Maintenance period extension']
    },
    successFactors: {
      phase1: ['Consistent product usage', 'Regular modality sessions', 'Dietary compliance'],
      phase2: ['Increased hydration', 'Binder usage', 'Full protocol adherence'],
      phase3: ['Stress management', 'Sleep optimization', 'Nutritional support'],
      phase4: ['Personalized protocols', 'Lifestyle integration', 'Maintenance strategy']
    }
  }
};
