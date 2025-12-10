// Test fixtures for user data
import { addDays } from 'date-fns';

const TODAY = new Date();

export const userFixtures = {
  newUser: {
    _id: 'user_new',
    name: 'New Test User',
    email: 'new@example.com',
    password: 'Password123!',
    currentPhase: 0, // No phase set yet (pre-setup)
    programStartDate: null,
    setupCompleted: false,
    createdAt: new Date(TODAY),
    updatedAt: new Date(TODAY)
  },
  setupCompletedUser: {
    _id: 'user_setup_completed',
    name: 'Setup Completed User',
    email: 'setup@example.com',
    password: 'Password123!',
    currentPhase: 1,
    programStartDate: addDays(TODAY, 2), // Starting in 2 days
    setupCompleted: true,
    selectedProducts: ['prod_liver_sauce', 'prod_push_catch', 'prod_quinton'],
    selectedBiomarkers: ['biomarker_energy', 'biomarker_sleep', 'biomarker_detox', 'biomarker_digestion'],
    dashboardPreferences: {
      showPhaseProgress: true,
      showProductReminders: true,
      showBiomarkerCharts: true,
      primaryWidgets: ['phase-progress', 'daily-protocol', 'biomarker-trends']
    },
    createdAt: new Date(TODAY),
    updatedAt: new Date(TODAY)
  },
  phase2User: {
    _id: 'user_phase2',
    name: 'Phase 2 User',
    email: 'phase2@example.com',
    password: 'Password123!',
    currentPhase: 2,
    programStartDate: addDays(TODAY, -35), // Started 35 days ago
    setupCompleted: true,
    selectedProducts: ['prod_push_catch', 'prod_quinton', 'prod_glutathione', 'prod_methyl_b12'],
    selectedBiomarkers: ['biomarker_energy', 'biomarker_sleep', 'biomarker_detox', 'biomarker_digestion', 'biomarker_bowel_movements'],
    dashboardPreferences: {
      showPhaseProgress: true,
      showProductReminders: true,
      showBiomarkerCharts: true,
      primaryWidgets: ['phase-progress', 'daily-protocol', 'biomarker-trends', 'modality-schedule']
    },
    createdAt: addDays(TODAY, -70),
    updatedAt: addDays(TODAY, -2)
  },
  phase4User: {
    _id: 'user_phase4',
    name: 'Advanced User',
    email: 'advanced@example.com',
    password: 'Password123!',
    currentPhase: 4,
    programStartDate: addDays(TODAY, -150), // Started 150 days ago
    setupCompleted: true,
    selectedProducts: ['prod_nad_platinum', 'prod_quinton', 'prod_glutathione', 'prod_methyl_b12', 'prod_lipoic_acid', 'prod_dhq'],
    selectedBiomarkers: ['biomarker_energy', 'biomarker_sleep', 'biomarker_mental_clarity', 'biomarker_mood', 'biomarker_inflammation'],
    dashboardPreferences: {
      showPhaseProgress: true,
      showProductReminders: true,
      showBiomarkerCharts: true,
      showModalityTracker: true,
      primaryWidgets: ['phase-progress', 'biomarker-trends', 'modality-schedule', 'product-adherence']
    },
    createdAt: addDays(TODAY, -180),
    updatedAt: addDays(TODAY, -5)
  }
};

// User biomarker data (for testing charts and progress)
export const userBiomarkerDataFixtures = {
  userId: 'user_phase2',
  data: [
    // Last 7 days of data (most recent first)
    {
      date: TODAY,
      biomarkers: {
        'biomarker_energy': 8,
        'biomarker_sleep': 7,
        'biomarker_detox': 9,
        'biomarker_digestion': 8,
        'biomarker_bowel_movements': 2
      }
    },
    {
      date: addDays(TODAY, -1),
      biomarkers: {
        'biomarker_energy': 7,
        'biomarker_sleep': 8,
        'biomarker_detox': 8,
        'biomarker_digestion': 7,
        'biomarker_bowel_movements': 2
      }
    },
    {
      date: addDays(TODAY, -2),
      biomarkers: {
        'biomarker_energy': 6,
        'biomarker_sleep': 7,
        'biomarker_detox': 7,
        'biomarker_digestion': 6,
        'biomarker_bowel_movements': 1
      }
    },
    {
      date: addDays(TODAY, -3),
      biomarkers: {
        'biomarker_energy': 6,
        'biomarker_sleep': 6,
        'biomarker_detox': 5,
        'biomarker_digestion': 5,
        'biomarker_bowel_movements': 1
      }
    },
    {
      date: addDays(TODAY, -4),
      biomarkers: {
        'biomarker_energy': 5,
        'biomarker_sleep': 5,
        'biomarker_detox': 4,
        'biomarker_digestion': 4,
        'biomarker_bowel_movements': 1
      }
    },
    {
      date: addDays(TODAY, -5),
      biomarkers: {
        'biomarker_energy': 4,
        'biomarker_sleep': 6,
        'biomarker_detox': 3,
        'biomarker_digestion': 4,
        'biomarker_bowel_movements': 1
      }
    },
    {
      date: addDays(TODAY, -6),
      biomarkers: {
        'biomarker_energy': 3,
        'biomarker_sleep': 5,
        'biomarker_detox': 2,
        'biomarker_digestion': 3,
        'biomarker_bowel_movements': 1
      }
    }
  ]
};
