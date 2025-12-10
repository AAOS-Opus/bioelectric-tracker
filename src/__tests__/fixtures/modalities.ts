// Test fixtures for bioelectric modalities
export const modalityFixtures = [
  {
    _id: 'modality_spooky_scalar',
    name: 'Spooky Scalar',
    description: 'Scalar energy device that supports cellular communication and detoxification',
    category: 'Bioelectric',
    recommendedFrequency: {
      phase1: '2-3 times per week',
      phase2: '3-4 times per week',
      phase3: '3-4 times per week',
      phase4: '2 times per week'
    },
    recommendedDuration: '60 minutes',
    setupInstructions: [
      'Place scalar transmitter at least 6 feet from receiver',
      'Position body between transmitter and receiver',
      'Use recommended frequency sets for current phase',
      'Stay hydrated during and after sessions'
    ]
  },
  {
    _id: 'modality_mwo',
    name: 'MWO (Multiple Wave Oscillator)',
    description: 'Multiple frequency device that supports cellular energetics and tissue regeneration',
    category: 'Bioelectric',
    recommendedFrequency: {
      phase1: 'Not recommended',
      phase2: '1-2 times per week',
      phase3: '3-4 times per week',
      phase4: '2 times per week'
    },
    recommendedDuration: '30 minutes',
    setupInstructions: [
      'Position unit 2-3 feet away from body',
      'Begin with 15-minute sessions and gradually increase to 30 minutes',
      'Use lower power settings for first 2 weeks',
      'Avoid using late in evening as it may affect sleep'
    ]
  },
  {
    _id: 'modality_pemf',
    name: 'PEMF (Pulsed Electromagnetic Field)',
    description: 'Pulsed magnetic field therapy to support cellular energy and recovery',
    category: 'Bioelectric',
    recommendedFrequency: {
      phase1: '2-3 times per week',
      phase2: '3-4 times per week',
      phase3: '3-4 times per week',
      phase4: '2-3 times per week'
    },
    recommendedDuration: '20-30 minutes',
    setupInstructions: [
      'Place mat on flat surface',
      'Lie on mat or position applicator on target area',
      'Begin with 10-minute sessions and increase as tolerated',
      'Stay hydrated before and after treatment'
    ]
  },
  {
    _id: 'modality_light_therapy',
    name: 'Red Light Therapy',
    description: 'Targeted red and near-infrared light to support cellular recovery and mitochondrial function',
    category: 'Photobiomodulation',
    recommendedFrequency: {
      phase1: '3-5 times per week',
      phase2: '3-5 times per week',
      phase3: '3-5 times per week',
      phase4: '3-5 times per week'
    },
    recommendedDuration: '10-20 minutes',
    setupInstructions: [
      'Position light panel 6-12 inches from target area',
      'Expose skin directly to light (remove clothing from treatment area)',
      'Protect eyes with appropriate eyewear',
      'Rotate body position to treat different areas as needed'
    ]
  }
];

// Test fixtures for modality sessions
export const modalitySessionFixtures = [
  {
    _id: 'session_spooky_1',
    modalityId: 'modality_spooky_scalar',
    userId: 'test_user_id',
    date: new Date('2025-03-15T10:00:00Z'),
    duration: 60,
    settings: {
      program: 'Liver Support',
      intensity: 'Medium'
    },
    notes: 'Felt energized afterward, slight detox headache in evening',
    rating: 8
  },
  {
    _id: 'session_spooky_2',
    modalityId: 'modality_spooky_scalar',
    userId: 'test_user_id',
    date: new Date('2025-03-18T15:30:00Z'),
    duration: 45,
    settings: {
      program: 'Detox Support',
      intensity: 'Low'
    },
    notes: 'Reduced session time due to strong detox reaction last time',
    rating: 7
  },
  {
    _id: 'session_mwo_1',
    modalityId: 'modality_mwo',
    userId: 'test_user_id',
    date: new Date('2025-03-17T11:00:00Z'),
    duration: 25,
    settings: {
      intensity: 'Low',
      distance: '3 feet'
    },
    notes: 'First session, felt mild tingling during treatment',
    rating: 6
  },
  {
    _id: 'session_light_1',
    modalityId: 'modality_light_therapy',
    userId: 'test_user_id',
    date: new Date('2025-03-16T17:00:00Z'),
    duration: 15,
    settings: {
      target: 'Abdomen',
      distance: '8 inches'
    },
    notes: 'Pleasant warmth, focused on liver area',
    rating: 9
  }
];
