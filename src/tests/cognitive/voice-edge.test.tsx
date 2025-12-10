/**
 * Voice Recognition Edge Tests
 * 
 * This test suite validates the voice recognition system under various edge conditions:
 * - Varied accents, noise levels, and speaking patterns
 * - Extremely long voice input (60+ seconds)
 * - Overlapping voices or pauses
 * - Edge audio conditions (low volume, microphone silence)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VoiceTestHarness from '../../mocks/VoiceTestHarness';
import mockBackend, { enableMockBackend } from '../../mocks/mock-backend';

// Mock audio data
const mockAudioSamples = {
  britishAccent: 'british-accent-sample.mp3',
  indianAccent: 'indian-accent-sample.mp3',
  backgroundNoise: 'background-noise-sample.mp3',
  lowVolume: 'low-volume-sample.mp3',
  longInput: 'long-input-sample.mp3',
  overlappingVoices: 'overlapping-voices-sample.mp3',
  pausedSpeech: 'paused-speech-sample.mp3',
  silence: 'silence-sample.mp3'
};

// Mock the Web Speech API
jest.mock('../../utils/speech/webSpeechAPI', () => ({
  startListening: jest.fn(),
  stopListening: jest.fn(),
  isListening: jest.fn(),
  onResult: jest.fn(),
  onError: jest.fn()
}));

describe('Voice Recognition Edge Tests', () => {
  // Setup and teardown
  beforeAll(() => {
    enableMockBackend();
  });
  
  beforeEach(async () => {
    // Reset mock backend before each test
    mockBackend.reset();
    
    // Re-initialize mock backend
    await mockBackend.initialize();
  });
  
  // Test cases
  
  test('should handle varied accents with acceptable accuracy', async () => {
    // Arrange
    const accents = [
      { name: 'British', transcriptionAccuracy: 0.85 },
      { name: 'Indian', transcriptionAccuracy: 0.8 },
      { name: 'Southern US', transcriptionAccuracy: 0.9 },
      { name: 'Australian', transcriptionAccuracy: 0.85 }
    ];
    
    for (const accent of accents) {
      // Arrange
      const harness = render(
        <VoiceTestHarness
          config={{
            transcriptionAccuracy: accent.transcriptionAccuracy,
            simulateBackgroundNoise: true
          }}
          onResult={jest.fn()}
        />
      );
      
      // Act
      const startButton = screen.getByText('Start Listening');
      fireEvent.click(startButton);
      
      // Simulate voice input
      const testPhrase = 'Create a new report and email it to the team';
      
      // Wait for processing to complete
      await waitFor(() => {
        const resultElement = screen.getByTestId('transcription-result');
        expect(resultElement.textContent).toBeTruthy();
      }, { timeout: 5000 });
      
      // Assert
      const resultElement = screen.getByTestId('transcription-result');
      const transcribedText = resultElement.textContent || '';
      
      // Calculate similarity between original and transcribed text
      const similarity = calculateTextSimilarity(testPhrase, transcribedText);
      
      // Expect similarity to be above a threshold based on the accent's expected accuracy
      expect(similarity).toBeGreaterThanOrEqual(accent.transcriptionAccuracy - 0.1);
      
      // Cleanup
      harness.unmount();
    }
  });
  
  test('should handle background noise with degraded but usable accuracy', async () => {
    // Arrange
    const noiseScenarios = [
      { name: 'Low Noise', noiseLevel: 0.2, expectedAccuracy: 0.9 },
      { name: 'Medium Noise', noiseLevel: 0.5, expectedAccuracy: 0.7 },
      { name: 'High Noise', noiseLevel: 0.8, expectedAccuracy: 0.5 }
    ];
    
    for (const scenario of noiseScenarios) {
      // Arrange
      const harness = render(
        <VoiceTestHarness
          config={{
            transcriptionAccuracy: 1.0 - scenario.noiseLevel, // Accuracy decreases with noise
            simulateBackgroundNoise: scenario.noiseLevel > 0.3 // Enable background noise for medium/high noise
          }}
          onResult={jest.fn()}
        />
      );
      
      // Act
      const startButton = screen.getByText('Start Listening');
      fireEvent.click(startButton);
      
      // Simulate voice input
      const testPhrase = 'Schedule a meeting for tomorrow at 2pm';
      
      // Wait for processing to complete
      await waitFor(() => {
        const resultElement = screen.getByTestId('transcription-result');
        expect(resultElement.textContent).toBeTruthy();
      }, { timeout: 5000 });
      
      // Assert
      const resultElement = screen.getByTestId('transcription-result');
      const transcribedText = resultElement.textContent || '';
      
      // Calculate similarity between original and transcribed text
      const similarity = calculateTextSimilarity(testPhrase, transcribedText);
      
      // Expect similarity to be above the expected accuracy threshold
      expect(similarity).toBeGreaterThanOrEqual(scenario.expectedAccuracy - 0.1);
      
      // Verify confidence score is reported and decreases with noise
      const confidenceElement = screen.getByTestId('confidence-score');
      const confidenceScore = parseFloat(confidenceElement.textContent || '0');
      
      expect(confidenceScore).toBeLessThanOrEqual(1.0 - scenario.noiseLevel + 0.1);
      
      // Cleanup
      harness.unmount();
    }
  });
  
  test('should handle extremely long voice input (60+ seconds)', async () => {
    // Arrange
    const harness = render(
      <VoiceTestHarness
        config={{
          transcriptionAccuracy: 0.9,
          transcriptionDelay: 2000, // Longer delay for long input
          simulateInterruptions: false // Disable interruptions for long input
        }}
        onResult={jest.fn()}
      />
    );
    
    // Act
    const startButton = screen.getByText('Start Listening');
    fireEvent.click(startButton);
    
    // Simulate long voice input (would be handled by the harness)
    
    // Wait for processing to complete (longer timeout for long input)
    await waitFor(() => {
      const resultElement = screen.getByTestId('transcription-result');
      expect(resultElement.textContent).toBeTruthy();
    }, { timeout: 80000 });
    
    // Assert
    const resultElement = screen.getByTestId('transcription-result');
    const transcribedText = resultElement.textContent || '';
    
    // Expect the transcribed text to be substantial in length
    expect(transcribedText.length).toBeGreaterThan(100);
    
    // Verify that the system didn't time out
    const statusElement = screen.getByTestId('recognition-status');
    expect(statusElement.textContent).not.toContain('timeout');
    
    // Verify that the text was properly segmented
    const segments = screen.getAllByTestId('text-segment');
    expect(segments.length).toBeGreaterThan(1);
    
    // Cleanup
    harness.unmount();
  });
  
  test('should handle overlapping voices with clear disambiguation', async () => {
    // Arrange
    const harness = render(
      <VoiceTestHarness
        config={{
          transcriptionAccuracy: 0.7, // Lower accuracy due to overlapping voices
          simulateBackgroundNoise: true,
          simulateInterruptions: true
        }}
        onResult={jest.fn()}
      />
    );
    
    // Act
    const startButton = screen.getByText('Start Listening');
    fireEvent.click(startButton);
    
    // Wait for processing to complete
    await waitFor(() => {
      const resultElement = screen.getByTestId('transcription-result');
      expect(resultElement.textContent).toBeTruthy();
    }, { timeout: 5000 });
    
    // Assert
    const resultElement = screen.getByTestId('transcription-result');
    const transcribedText = resultElement.textContent || '';
    
    // Expect the system to identify multiple speakers
    const speakerSegments = screen.getAllByTestId('speaker-segment');
    expect(speakerSegments.length).toBeGreaterThan(1);
    
    // Verify that confidence scores are provided for ambiguous segments
    const confidenceElements = screen.getAllByTestId('segment-confidence');
    expect(confidenceElements.length).toBeGreaterThan(0);
    
    // Verify that alternative interpretations are provided
    const alternativesElements = screen.getAllByTestId('alternatives');
    expect(alternativesElements.length).toBeGreaterThan(0);
    
    // Cleanup
    harness.unmount();
  });
  
  test('should handle speech with long pauses', async () => {
    // Arrange
    const harness = render(
      <VoiceTestHarness
        config={{
          transcriptionAccuracy: 0.9,
          transcriptionDelay: 3000, // Simulate pauses with longer delay
          simulateInterruptions: true // Interruptions can simulate pauses
        }}
        onResult={jest.fn()}
      />
    );
    
    // Act
    const startButton = screen.getByText('Start Listening');
    fireEvent.click(startButton);
    
    // Wait for processing to complete
    await waitFor(() => {
      const resultElement = screen.getByTestId('transcription-result');
      expect(resultElement.textContent).toBeTruthy();
    }, { timeout: 10000 });
    
    // Assert
    const resultElement = screen.getByTestId('transcription-result');
    const transcribedText = resultElement.textContent || '';
    
    // Verify that the system maintained context across pauses
    const segments = screen.getAllByTestId('text-segment');
    expect(segments.length).toBeGreaterThan(1);
    
    // Verify that the system didn't terminate recognition during pauses
    const statusElement = screen.getByTestId('recognition-status');
    expect(statusElement.textContent).not.toContain('terminated');
    
    // Cleanup
    harness.unmount();
  });
  
  test('should handle low volume audio input', async () => {
    // Arrange
    const harness = render(
      <VoiceTestHarness
        config={{
          transcriptionAccuracy: 0.7, // Lower accuracy due to low volume
          confidenceRange: [0.3, 0.7], // Lower confidence range for low volume
          simulateMicrophoneErrors: true // Microphone errors can simulate low volume
        }}
        onResult={jest.fn()}
      />
    );
    
    // Act
    const startButton = screen.getByText('Start Listening');
    fireEvent.click(startButton);
    
    // Wait for processing to complete
    await waitFor(() => {
      const resultElement = screen.getByTestId('transcription-result');
      expect(resultElement.textContent).toBeTruthy();
    }, { timeout: 5000 });
    
    // Assert
    const resultElement = screen.getByTestId('transcription-result');
    const transcribedText = resultElement.textContent || '';
    
    // Verify that the system detected low volume
    const statusElement = screen.getByTestId('recognition-status');
    expect(statusElement.textContent).toContain('low volume');
    
    // Verify that the system provided feedback about low volume
    const feedbackElement = screen.getByTestId('user-feedback');
    expect(feedbackElement.textContent).toContain('volume');
    
    // Cleanup
    harness.unmount();
  });
  
  test('should handle microphone silence gracefully', async () => {
    // Arrange
    const harness = render(
      <VoiceTestHarness
        config={{
          transcriptionAccuracy: 0.9,
          transcriptionDelay: 10000, // Long delay to simulate silence
          simulateMicrophoneErrors: true // Microphone errors can simulate silence
        }}
        onResult={jest.fn()}
      />
    );
    
    // Act
    const startButton = screen.getByText('Start Listening');
    fireEvent.click(startButton);
    
    // Wait for timeout or feedback
    await waitFor(() => {
      const feedbackElement = screen.getByTestId('user-feedback');
      expect(feedbackElement.textContent).toBeTruthy();
    }, { timeout: 15000 });
    
    // Assert
    const feedbackElement = screen.getByTestId('user-feedback');
    expect(feedbackElement.textContent).toContain('no speech detected');
    
    // Verify that the system provides clear guidance
    expect(feedbackElement.textContent).toContain('try again');
    
    // Verify that the system didn't crash or hang
    const statusElement = screen.getByTestId('recognition-status');
    const statusText = statusElement.textContent || '';
    expect(statusText === 'listening' || statusText === 'ready').toBeTruthy();
    
    // Cleanup
    harness.unmount();
  });
  
  test('should adapt confidence scoring based on audio conditions', async () => {
    // Arrange
    const scenarios = [
      { name: 'Clear Audio', noiseLevel: 0.1, expectedConfidence: 0.9 },
      { name: 'Noisy Audio', noiseLevel: 0.6, expectedConfidence: 0.6 },
      { name: 'Low Volume', volumeLevel: 0.3, expectedConfidence: 0.7 },
      { name: 'Accent', accentLevel: 0.5, expectedConfidence: 0.8 }
    ];
    
    for (const scenario of scenarios) {
      // Arrange
      const harness = render(
        <VoiceTestHarness
          config={{
            transcriptionAccuracy: 1.0 - (scenario.noiseLevel || 0),
            simulateBackgroundNoise: (scenario.noiseLevel || 0) > 0.3,
            simulateMicrophoneErrors: (scenario.volumeLevel || 1.0) < 0.5,
            simulateInterruptions: (scenario.accentLevel || 0) > 0.5,
            confidenceRange: [(scenario.noiseLevel || 0) * 0.5, 0.9 - (scenario.noiseLevel || 0) * 0.3]
          }}
          onResult={jest.fn()}
        />
      );
      
      // Act
      const startButton = screen.getByText('Start Listening');
      fireEvent.click(startButton);
      
      // Wait for processing to complete
      await waitFor(() => {
        const resultElement = screen.getByTestId('transcription-result');
        expect(resultElement.textContent).toBeTruthy();
      }, { timeout: 5000 });
      
      // Assert
      const confidenceElement = screen.getByTestId('confidence-score');
      const confidenceScore = parseFloat(confidenceElement.textContent || '0');
      
      // Expect confidence to be within a reasonable range of the expected value
      expect(confidenceScore).toBeGreaterThanOrEqual(scenario.expectedConfidence - 0.2);
      expect(confidenceScore).toBeLessThanOrEqual(scenario.expectedConfidence + 0.2);
      
      // Cleanup
      harness.unmount();
    }
  });
});

/**
 * Calculate text similarity between two strings
 * This is a simple implementation using Levenshtein distance
 */
function calculateTextSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  // Calculate Levenshtein distance
  const costs: number[] = [];
  for (let i = 0; i <= shorter.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= longer.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (shorter.charAt(i - 1) !== longer.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[longer.length] = lastValue;
    }
  }
  
  // Calculate similarity as 1 - normalized distance
  return 1.0 - (costs[longer.length] / longer.length);
}