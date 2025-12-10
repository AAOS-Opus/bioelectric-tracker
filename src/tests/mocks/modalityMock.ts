// Mock modality data for testing the regeneration metrics system
import { Types } from 'mongoose';

export const mockModalities = {
  basicModalities: [
    {
      _id: 'mod001',
      name: 'Spooky Scalar',
      description: 'Scalar energy device that helps detoxify and clear parasites',
      category: 'Frequency',
      recommendedFrequency: 'Daily',
      recommendedDuration: 30, // in minutes
      recommendedIntensity: 'medium',
      supportedPrograms: ['Detox', 'Parasites', 'Immune', 'Bioresonance'],
      instructions: 'Place the device within 3 feet of your body while using',
      contraindications: ['Pregnancy', 'Pacemaker'],
      benefits: ['Cellular detoxification', 'Parasite elimination', 'Energy improvement'],
      icon: 'scalar-icon'
    },
    {
      _id: 'mod002',
      name: 'MWO',
      description: 'Multi-Wave Oscillator for cellular rejuvenation',
      category: 'Frequency',
      recommendedFrequency: 'Daily',
      recommendedDuration: 30,
      recommendedIntensity: 'high',
      supportedPrograms: ['Rejuvenation', 'Energy', 'Sleep'],
      instructions: 'Sit in front of the device at a distance of 3-5 feet',
      contraindications: ['Pregnancy', 'Pacemaker', 'Electronic implants'],
      benefits: ['Cellular oxygenation', 'Improved circulation', 'Enhanced mitochondrial function'],
      icon: 'mwo-icon'
    },
    {
      _id: 'mod003',
      name: 'PEMF',
      description: 'Pulsed Electromagnetic Field therapy for cellular health',
      category: 'Electromagnetic',
      recommendedFrequency: '3-4 times weekly',
      recommendedDuration: 20,
      recommendedIntensity: 'low',
      supportedPrograms: ['Relaxation', 'Pain Relief', 'Inflammation'],
      instructions: 'Place the mat on your bed or floor and lie on it',
      contraindications: ['Pregnancy', 'Pacemaker', 'Electronic implants'],
      benefits: ['Reduced inflammation', 'Pain relief', 'Improved circulation'],
      icon: 'pemf-icon'
    },
    {
      _id: 'mod004',
      name: 'Red Light Therapy',
      description: 'Near-infrared and red light for cellular regeneration',
      category: 'Light',
      recommendedFrequency: 'Daily',
      recommendedDuration: 15,
      recommendedIntensity: 'medium',
      supportedPrograms: ['Skin Health', 'Collagen Production', 'Cellular Energy'],
      instructions: 'Position the device 6-12 inches from target area',
      contraindications: ['Photosensitivity', 'Certain medications'],
      benefits: ['Improved collagen production', 'Enhanced cellular energy', 'Reduced inflammation'],
      icon: 'red-light-icon'
    },
    {
      _id: 'mod005',
      name: 'Sauna',
      description: 'Infrared sauna for detoxification and relaxation',
      category: 'Heat',
      recommendedFrequency: '2-3 times weekly',
      recommendedDuration: 25,
      recommendedIntensity: 'medium',
      supportedPrograms: ['Detox', 'Relaxation', 'Circulation'],
      instructions: 'Start with shorter sessions and increase gradually',
      contraindications: ['Cardiovascular conditions', 'Pregnancy', 'Certain medications'],
      benefits: ['Detoxification', 'Improved circulation', 'Stress reduction'],
      icon: 'sauna-icon'
    }
  ],
  
  modalityCategories: [
    {
      name: 'Frequency',
      description: 'Devices that use specific frequencies to target various health conditions',
      modalities: ['Spooky Scalar', 'MWO', 'Rife Machine']
    },
    {
      name: 'Electromagnetic',
      description: 'Therapies utilizing electromagnetic fields to improve cellular function',
      modalities: ['PEMF', 'Magnetic Therapy']
    },
    {
      name: 'Light',
      description: 'Treatments using specific light wavelengths for therapeutic effects',
      modalities: ['Red Light Therapy', 'Blue Light Therapy', 'Laser Therapy']
    },
    {
      name: 'Heat',
      description: 'Therapies that use heat for detoxification and relaxation',
      modalities: ['Sauna', 'Hot Stone Therapy', 'Heat Packs']
    },
    {
      name: 'Sound',
      description: 'Treatments using sound waves for therapeutic effects',
      modalities: ['Sound Therapy', 'Binaural Beats', 'Singing Bowls']
    }
  ],
  
  recommendedModalitiesByPhase: {
    phase1: ['Spooky Scalar', 'PEMF', 'Sauna'],
    phase2: ['Spooky Scalar', 'MWO', 'Red Light Therapy', 'Sauna'],
    phase3: ['Spooky Scalar', 'MWO', 'PEMF', 'Red Light Therapy'],
    phase4: ['MWO', 'Red Light Therapy', 'PEMF']
  },
  
  modalityEffectiveness: [
    { modalityName: 'Spooky Scalar', userRating: 4.7, clinicalEvidence: 'Moderate', popularity: 'High' },
    { modalityName: 'MWO', userRating: 4.5, clinicalEvidence: 'Limited', popularity: 'Medium' },
    { modalityName: 'PEMF', userRating: 4.2, clinicalEvidence: 'Strong', popularity: 'High' },
    { modalityName: 'Red Light Therapy', userRating: 4.4, clinicalEvidence: 'Strong', popularity: 'High' },
    { modalityName: 'Sauna', userRating: 4.6, clinicalEvidence: 'Strong', popularity: 'High' }
  ]
};
