// Test fixtures for biomarkers
export const biomarkerFixtures = [
  {
    _id: 'biomarker_energy',
    name: 'Energy Level',
    description: 'Subjective rating of overall energy throughout the day',
    type: 'numeric',
    units: 'scale 1-10',
    normalRange: '7-10',
    trackingFrequency: 'daily'
  },
  {
    _id: 'biomarker_sleep',
    name: 'Sleep Quality',
    description: 'Overall quality of sleep including ease of falling asleep, staying asleep, and feeling rested',
    type: 'numeric',
    units: 'scale 1-10',
    normalRange: '7-10',
    trackingFrequency: 'daily'
  },
  {
    _id: 'biomarker_detox',
    name: 'Detox Symptoms',
    description: 'Headaches, fatigue, brain fog, or other symptoms related to detoxification',
    type: 'numeric',
    units: 'scale 1-10 (10 = no symptoms)',
    normalRange: '7-10',
    trackingFrequency: 'daily'
  },
  {
    _id: 'biomarker_digestion',
    name: 'Digestive Comfort',
    description: 'Absence of digestive discomfort, bloating, or irregular bowel movements',
    type: 'numeric',
    units: 'scale 1-10 (10 = excellent)',
    normalRange: '7-10',
    trackingFrequency: 'daily'
  },
  {
    _id: 'biomarker_inflammation',
    name: 'Inflammation',
    description: 'Subjective assessment of inflammation symptoms like joint pain or swelling',
    type: 'numeric',
    units: 'scale 1-10 (10 = none)',
    normalRange: '7-10',
    trackingFrequency: 'daily'
  },
  {
    _id: 'biomarker_mental_clarity',
    name: 'Mental Clarity',
    description: 'Ability to focus, think clearly, and maintain cognitive function',
    type: 'numeric',
    units: 'scale 1-10',
    normalRange: '7-10',
    trackingFrequency: 'daily'
  },
  {
    _id: 'biomarker_mood',
    name: 'Mood',
    description: 'Overall emotional state and stability',
    type: 'numeric',
    units: 'scale 1-10',
    normalRange: '7-10',
    trackingFrequency: 'daily'
  },
  {
    _id: 'biomarker_weight',
    name: 'Weight',
    description: 'Body weight measurement',
    type: 'numeric',
    units: 'lbs or kg',
    trackingFrequency: 'weekly'
  },
  {
    _id: 'biomarker_bowel_movements',
    name: 'Bowel Movements',
    description: 'Number of daily bowel movements',
    type: 'numeric',
    units: 'count',
    normalRange: '1-3',
    trackingFrequency: 'daily'
  },
  {
    _id: 'biomarker_water_intake',
    name: 'Water Intake',
    description: 'Amount of water consumed daily',
    type: 'numeric',
    units: 'oz or ml',
    normalRange: '64-100 oz',
    trackingFrequency: 'daily'
  }
];
