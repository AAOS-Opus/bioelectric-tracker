import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InsightNarrativeEngine } from '@/lib/ai/insightNarrativeEngine';
import { InsightPanel } from '@/components/metrics/InsightPanel';
import { MetricsMilestonePanel } from '@/components/metrics/MetricsMilestonePanel';
import { PopulationBenchmarkChart } from '@/components/metrics/PopulationBenchmarkChart';
import { mockUserData } from '../mocks/userDataMock';
import { mockHealthTrends } from '../mocks/healthTrendsMock';
import { mockInsightData } from '../mocks/insightDataMock';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Mock Windsurf AI/Agency Swarm API endpoints
const server = setupServer(
  rest.post('/api/ai/insights/narratives', (req, res, ctx) => {
    return res(
      ctx.json({
        narratives: [
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
          }
        ],
        milestones: [
          {
            id: 'mile_001',
            title: 'Longest streak of Scalar sessions',
            description: 'You\'ve completed 14 consecutive days of Scalar sessions - your longest streak so far!',
            date: '2025-03-15',
            type: 'streak',
            value: 14,
            previousBest: 10
          }
        ],
        summary: 'Overall, your health metrics show positive progress with notable improvements in sleep quality and energy levels. Your consistency with modalities is paying off.',
        analysisTimestamp: new Date().toISOString()
      })
    );
  }),
  
  rest.get('/api/population/benchmarks', (req, res, ctx) => {
    return res(
      ctx.json({
        benchmarks: {
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
          }
        },
        cohort_info: {
          size: 5240,
          filter_criteria: {
            age_range: [30, 50],
            phase: 2
          }
        }
      })
    );
  })
);

