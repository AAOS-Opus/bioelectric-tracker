/**
 * InsightEngine Module
 *
 * Analyzes recent user behavior and generates up to 3 personalized,
 * data-driven insights that feel useful, relevant, and emotionally resonant.
 *
 * This is not a report. It's a reflection ritual.
 * It's not "You did X." It's "Here's what you're becoming."
 */

import { format, parseISO, differenceInDays, isAfter, isBefore } from 'date-fns';

// Input data types
export interface ProductUsageEntry {
  date: string;
  productId: string;
  productName?: string;
  completed: boolean;
  timeLogged?: string;
}

export interface ModalitySession {
  type: string;
  date: string;
  duration: number; // in minutes
  notes?: string;
}

export interface ProgressNote {
  date: string;
  biomarkers: Record<string, number>;
  notes?: string;
}

export interface UserPreferences {
  wakeTime?: string;
  sleepTime?: string;
  timezone?: string;
}

export interface InsightEngineInput {
  productUsageHistory: ProductUsageEntry[];
  modalitySessions: ModalitySession[];
  progressNotes: ProgressNote[];
  userPreferences?: UserPreferences;
}

// Output types
export interface Insight {
  icon: string;
  title: string;
  message: string;
  suggestion: string;
  type: 'product-consistency' | 'energy-modality' | 'sleep-protocol' | 'mood-variability' | 'improvement-trend' | 'routine-drift';
  confidence: number; // 0-1 score for prioritization
  dataPoints?: number; // How many data points this insight is based on
}

export interface InsightReport {
  userId: string;
  insights: Insight[];
  generatedAt: string;
  analysisWindow: {
    start: string;
    end: string;
    daysAnalyzed: number;
  };
}

/**
 * Main InsightEngine class
 */
export class InsightEngine {
  private data: InsightEngineInput;
  private analysisWindow: { start: Date; end: Date };

  constructor(data: InsightEngineInput, windowDays: number = 14) {
    this.data = data;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - windowDays);

