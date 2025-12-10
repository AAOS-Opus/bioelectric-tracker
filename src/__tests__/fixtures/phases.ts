// Test fixtures for protocol phases
export const phaseFixtures = [
  {
    _id: 'phase_1',
    name: 'Preparation',
    description: 'Preparing the body for deeper detoxification by supporting natural detox pathways',
    color: 'medical-blue-500',
    affirmation: 'I am preparing my body for healing and cleansing',
    durationDays: 30,
    order: 1,
    recommendations: [
      'Begin with gentle detox support products',
      'Increase water intake to 2-3 liters daily',
      'Focus on quality sleep and stress reduction',
      'Eliminate processed foods and alcohol'
    ],
    completed: false
  },
  {
    _id: 'phase_2',
    name: 'Active Detoxification',
    description: 'Deep cellular cleansing and toxin mobilization',
    color: 'medical-green-500',
    affirmation: 'I am releasing toxins and creating space for healing',
    durationDays: 45,
    order: 2,
    recommendations: [
      'Implement full PushCatch protocol',
      'Use Spooky Scalar support 2-3 times weekly',
      'Support lymphatic drainage through movement',
      'Ensure adequate binder supplementation'
    ],
    completed: false
  },
  {
    _id: 'phase_3',
    name: 'Rebuilding',
    description: 'Cellular repair and mitochondrial regeneration',
    color: 'medical-orange-500',
    affirmation: 'I am rebuilding my cells with pure energy and vitality',
    durationDays: 60,
    order: 3,
    recommendations: [
      'Emphasize NAD+ support',
      'Increase mitochondrial support nutrients',
      'Begin MWO sessions 3-4 times weekly',
      'Focus on nutrient-dense diet for rebuilding'
    ],
    completed: false
  },
  {
    _id: 'phase_4',
    name: 'Integration',
    description: 'Stabilizing health gains and establishing maintenance protocols',
    color: 'medical-purple-500',
    affirmation: 'I am integrating my healing journey into lasting health',
    durationDays: 60,
    order: 4,
    recommendations: [
      'Establish maintenance product protocol',
      'Continue bioelectric support twice weekly',
      'Fine-tune personalized nutrition plan',
      'Integrate mindfulness practices'
    ],
    completed: false
  }
];
