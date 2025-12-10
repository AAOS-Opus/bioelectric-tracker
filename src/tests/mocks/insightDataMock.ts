// Mock insight data for testing narrative generation and display
export const mockInsightData = {
  sampleNarratives: [
    {
      id: 'narr_001',
      title: 'Your recovery progress is accelerating',
      content: 'Your sleep quality and energy metrics show marked improvement over the past 2 weeks, indicating accelerated recovery. This coincides with your increased consistency in Spooky Scalar sessions.',
      confidenceLevel: 0.89,
      relatedMetrics: ['sleep_quality', 'energy_level', 'modality_sessions'],
      type: 'progress'
    },
    {
      id: 'narr_002',
      title: 'Consider adjusting supplement timing',
      content: 'Your morning zinc supplementation may be affecting absorption. Data shows better results when taken with evening meals.',
      confidenceLevel: 0.76,
      relatedMetrics: ['supplement_compliance', 'digestion_quality'],
      type: 'suggestion'
    },
    {
      id: 'narr_003',
      title: 'Potential inflammation trigger identified',
      content: 'There appears to be a correlation between dairy consumption and increased inflammation markers. Consider reducing dairy for 1 week as a test.',
      confidenceLevel: 0.67,
      relatedMetrics: ['inflammation_markers', 'food_journal'],
      type: 'insight'
    }
  ],

  sampleSummary: 'Overall, your health metrics show positive progress with notable improvements in sleep quality and energy levels. Your consistency with modalities is paying off.',

  sampleMilestones: [
    {
      id: 'mile_001',
      title: 'Longest streak of Scalar sessions',
      description: 'You\'ve completed 14 consecutive days of Scalar sessions - your longest streak so far!',
      date: '2025-03-15',
      type: 'streak',
      value: 14,
      previousBest: 10
    },
    {
      id: 'mile_002',
      title: 'Energy levels breakthrough',
      description: 'Your energy level metrics have improved 25% over the past month.',
      date: '2025-03-10',
      type: 'improvement',
      percentImprovement: 25,
      metric: 'energy_level'
    },
    {
      id: 'mile_003',
      title: 'Phase 2 completed',
      description: 'You\'ve successfully completed all objectives for Phase 2.',
      date: '2025-03-01',
      type: 'phase_completion',
      phaseNumber: 2
    }
  ],

  sampleBenchmarks: {
    'sleep_quality': {
      population_mean: 0.68,
      population_p90: 0.85,
      population_p75: 0.76,
      population_p50: 0.67,
      population_p25: 0.55,
      population_p10: 0.45,
      user_value: 0.72,
      user_percentile: 62
    },
    'energy_level': {
      population_mean: 0.65,
      population_p90: 0.88,
      population_p75: 0.78,
      population_p50: 0.65,
      population_p25: 0.52,
      population_p10: 0.42,
      user_value: 0.81,
      user_percentile: 85
    },
    'digestion_quality': {
      population_mean: 0.70,
      population_p90: 0.90,
      population_p75: 0.82,
      population_p50: 0.71,
      population_p25: 0.60,
      population_p10: 0.50,
      user_value: 0.78,
      user_percentile: 68
    },
    'mental_clarity': {
      population_mean: 0.62,
      population_p90: 0.85,
      population_p75: 0.75,
      population_p50: 0.63,
      population_p25: 0.50,
      population_p10: 0.40,
      user_value: 0.72,
      user_percentile: 70
    }
  },

  cohortInfo: {
    size: 5240,
    filter_criteria: {
      age_range: [30, 50],
      phase: 2
    }
  }
};