    this.analysisWindow = {
      start: startDate,
      end: endDate
    };
  }

  /**
   * Generate personalized insights
   */
  generateInsights(userId: string): InsightReport {
    const insights: Insight[] = [];

    // Generate all possible insights
    const productConsistency = this.analyzeProductConsistency();
    const energyModality = this.analyzeEnergyAfterModality();
    const sleepProtocol = this.analyzeSleepAndMorningProtocol();
    const moodVariability = this.analyzeMoodVariability();
    const improvementTrend = this.analyzeImprovementTrend();
    const routineDrift = this.analyzeRoutineDrift();

    // Collect valid insights
    [productConsistency, energyModality, sleepProtocol, moodVariability, improvementTrend, routineDrift]
      .filter(insight => insight !== null)
      .forEach(insight => insights.push(insight as Insight));

    // Prioritize and select top 3
    const prioritizedInsights = this.prioritizeInsights(insights);
    const selectedInsights = prioritizedInsights.slice(0, 3);

    return {
      userId,
      insights: selectedInsights,
      generatedAt: new Date().toISOString(),
      analysisWindow: {
        start: this.analysisWindow.start.toISOString(),
        end: this.analysisWindow.end.toISOString(),
        daysAnalyzed: differenceInDays(this.analysisWindow.end, this.analysisWindow.start)
      }
    };
  }

  /**
   * Analyze product consistency between weekdays and weekends
   */
  private analyzeProductConsistency(): Insight | null {
    const usageInWindow = this.data.productUsageHistory.filter(entry =>
      this.isInAnalysisWindow(parseISO(entry.date))
    );

    if (usageInWindow.length < 7) return null; // Need at least a week of data

    const weekdayEntries = usageInWindow.filter(entry => {
      const day = parseISO(entry.date).getDay();
      return day >= 1 && day <= 5; // Monday to Friday
    });

    const weekendEntries = usageInWindow.filter(entry => {
      const day = parseISO(entry.date).getDay();
      return day === 0 || day === 6; // Saturday and Sunday
    });

    if (weekdayEntries.length < 5 || weekendEntries.length < 2) return null;

    const weekdayCompletionRate = weekdayEntries.filter(e => e.completed).length / weekdayEntries.length;
    const weekendCompletionRate = weekendEntries.filter(e => e.completed).length / weekendEntries.length;

    const consistencyDiff = Math.abs(weekdayCompletionRate - weekendCompletionRate);

    if (consistencyDiff > 0.3) { // 30% difference
      const isWeekdayBetter = weekdayCompletionRate > weekendCompletionRate;

      return {
        icon: '📦',
        title: isWeekdayBetter ? 'Weekend Protocol Opportunity' : 'Weekday Routine Strength',
        message: isWeekdayBetter
          ? `Your weekday supplement consistency is ${Math.round(weekdayCompletionRate * 100)}% vs ${Math.round(weekendCompletionRate * 100)}% on weekends. Your body doesn't take weekends off from healing.`
          : `Your weekend consistency shines at ${Math.round(weekendCompletionRate * 100)}% vs ${Math.round(weekdayCompletionRate * 100)}% on weekdays. You've found your rhythm when life slows down.`,
        suggestion: isWeekdayBetter
          ? 'Set weekend reminders or pre-organize supplements on Friday evening.'
          : 'Apply your weekend mindfulness to weekday routines. Consider morning rituals that mirror weekend calm.',
        type: 'product-consistency',
        confidence: Math.min(consistencyDiff * 2, 1),
        dataPoints: usageInWindow.length
      };
    }

    return null;
  }

  /**
   * Analyze energy levels after scalar sessions
   */
  private analyzeEnergyAfterModality(): Insight | null {
    const modalitiesInWindow = this.data.modalitySessions.filter(session =>
      this.isInAnalysisWindow(parseISO(session.date))
    );

    const scalarSessions = modalitiesInWindow.filter(session =>
      session.type.toLowerCase().includes('scalar')
    );

    if (scalarSessions.length < 3) return null; // Need at least 3 sessions

    const energyCorrelations: Array<{ sessionDate: string; nextDayEnergy: number }> = [];

    scalarSessions.forEach(session => {
      const nextDay = new Date(parseISO(session.date));
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = format(nextDay, 'yyyy-MM-dd');

      const nextDayNote = this.data.progressNotes.find(note =>
        note.date === nextDayStr && note.biomarkers.Energy !== undefined
      );

      if (nextDayNote) {
        energyCorrelations.push({
          sessionDate: session.date,
          nextDayEnergy: nextDayNote.biomarkers.Energy
        });
      }
    });

    if (energyCorrelations.length < 3) return null;

    const avgEnergyAfterScalar = energyCorrelations.reduce((sum, corr) => sum + corr.nextDayEnergy, 0) / energyCorrelations.length;

    // Compare to overall energy average
    const allEnergyScores = this.data.progressNotes
      .filter(note => note.biomarkers.Energy !== undefined)
      .map(note => note.biomarkers.Energy);

    if (allEnergyScores.length < 5) return null;

    const overallAvgEnergy = allEnergyScores.reduce((sum, score) => sum + score, 0) / allEnergyScores.length;
    const energyIncrease = avgEnergyAfterScalar - overallAvgEnergy;

    if (energyIncrease > 0.5) { // Meaningful increase
      return {
        icon: '⚡️',
        title: 'Scalar Sessions Energize You',
        message: `Your Energy scores average ${avgEnergyAfterScalar.toFixed(1)} the day after Scalar sessions, compared to your usual ${overallAvgEnergy.toFixed(1)}. Your cells are responding to the frequency healing.`,
        suggestion: 'Consider scheduling Scalar sessions before demanding days or when you feel energy depletion coming.',
        type: 'energy-modality',
        confidence: Math.min(energyIncrease / 2, 1),
        dataPoints: energyCorrelations.length
      };
    }

    return null;
  }

  /**
   * Analyze correlation between early morning protocol and sleep
   */
  private analyzeSleepAndMorningProtocol(): Insight | null {
    const earlyProductEntries = this.data.productUsageHistory.filter(entry => {
      if (!entry.timeLogged) return false;
      const logTime = entry.timeLogged.split(':');
      const hour = parseInt(logTime[0]);
      return hour < 10 && this.isInAnalysisWindow(parseISO(entry.date));
    });

    if (earlyProductEntries.length < 5) return null;

    const sleepCorrelations: Array<{ date: string; sleepScore: number; hadEarlyProtocol: boolean }> = [];

    this.data.progressNotes.forEach(note => {
      if (note.biomarkers.Sleep === undefined) return;

      const hadEarlyProtocol = earlyProductEntries.some(entry => entry.date === note.date);
      sleepCorrelations.push({
        date: note.date,
        sleepScore: note.biomarkers.Sleep,
        hadEarlyProtocol
      });
    });

    if (sleepCorrelations.length < 7) return null;

    const sleepWithEarlyProtocol = sleepCorrelations.filter(c => c.hadEarlyProtocol);
    const sleepWithoutEarlyProtocol = sleepCorrelations.filter(c => !c.hadEarlyProtocol);

    if (sleepWithEarlyProtocol.length < 3 || sleepWithoutEarlyProtocol.length < 3) return null;

    const avgSleepWithEarly = sleepWithEarlyProtocol.reduce((sum, c) => sum + c.sleepScore, 0) / sleepWithEarlyProtocol.length;
    const avgSleepWithoutEarly = sleepWithoutEarlyProtocol.reduce((sum, c) => sum + c.sleepScore, 0) / sleepWithoutEarlyProtocol.length;

    const sleepImprovement = avgSleepWithEarly - avgSleepWithoutEarly;

    if (sleepImprovement > 0.5) {
      return {
        icon: '🌙',
        title: 'Morning Rituals Improve Sleep',
        message: `Your Sleep quality averages ${avgSleepWithEarly.toFixed(1)} on days when you log supplements before 10am, vs ${avgSleepWithoutEarly.toFixed(1)} otherwise. Morning consistency creates evening peace.`,
        suggestion: 'Establish a morning supplement ritual. Your circadian rhythm thrives on predictable morning signals.',
        type: 'sleep-protocol',
        confidence: Math.min(sleepImprovement / 2, 1),
        dataPoints: sleepCorrelations.length
      };
    }

    return null;
  }

  /**
   * Analyze mood variability over the past week
   */
  private analyzeMoodVariability(): Insight | null {
    const recentNotes = this.data.progressNotes.filter(note =>
      note.biomarkers.Mood !== undefined &&
      this.isInAnalysisWindow(parseISO(note.date), 7) // Last 7 days only
    );

    if (recentNotes.length < 5) return null;

    const moodScores = recentNotes.map(note => note.biomarkers.Mood);
    const avgMood = moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length;

    // Calculate standard deviation
    const variance = moodScores.reduce((sum, score) => sum + Math.pow(score - avgMood, 2), 0) / moodScores.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev > 2) { // High variability
      const minMood = Math.min(...moodScores);
      const maxMood = Math.max(...moodScores);

      return {
        icon: '📉',
        title: 'Mood Waves This Week',
        message: `Your Mood has ranged from ${minMood} to ${maxMood} this week. These emotional tides are part of deep healing - your nervous system is recalibrating.`,
        suggestion: 'Focus on grounding practices during dips. Consider adding magnesium or adaptogens to smooth the emotional waves.',
        type: 'mood-variability',
        confidence: Math.min(stdDev / 3, 1),
        dataPoints: moodScores.length
      };
    }

    return null;
  }

  /**
   * Analyze improvement trends across multiple biomarkers
   */
  private analyzeImprovementTrend(): Insight | null {
    const biomarkerTypes = ['Energy', 'Sleep', 'Digestion', 'Mood', 'Focus', 'Hydration'];
    const improvingBiomarkers: Array<{ biomarker: string; improvement: number }> = [];

    biomarkerTypes.forEach(biomarker => {
      const recentScores = this.data.progressNotes
        .filter(note => note.biomarkers[biomarker] !== undefined)
        .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
        .slice(-14) // Last 2 weeks
        .map(note => note.biomarkers[biomarker]);

      if (recentScores.length < 7) return;

      const firstHalf = recentScores.slice(0, Math.floor(recentScores.length / 2));
      const secondHalf = recentScores.slice(-Math.floor(recentScores.length / 2));

      const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;

      const improvementPercent = ((secondAvg - firstAvg) / firstAvg) * 100;

      if (improvementPercent > 10) {
        improvingBiomarkers.push({
          biomarker,
          improvement: improvementPercent
        });
      }
    });

    if (improvingBiomarkers.length >= 3) {
      const topImprovement = improvingBiomarkers.sort((a, b) => b.improvement - a.improvement)[0];

      return {
        icon: '📈',
        title: 'Multi-System Upgrade',
        message: `${improvingBiomarkers.length} biomarkers are trending upward, led by ${topImprovement.biomarker} improving ${topImprovement.improvement.toFixed(0)}%. Your protocol is creating systemic change.`,
        suggestion: 'Stay the course. Consider documenting what\'s working to replicate this success pattern.',
        type: 'improvement-trend',
        confidence: Math.min(improvingBiomarkers.length / 5, 1),
        dataPoints: improvingBiomarkers.length
      };
    }

    return null;
  }

  /**
   * Analyze routine drift (increasing time between logs)
   */
  private analyzeRoutineDrift(): Insight | null {
    const usageInWindow = this.data.productUsageHistory
      .filter(entry => this.isInAnalysisWindow(parseISO(entry.date)))
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    if (usageInWindow.length < 10) return null;

    // Calculate time gaps between consecutive logs
    const gaps: number[] = [];
    for (let i = 1; i < usageInWindow.length; i++) {
      const prevDate = parseISO(usageInWindow[i - 1].date);
      const currDate = parseISO(usageInWindow[i].date);
      const daysDiff = differenceInDays(currDate, prevDate);
      gaps.push(daysDiff);
    }

    // Compare first half vs second half of gaps
    const firstHalfGaps = gaps.slice(0, Math.floor(gaps.length / 2));
    const secondHalfGaps = gaps.slice(-Math.floor(gaps.length / 2));

    const firstAvgGap = firstHalfGaps.reduce((sum, gap) => sum + gap, 0) / firstHalfGaps.length;
    const secondAvgGap = secondHalfGaps.reduce((sum, gap) => sum + gap, 0) / secondHalfGaps.length;

    const gapIncrease = secondAvgGap - firstAvgGap;

    if (gapIncrease > 0.5) { // Gaps are increasing
      return {
        icon: '🔄',
        title: 'Routine Drift Detected',
        message: `Time between supplement logs has increased from ${firstAvgGap.toFixed(1)} to ${secondAvgGap.toFixed(1)} days. Life is pulling you away from your healing rhythm.`,
        suggestion: 'Reset your routine anchor. Choose one non-negotiable daily moment to reconnect with your protocol.',
        type: 'routine-drift',
        confidence: Math.min(gapIncrease, 1),
        dataPoints: gaps.length
      };
    }

    return null;
  }

  /**
   * Prioritize insights based on confidence, actionability, and variety
   */
  private prioritizeInsights(insights: Insight[]): Insight[] {
    return insights
      .sort((a, b) => {
        // Higher confidence first
        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence;
        }
        // More data points second
        if (b.dataPoints !== a.dataPoints) {
          return (b.dataPoints || 0) - (a.dataPoints || 0);
        }
        // Slight randomization to avoid staleness
        return Math.random() - 0.5;
      });
  }

  /**
   * Check if a date is within the analysis window
   */
  private isInAnalysisWindow(date: Date, windowDays?: number): boolean {
    const window = windowDays ? {
      start: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000),
      end: new Date()
    } : this.analysisWindow;

    return isAfter(date, window.start) && isBefore(date, window.end);
  }
}

