/**
 * Weekly Metrics Calculation Utilities
 * 
 * This module provides utility functions for aggregating and calculating weekly metrics
 * from various data sources in the Bioelectric Regeneration Tracker application.
 */

import { startOfWeek, endOfWeek, isWithinInterval, format, addDays, isSameDay } from 'date-fns';

// Types
export interface WeeklySnapshot {
  weekId: string;              // Unique identifier for the week (e.g., "2025-W12")
  startDate: string;           // Start date of the week (ISO string)
  endDate: string;             // End date of the week (ISO string)
  phaseNumber: number;         // Current phase number during this week
  phaseName: string;           // Name of the phase during this week
  isComplete: boolean;         // Whether the week is complete or in progress
  productUsage: {
    adherenceRate: number;     // Percentage of prescribed products taken
    totalProducts: number;     // Total number of product doses taken
    missedProducts: number;    // Number of prescribed products missed
    streakDays: number;        // Consecutive days with 100% product adherence
  };
  modalitySessions: {
    adherenceRate: number;     // Percentage of recommended modality sessions completed
    totalSessions: number;     // Total number of modality sessions
    totalMinutes: number;      // Total minutes spent in modality sessions
    byModality: Array<{       
      modalityName: string;    // Name of the modality
      sessions: number;        // Number of sessions for this modality
      minutes: number;         // Total minutes for this modality
      adherenceRate: number;   // Adherence rate for this specific modality
    }>;
  };
  wellness: {
    energyLevel: number;       // Average energy level for the week (1-10)
    sleepQuality: number;      // Average sleep quality for the week (1-10)
    painLevel: number;         // Average pain level for the week (1-10)
    mentalClarity: number;     // Average mental clarity for the week (1-10)
    detoxSymptoms: string[];   // List of detox symptoms experienced
    symptomSeverity: number;   // Average severity of symptoms (1-10)
  };
  biomarkers: {               // If biomarker data is available for the week
    available: boolean;        // Whether biomarker data is available
    markers: Array<{
      name: string;            // Name of the biomarker
      value: number;           // Value of the biomarker
      unit: string;            // Unit of measurement
      status: string;          // Status (normal, high, low)
      change: number;          // Change from previous measurement (%)
    }>;
  };
  healthScore: {
    overall: number;           // Overall health score (0-100)
    improvement: number;       // Improvement from previous week (%)
  };
}

export interface WeeklySnapshotOptions {
  weekStart: 0 | 1;            // 0 for Sunday, 1 for Monday
  timezone: string;            // User's timezone
}

const DEFAULT_OPTIONS: WeeklySnapshotOptions = {
  weekStart: 0,                // Default to Sunday
  timezone: 'America/New_York' // Default timezone
};

/**
 * Generates a weekly snapshot for a specific week
 * 
 * @param userId The user ID to generate the snapshot for
 * @param weekStartDate The start date of the week
 * @param options Configuration options for week calculation
 * @returns A promise that resolves to a WeeklySnapshot object
 */
export async function generateWeeklySnapshot(
  userId: string,
  weekStartDate: Date,
  options: Partial<WeeklySnapshotOptions> = {}
): Promise<WeeklySnapshot> {
  // Merge options with defaults
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Calculate week boundaries
  const startDate = startOfWeek(weekStartDate, { weekStartsOn: mergedOptions.weekStart });
  const endDate = endOfWeek(weekStartDate, { weekStartsOn: mergedOptions.weekStart });
  
  // Format dates for display and create week identifier
  const weekId = `${format(startDate, 'yyyy')}-W${format(startDate, 'ww')}`;
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();
  
  // Check if the week is complete (end date is in the past)
  const isComplete = endDate < new Date();
  
  // TODO: Fetch actual data from the database
  // For now, we'll return a placeholder snapshot with sample calculations
  return {
    weekId,
    startDate: startDateStr,
    endDate: endDateStr,
    phaseNumber: 0, // Will be populated with actual data
    phaseName: '', // Will be populated with actual data
    isComplete,
    productUsage: {
      adherenceRate: 0,
      totalProducts: 0,
      missedProducts: 0,
      streakDays: 0
    },
    modalitySessions: {
      adherenceRate: 0,
      totalSessions: 0,
      totalMinutes: 0,
      byModality: []
    },
    wellness: {
      energyLevel: 0,
      sleepQuality: 0,
      painLevel: 0,
      mentalClarity: 0,
      detoxSymptoms: [],
      symptomSeverity: 0
    },
    biomarkers: {
      available: false,
      markers: []
    },
    healthScore: {
      overall: 0,
      improvement: 0
    }
  };
}

