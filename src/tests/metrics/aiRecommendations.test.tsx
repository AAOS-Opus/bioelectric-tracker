import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIRecommendationEngine } from '@/lib/ai/recommendationEngine';
import { RecommendationCard } from '@/components/metrics/RecommendationCard';
import { RecommendationList } from '@/components/metrics/RecommendationList';
import { mockUserData } from '../mocks/userDataMock';
import { mockHealthTrends } from '../mocks/healthTrendsMock';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Mock Windsurf AI/Agency Swarm API endpoints
const server = setupServer(
  rest.post('/api/ai/insights', (req, res, ctx) => {
    // Return mock recommendations based on user data
    return res(
      ctx.json({
        recommendations: [
          {
            id: 'rec_001',
            title: 'Increase Spooky Scalar sessions',
            description: 'Your metrics show improvement with consistent Scalar sessions. Consider adding 2 more weekly.',
            impact: 0.85,
            category: 'modalities',
            difficulty: 'medium',
            timeframe: 'short-term'
          },
          {
            id: 'rec_002',
            title: 'Add structured sleep protocol',
            description: 'Analysis shows your detox efficiency improves with better sleep quality.',
            impact: 0.92,
            category: 'lifestyle',
            difficulty: 'medium',
            timeframe: 'immediate'
          },
          {
            id: 'rec_003',
            title: 'Optimize zinc supplement timing',
            description: 'Taking zinc with morning meals may improve absorption based on your biomarkers.',
            impact: 0.75,
            category: 'supplements',
            difficulty: 'easy',
            timeframe: 'long-term'
          }
        ],
        explanation: 'These recommendations are prioritized based on your recent biomarker trends and recovery patterns.',
        confidenceScore: 0.87
      })
    );
  }),
  
  rest.post('/api/ai/feedback', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  })
);