/**
 * Helper function to generate mock data for testing
 */
export function generateMockInsightData(): InsightEngineInput {
  const today = new Date();
  const mockData: InsightEngineInput = {
    productUsageHistory: [],
    modalitySessions: [],
    progressNotes: [],
    userPreferences: {
      wakeTime: '07:00',
      sleepTime: '22:30'
    }
  };

  // Generate 14 days of mock data
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = format(date, 'yyyy-MM-dd');

    // Product usage (with some weekend inconsistency)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const completionRate = isWeekend ? 0.6 : 0.9;

    if (Math.random() < completionRate) {
      mockData.productUsageHistory.push({
        date: dateStr,
        productId: 'liver-cleanse',
        productName: 'Liver Cleanse',
        completed: true,
        timeLogged: isWeekend ? '09:30' : '08:15'
      });
    }

    // Modality sessions (scalar every 3-4 days)
    if (i % 3 === 0) {
      mockData.modalitySessions.push({
        type: 'scalar',
        date: dateStr,
        duration: 30 + Math.random() * 30
      });
    }

    // Progress notes with varying biomarkers
    const energyBase = 6;
    const energyBoost = mockData.modalitySessions.some(s => s.date === dateStr) ? 1.5 : 0;

    mockData.progressNotes.push({
      date: dateStr,
      biomarkers: {
        Energy: Math.max(1, Math.min(10, energyBase + energyBoost + (Math.random() - 0.5) * 2)),
        Sleep: Math.max(1, Math.min(10, 6.5 + (Math.random() - 0.5) * 3)),
        Digestion: Math.max(1, Math.min(10, 7 + (Math.random() - 0.5) * 2)),
        Mood: Math.max(1, Math.min(10, 6.8 + (Math.random() - 0.5) * 4)), // Higher variability
        Focus: Math.max(1, Math.min(10, 6.2 + (Math.random() - 0.5) * 2)),
        Hydration: Math.max(1, Math.min(10, 7.5 + (Math.random() - 0.5) * 1.5))
      }
    });
  }

  return mockData;
}

/**
 * Main function to generate insights
 */
export async function generateUserInsights(
  userId: string,
  data: InsightEngineInput
): Promise<InsightReport> {
  const engine = new InsightEngine(data);
  return engine.generateInsights(userId);
}

/**
 * Generate insights with mock data (for testing)
 */
export async function generateMockInsights(userId: string = 'test-user'): Promise<InsightReport> {
  const mockData = generateMockInsightData();
  return generateUserInsights(userId, mockData);
}