/**
 * Aggregates product usage data for a specific week
 * 
 * @param userId The user ID to aggregate data for
 * @param startDate The start date of the week
 * @param endDate The end date of the week
 * @returns Product usage statistics for the week
 */
export async function aggregateProductUsage(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  // TODO: Implement actual data fetching and aggregation
  // This will query the ProductUsage collection and calculate adherence metrics
  
  return {
    adherenceRate: 85, // Example value
    totalProducts: 42, // Example value
    missedProducts: 7, // Example value
    streakDays: 5 // Example value
  };
}

/**
 * Aggregates modality session data for a specific week
 * 
 * @param userId The user ID to aggregate data for
 * @param startDate The start date of the week
 * @param endDate The end date of the week
 * @returns Modality session statistics for the week
 */
export async function aggregateModalitySessions(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  // TODO: Implement actual data fetching and aggregation
  // This will query the ModalitySession collection and calculate session metrics
  
  return {
    adherenceRate: 80, // Example value
    totalSessions: 10, // Example value
    totalMinutes: 300, // Example value
    byModality: [
      {
        modalityName: 'Spooky Scalar',
        sessions: 5,
        minutes: 150,
        adherenceRate: 85
      },
      {
        modalityName: 'MWO',
        sessions: 3,
        minutes: 90,
        adherenceRate: 75
      },
      {
        modalityName: 'PEMF',
        sessions: 2,
        minutes: 60,
        adherenceRate: 70
      }
    ]
  };
}

/**
 * Aggregates wellness data for a specific week
 * 
 * @param userId The user ID to aggregate data for
 * @param startDate The start date of the week
 * @param endDate The end date of the week
 * @returns Wellness statistics for the week
 */
export async function aggregateWellnessData(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  // TODO: Implement actual data fetching and aggregation
  // This will query the ProgressNote collection and calculate wellness metrics
  
  return {
    energyLevel: 7.5, // Example value
    sleepQuality: 8.0, // Example value
    painLevel: 3.5, // Example value
    mentalClarity: 7.0, // Example value
    detoxSymptoms: ['Mild headache', 'Fatigue'], // Example values
    symptomSeverity: 4.0 // Example value
  };
}

/**
 * Aggregates biomarker data for a specific week
 * 
 * @param userId The user ID to aggregate data for
 * @param startDate The start date of the week
 * @param endDate The end date of the week
 * @returns Biomarker statistics for the week, if available
 */
export async function aggregateBiomarkerData(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  // TODO: Implement actual data fetching and aggregation
  // This will query the lab test results and calculate biomarker changes
  
  // Check if there's any biomarker data for this week
  const hasBiomarkerData = Math.random() > 0.5; // Example check
  
  if (!hasBiomarkerData) {
    return {
      available: false,
      markers: []
    };
  }
  
  return {
    available: true,
    markers: [
      {
        name: 'ALT',
        value: 35,
        unit: 'U/L',
        status: 'normal',
        change: -10.5
      },
      {
        name: 'AST',
        value: 30,
        unit: 'U/L',
        status: 'normal',
        change: -5.2
      },
      {
        name: 'CRP',
        value: 2.1,
        unit: 'mg/L',
        status: 'normal',
        change: -15.0
      }
    ]
  };
}

/**
 * Calculate health score for a specific week
 * 
 * @param userId The user ID to calculate score for
 * @param weekData Aggregated week data to base the score on
 * @param previousWeekScore Score from the previous week, if available
 * @returns Health score and improvement percentage
 */