// Start server before tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AI-Assisted Recommendations', () => {
  
  describe('Recommendation Engine', () => {
    test('generates recommendations based on deficiencies and personal factors', async () => {
      const engine = new AIRecommendationEngine();
      const recommendations = await engine.generateRecommendations(
        mockUserData.userWithDeficiencies, 
        mockHealthTrends.recentHealthData
      );
      
      // Verify recommendations target deficient areas
      const deficientAreas = mockUserData.userWithDeficiencies.deficientAreas;
      
      // Each deficient area should have at least one recommendation
      deficientAreas.forEach(area => {
        const hasRecommendationForArea = recommendations.some(
          rec => rec.category === area || rec.tags.includes(area)
        );
        expect(hasRecommendationForArea).toBe(true);
      });
      
      // Recommendations should consider personal factors
      const personalFactors = mockUserData.userWithDeficiencies.personalFactors;
      expect(recommendations.every(rec => 
        !personalFactors.contraindications.includes(rec.title)
      )).toBe(true);
    });
    
    test('prioritizes interventions based on impact', async () => {
      const engine = new AIRecommendationEngine();
      const recommendations = await engine.generateRecommendations(
        mockUserData.standardUser, 
        mockHealthTrends.stableHealthData
      );
      
      // Check if recommendations are sorted by impact
      const impacts = recommendations.map(r => r.impact);
      const sortedImpacts = [...impacts].sort((a, b) => b - a);
      expect(impacts).toEqual(sortedImpacts);
      
      // High impact recommendations should be more detailed
      const highImpactRec = recommendations.find(r => r.impact > 0.8);
      const lowImpactRec = recommendations.find(r => r.impact < 0.5);
      
      expect(highImpactRec.description.length).toBeGreaterThan(lowImpactRec.description.length);
    });
    
    test('updates recommendations in real-time as new data is ingested', async () => {
      const engine = new AIRecommendationEngine();
      
      // Initial recommendations
      const initialRecs = await engine.generateRecommendations(
        mockUserData.standardUser,
        mockHealthTrends.initialHealthData
      );
      
      // Add new data point showing improved sleep
      const updatedHealthData = {
        ...mockHealthTrends.initialHealthData,
        sleep: [
          ...mockHealthTrends.initialHealthData.sleep,
          { date: '2025-03-22', quality: 0.9, duration: 8.5 }
        ]
      };
      
      // Get updated recommendations
      const updatedRecs = await engine.generateRecommendations(
        mockUserData.standardUser,
        updatedHealthData
      );
      
      // Recommendations should be different
      expect(updatedRecs).not.toEqual(initialRecs);
      
      // Sleep-related recommendations should be fewer or lower priority
      const initialSleepRecs = initialRecs.filter(r => 
        r.category === 'sleep' || r.tags.includes('sleep')
      );
      
      const updatedSleepRecs = updatedRecs.filter(r => 
        r.category === 'sleep' || r.tags.includes('sleep')
      );
      
      expect(updatedSleepRecs.length).toBeLessThan(initialSleepRecs.length);
    });
    
    test('avoids recommendation fatigue through frequency control', async () => {
      const engine = new AIRecommendationEngine();
      const userWithHistory = {
        ...mockUserData.standardUser,
        recommendationHistory: [
          {
            id: 'rec_hist_001',
            title: 'Increase water intake',
            dateShown: [
              '2025-03-15',
              '2025-03-16',
              '2025-03-17'
            ],
            lastInteraction: '2025-03-17',
            interactionType: 'dismissed'
          }
        ]
      };
      
      const recommendations = await engine.generateRecommendations(
        userWithHistory,
        mockHealthTrends.stableHealthData
      );
      
      // Recently dismissed recommendations should not be repeated
      const repeatedRecs = recommendations.filter(r => 
        r.title === 'Increase water intake'
      );
      
      expect(repeatedRecs.length).toBe(0);
      
      // Recommendations should have variety
      const categories = recommendations.map(r => r.category);
      const uniqueCategories = new Set(categories);
      
      // Ensure at least 3 different categories of recommendations
      expect(uniqueCategories.size).toBeGreaterThanOrEqual(3);
    });
    
    test('tracks acceptance/rejection for AI model learning', async () => {
      const engine = new AIRecommendationEngine();
      
      // Simulate user feedback
      const feedback = {
        recommendationId: 'rec_001',
        userId: mockUserData.standardUser.id,
        action: 'accepted',
        dateTime: new Date().toISOString()
      };
      
      // Submit feedback
      const result = await engine.submitFeedback(feedback);
      expect(result.success).toBe(true);
      
      // Generate new recommendations that should learn from feedback
      const newRecommendations = await engine.generateRecommendations(
        mockUserData.standardUser,
        mockHealthTrends.stableHealthData,
        { includeFeedbackHistory: true }
      );
      
      // Should include more recommendations similar to accepted ones
      const similarRecs = newRecommendations.filter(r => 
        r.category === 'modalities' // Category of rec_001
      );
      
      expect(similarRecs.length).toBeGreaterThan(0);
    });
    
    test('adjusts explanatory narratives based on health literacy level', async () => {
      const engine = new AIRecommendationEngine();
      
      // User with high health literacy
      const highLiteracyUser = {
        ...mockUserData.standardUser,
        preferences: {
          ...mockUserData.standardUser.preferences,
          healthLiteracyLevel: 'advanced'
        }
      };
      
      // User with basic health literacy
      const basicLiteracyUser = {
        ...mockUserData.standardUser,
        preferences: {
          ...mockUserData.standardUser.preferences,
          healthLiteracyLevel: 'basic'
        }
      };
      
      // Get recommendations for both users
      const advancedRecs = await engine.generateRecommendations(
        highLiteracyUser,
        mockHealthTrends.stableHealthData
      );
      
      const basicRecs = await engine.generateRecommendations(
        basicLiteracyUser,
        mockHealthTrends.stableHealthData
      );
      
      // Compare explanation complexity using technical term count
      const technicalTerms = [
        'mitochondrial', 'biomarker', 'cytokine', 'oxidative stress',
        'cellular', 'detoxification', 'methylation', 'protocol'
      ];
      
      const countTechnicalTerms = (text) => {
        return technicalTerms.reduce((count, term) => {
          const regex = new RegExp(term, 'gi');
          const matches = text.match(regex) || [];
          return count + matches.length;
        }, 0);
      };
      
      const advancedTermCount = countTechnicalTerms(
        advancedRecs.map(r => r.description).join(' ')
      );
      
      const basicTermCount = countTechnicalTerms(
        basicRecs.map(r => r.description).join(' ')
      );
      
      expect(advancedTermCount).toBeGreaterThan(basicTermCount);
    });
  });
  
  describe('Recommendation UI Components', () => {
    test('renders recommendation cards with proper prioritization', () => {
      const recommendations = [
        {
          id: 'rec_001',
          title: 'High Impact Recommendation',
          description: 'This is very important',
          impact: 0.9,
          category: 'critical',
          timeframe: 'immediate'
        },
        {
          id: 'rec_002',
          title: 'Medium Impact Recommendation',
          description: 'This is somewhat important',
          impact: 0.6,
          category: 'helpful',
          timeframe: 'short-term'
        }
      ];
      
      render(<RecommendationList recommendations={recommendations} />);
      
      // High impact recommendation should be first
      const cards = screen.getAllByTestId(/recommendation-card/);
      expect(cards[0]).toHaveTextContent('High Impact Recommendation');
      
      // High impact should have visual indication
      expect(cards[0]).toHaveClass('high-impact');
    });
    
    test('allows user to provide feedback on recommendations', async () => {
      const mockOnFeedback = jest.fn();
      
      render(
        <RecommendationCard 
          recommendation={{
            id: 'rec_001',
            title: 'Test Recommendation',
            description: 'Description here',
            impact: 0.8,
            category: 'test',
            timeframe: 'immediate'
          }}
          onFeedback={mockOnFeedback}
        />
      );
      
      // Click accept button
      fireEvent.click(screen.getByTestId('accept-recommendation'));
      
      expect(mockOnFeedback).toHaveBeenCalledWith({
        recommendationId: 'rec_001',
        action: 'accepted'
      });
      
      // Reset mock
      mockOnFeedback.mockClear();
      
      // Click dismiss button
      fireEvent.click(screen.getByTestId('dismiss-recommendation'));
      
      expect(mockOnFeedback).toHaveBeenCalledWith({
        recommendationId: 'rec_001',
        action: 'dismissed'
      });
    });
  });
});