// Start server before tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Contextual Insight Narratives', () => {
  
  describe('Narrative Generation', () => {
    test('generates insight narratives matching analytics findings', async () => {
      const engine = new InsightNarrativeEngine();
      
      // Generate narratives based on user metrics
      const insights = await engine.generateInsights(
        mockUserData.standardUser,
        mockHealthTrends.recentHealthData
      );
      
      // Should have at least one narrative
      expect(insights.narratives.length).toBeGreaterThan(0);
      
      // Narratives should be related to health data trends
      const sleepTrend = mockHealthTrends.recentHealthData.sleep_quality;
      const sleepImproving = sleepTrend[sleepTrend.length - 1].value > sleepTrend[0].value;
      
      if (sleepImproving) {
        // Should mention sleep improvement
        const sleepNarrative = insights.narratives.find(n => 
          n.relatedMetrics.includes('sleep_quality') && 
          n.content.toLowerCase().includes('improve')
        );
        expect(sleepNarrative).toBeTruthy();
      } else {
        // Should mention sleep decline or challenges
        const sleepNarrative = insights.narratives.find(n => 
          n.relatedMetrics.includes('sleep_quality') && 
          (n.content.toLowerCase().includes('decline') || 
           n.content.toLowerCase().includes('challenge'))
        );
        expect(sleepNarrative).toBeTruthy();
      }
    });
    
    test('recognizes and highlights significant milestones', async () => {
      const engine = new InsightNarrativeEngine();
      
      // Generate narratives that should include milestones
      const insights = await engine.generateInsights(
        mockUserData.userWithMilestones,
        mockHealthTrends.milestoneData
      );
      
      // Should have milestones in response
      expect(insights.milestones.length).toBeGreaterThan(0);
      
      // Should recognize streak milestones
      const streakMilestone = insights.milestones.find(m => m.type === 'streak');
      expect(streakMilestone).toBeTruthy();
      
      // Should recognize improvement milestones
      const improvementMilestone = insights.milestones.find(m => 
        m.type === 'improvement' && 
        m.percentImprovement && 
        m.percentImprovement > 10
      );
      expect(improvementMilestone).toBeTruthy();
    });
    
    test('adjusts narrative tone based on user engagement level', async () => {
      const engine = new InsightNarrativeEngine();
      
      // User with high engagement
      const highEngagementUser = {
        ...mockUserData.standardUser,
        engagement: {
          ...mockUserData.standardUser.engagement,
          level: 'high',
          sessionsPerWeek: 12,
          averageSessionDuration: 25,
          lastLoginDate: new Date().toISOString()
        }
      };
      
      // User with low engagement
      const lowEngagementUser = {
        ...mockUserData.standardUser,
        engagement: {
          ...mockUserData.standardUser.engagement,
          level: 'low',
          sessionsPerWeek: 2,
          averageSessionDuration: 5,
          lastLoginDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
        }
      };
      
      // Get narratives for both users
      const highEngagementInsights = await engine.generateInsights(
        highEngagementUser,
        mockHealthTrends.recentHealthData
      );
      
      const lowEngagementInsights = await engine.generateInsights(
        lowEngagementUser,
        mockHealthTrends.recentHealthData
      );
      
      // High engagement user should get detailed, technical narratives
      const highEngagementWordCount = highEngagementInsights.narratives.reduce(
        (count, narrative) => count + narrative.content.split(' ').length, 0
      );
      
      // Low engagement user should get more concise, motivational narratives
      const lowEngagementWordCount = lowEngagementInsights.narratives.reduce(
        (count, narrative) => count + narrative.content.split(' ').length, 0
      );
      
      // High engagement narratives should be more detailed
      expect(highEngagementWordCount).toBeGreaterThan(lowEngagementWordCount);
      
      // Low engagement narratives should be more motivational
      const motivationalWords = ['encourage', 'try', 'simple', 'quick', 'easy', 'start'];
      
      const countMotivationalWords = (text) => {
        return motivationalWords.reduce((count, word) => {
          const regex = new RegExp(word, 'gi');
          const matches = text.match(regex) || [];
          return count + matches.length;
        }, 0);
      };
      
      const highEngagementMotivationalScore = countMotivationalWords(
        highEngagementInsights.narratives.map(n => n.content).join(' ')
      );
      
      const lowEngagementMotivationalScore = countMotivationalWords(
        lowEngagementInsights.narratives.map(n => n.content).join(' ')
      );
      
      // Low engagement users should get more motivational content
      expect(lowEngagementMotivationalScore).toBeGreaterThan(highEngagementMotivationalScore);
    });
    
    test('provides population benchmarks for peer comparison', async () => {
      const engine = new InsightNarrativeEngine();
      
      // Get insights with population benchmarks
      const insights = await engine.generateInsights(
        mockUserData.standardUser,
        mockHealthTrends.recentHealthData,
        { includeBenchmarks: true }
      );
      
      // Should include benchmark data
      expect(insights.benchmarks).toBeTruthy();
      expect(Object.keys(insights.benchmarks).length).toBeGreaterThan(0);
      
      // Benchmark data should include user's value and percentile
      Object.values(insights.benchmarks).forEach(benchmark => {
        expect(benchmark).toHaveProperty('user_value');
        expect(benchmark).toHaveProperty('user_percentile');
        expect(benchmark).toHaveProperty('population_mean');
      });
      
      // Narrative should reference benchmarks
      const benchmarkNarrative = insights.narratives.find(n => 
        n.content.toLowerCase().includes('average') || 
        n.content.toLowerCase().includes('percentile') ||
        n.content.toLowerCase().includes('compared to')
      );
      expect(benchmarkNarrative).toBeTruthy();
    });
  });
  
  describe('Narrative UI Components', () => {
    test('renders insight panel with correct narratives', () => {
      render(
        <InsightPanel
          narratives={mockInsightData.sampleNarratives}
          summary={mockInsightData.sampleSummary}
          dataTestId="insight-panel"
        />
      );
      
      // Panel should show title
      expect(screen.getByText('Your Health Insights')).toBeInTheDocument();
      
      // Should display summary
      expect(screen.getByText(mockInsightData.sampleSummary)).toBeInTheDocument();
      
      // Should display each narrative
      mockInsightData.sampleNarratives.forEach(narrative => {
        expect(screen.getByText(narrative.title)).toBeInTheDocument();
      });
    });
    
    test('highlights high confidence insights differently', () => {
      render(
        <InsightPanel
          narratives={mockInsightData.sampleNarratives}
          summary={mockInsightData.sampleSummary}
          dataTestId="insight-panel"
        />
      );
      
      // Find a high confidence narrative (>0.8)
      const highConfidenceNarrative = mockInsightData.sampleNarratives.find(
        n => n.confidenceLevel > 0.8
      );
      
      // Find a low confidence narrative (<0.7)
      const lowConfidenceNarrative = mockInsightData.sampleNarratives.find(
        n => n.confidenceLevel < 0.7
      );
      
      // Get DOM elements
      const highConfidenceElement = screen.getByText(highConfidenceNarrative.title)
        .closest('.narrative-card');
      
      const lowConfidenceElement = screen.getByText(lowConfidenceNarrative.title)
        .closest('.narrative-card');
      
      // High confidence should have a different styling
      expect(highConfidenceElement).toHaveClass('high-confidence');
      expect(lowConfidenceElement).not.toHaveClass('high-confidence');
    });
    
    test('displays milestone achievements prominently', () => {
      render(
        <MetricsMilestonePanel
          milestones={mockInsightData.sampleMilestones}
          dataTestId="milestone-panel"
        />
      );
      
      // Panel should show title
      expect(screen.getByText('Your Recent Achievements')).toBeInTheDocument();
      
      // Should display each milestone
      mockInsightData.sampleMilestones.forEach(milestone => {
        expect(screen.getByText(milestone.title)).toBeInTheDocument();
      });
      
      // Should include visual indicators of improvement
      const streakMilestone = mockInsightData.sampleMilestones.find(m => m.type === 'streak');
      const streakElement = screen.getByText(streakMilestone.title).closest('.milestone-card');
      
      expect(streakElement).toHaveClass('streak-milestone');
      expect(streakElement.querySelector('.value-display')).toHaveTextContent(streakMilestone.value.toString());
    });
    
    test('provides glossary links for medical terms', async () => {
      // Narrative with medical terms
      const narrativeWithTerms = [
        {
          id: 'narr_med_001',
          title: 'Mitochondrial function improving',
          content: 'Your markers indicate improved mitochondrial function and reduced oxidative stress levels.',
          confidenceLevel: 0.85,
          relatedMetrics: ['energy_level', 'recovery_rate'],
          type: 'progress',
          terms: [
            {
              term: 'mitochondrial function',
              definition: 'The effectiveness of mitochondria, the cellular structures that generate energy for the body.'
            },
            {
              term: 'oxidative stress',
              definition: 'An imbalance between free radicals and antioxidants in the body that can lead to cell damage.'
            }
          ]
        }
      ];
      
      render(
        <InsightPanel
          narratives={narrativeWithTerms}
          summary="Your metrics show positive trends."
          showGlossary={true}
          dataTestId="insight-panel-with-terms"
        />
      );
      
      // Find a term with glossary link
      const termLink = screen.getByText('mitochondrial function');
      expect(termLink).toHaveClass('glossary-term');
      
      // Click term to see definition
      fireEvent.click(termLink);
      
      // Definition should appear
      await waitFor(() => {
        const definition = screen.getByText(narrativeWithTerms[0].terms[0].definition);
        expect(definition).toBeInTheDocument();
      });
    });
    
    test('displays population benchmark comparisons correctly', () => {
      render(
        <PopulationBenchmarkChart
          metricName="Sleep Quality"
          metricId="sleep_quality"
          benchmark={mockInsightData.sampleBenchmarks.sleep_quality}
          dataTestId="benchmark-chart"
        />
      );
      
      // Chart should display metric name
      expect(screen.getByText('Sleep Quality')).toBeInTheDocument();
      
      // Should show user's percentile
      expect(screen.getByText(`${mockInsightData.sampleBenchmarks.sleep_quality.user_percentile}th percentile`)).toBeInTheDocument();
      
      // Should have visual indicator of user position
      const userMarker = screen.getByTestId('user-marker');
      expect(userMarker).toBeInTheDocument();
      
      // Should have percentile bands
      const p90Marker = screen.getByTestId('p90-marker');
      const p50Marker = screen.getByTestId('p50-marker');
      expect(p90Marker).toBeInTheDocument();
      expect(p50Marker).toBeInTheDocument();
    });
  });
});