export function calculateHealthScore(
  productUsage: any,
  modalitySessions: any,
  wellness: any,
  biomarkers: any,
  previousWeekScore?: number
) {
  // This is a simplified scoring algorithm
  // A real implementation would have a more sophisticated approach
  
  // Base score components
  const productComponent = productUsage.adherenceRate * 0.30; // 30% weight
  const modalityComponent = modalitySessions.adherenceRate * 0.30; // 30% weight
  
  // Wellness component (average of normalized values)
  const energyNormalized = wellness.energyLevel * 10; // Scale to 0-100
  const sleepNormalized = wellness.sleepQuality * 10; // Scale to 0-100
  const painNormalized = (10 - wellness.painLevel) * 10; // Invert and scale to 0-100
  const clarityNormalized = wellness.mentalClarity * 10; // Scale to 0-100
  
  const wellnessComponent = (
    (energyNormalized + sleepNormalized + painNormalized + clarityNormalized) / 4
  ) * 0.40; // 40% weight
  
  // Calculate overall score
  const overallScore = Math.round(productComponent + modalityComponent + wellnessComponent);
  
  // Calculate improvement if previous score available
  let improvement = 0;
  if (previousWeekScore !== undefined && previousWeekScore > 0) {
    improvement = ((overallScore - previousWeekScore) / previousWeekScore) * 100;
  }
  
  return {
    overall: overallScore,
    improvement: Number(improvement.toFixed(1))
  };
}

/**
 * Fetches weekly snapshots for a date range
 * 
 * @param userId The user ID to fetch snapshots for
 * @param startDate The start date of the range
 * @param endDate The end date of the range
 * @param options Configuration options for week calculation
 * @returns A promise that resolves to an array of WeeklySnapshot objects
 */
export async function fetchWeeklySnapshots(
  userId: string,
  startDate: Date,
  endDate: Date,
  options: Partial<WeeklySnapshotOptions> = {}
): Promise<WeeklySnapshot[]> {
  // Merge options with defaults
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Calculate the first week start date within the range
  let currentDate = startOfWeek(startDate, { weekStartsOn: mergedOptions.weekStart });
  
  // Generate snapshots for each week in the range
  const snapshots: WeeklySnapshot[] = [];
  let previousWeekScore: number | undefined = undefined;
  
  while (currentDate <= endDate) {
    const snapshot = await generateWeeklySnapshot(userId, currentDate, mergedOptions);
    
    // Calculate health score with reference to previous week
    if (previousWeekScore !== undefined) {
      snapshot.healthScore.improvement = ((snapshot.healthScore.overall - previousWeekScore) / previousWeekScore) * 100;
    }
    
    snapshots.push(snapshot);
    previousWeekScore = snapshot.healthScore.overall;
    
    // Move to next week
    currentDate = addDays(currentDate, 7);
  }
  
  return snapshots;
}

/**
 * Calculates the week number for a given date
 * 
 * @param date The date to calculate the week number for
 * @param options Configuration options for week calculation
 * @returns The week number as a string (e.g., "2025-W12")
 */
export function getWeekNumber(
  date: Date,
  options: Partial<WeeklySnapshotOptions> = {}
): string {
  // Merge options with defaults
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Calculate week start and format week number
  const weekStart = startOfWeek(date, { weekStartsOn: mergedOptions.weekStart });
  return `${format(weekStart, 'yyyy')}-W${format(weekStart, 'ww')}`;
}

/**
 * Determines if a user was in a phase transition during a specific week
 * 
 * @param userId The user ID to check
 * @param weekStartDate The start date of the week
 * @param weekEndDate The end date of the week
 * @returns A promise that resolves to a boolean indicating if a phase transition occurred
 */
export async function hadPhaseTransition(
  userId: string,
  weekStartDate: Date,
  weekEndDate: Date
): Promise<boolean> {
  // TODO: Implement actual data fetching and transition detection
  // This will query the Phase collection and check if a transition occurred
  
  return false; // Example return value
}

/**
 * Calculates streak days for product adherence
 * 
 * @param userId The user ID to calculate streak for
 * @param endDate The end date to calculate streak up to
 * @returns A promise that resolves to the number of consecutive streak days
 */
export async function calculateProductAdherenceStreak(
  userId: string,
  endDate: Date
): Promise<number> {
  // TODO: Implement actual streak calculation
  // This will query the ProductUsage collection and calculate streak days
  
  return 7; // Example return value
}
