/**
 * Voice Command Simulation Layer
 * 
 * This component provides a test harness for simulating voice commands,
 * including speech recognition, transcript generation, intent extraction,
 * and dispatch to the backend.
 */

import React, { useState, useEffect, useRef } from 'react';
import mockBackend, { Intent, DispatchResult } from './mock-backend';
import { v4 as uuidv4 } from 'uuid';

// Types for the voice test harness
export interface VoiceSimulationConfig {
  transcriptionDelay: number;
  transcriptionAccuracy: number; // 0-1 scale
  confidenceRange: [number, number]; // Min and max confidence scores
  simulateMicrophoneErrors: boolean;
  simulateBackgroundNoise: boolean;
  simulateInterruptions: boolean;
}

export interface VoiceSimulationResult {
  id: string;
  originalText: string;
  transcribedText: string;
  transcriptionConfidence: number;
  intent: Intent | null;
  dispatchResult: DispatchResult | null;
  error: string | null;
  duration: number;
  timestamp: Date;
}

export interface SavedScenario {
  id: string;
  name: string;
  description: string;
  commands: string[];
  config: VoiceSimulationConfig;
  results: VoiceSimulationResult[];
  createdAt: Date;
}

// Default configuration
const DEFAULT_CONFIG: VoiceSimulationConfig = {
  transcriptionDelay: 1000,
  transcriptionAccuracy: 0.95,
  confidenceRange: [0.7, 0.98],
  simulateMicrophoneErrors: false,
  simulateBackgroundNoise: false,
  simulateInterruptions: false
};

// Predefined scenarios
export const VOICE_SCENARIOS: Record<string, Partial<SavedScenario>> = {
  'basic-commands': {
    name: 'Basic Commands',
    description: 'Simple voice commands for testing basic functionality',
    commands: [
      'Create a new report',
      'Schedule a meeting for tomorrow at 2pm',
      'Send an email to John',
      'What is the status of project Alpha?',
      'Remind me to call Sarah in 30 minutes'
    ],
    config: {
      ...DEFAULT_CONFIG,
      transcriptionAccuracy: 0.98
    }
  },
  'noisy-environment': {
    name: 'Noisy Environment',
    description: 'Simulates voice commands in a noisy environment with lower accuracy',
    commands: [
      'Create a new report',
      'Schedule a meeting for tomorrow at 2pm',
      'Send an email to John',
      'What is the status of project Alpha?',
      'Remind me to call Sarah in 30 minutes'
    ],
    config: {
      ...DEFAULT_CONFIG,
      transcriptionAccuracy: 0.8,
      simulateBackgroundNoise: true
    }
  },
  'compound-commands': {
    name: 'Compound Commands',
    description: 'Complex voice commands that require multiple intents',
    commands: [
      'Create a report and email it to the team',
      'Schedule a meeting for tomorrow and send invites to the marketing team',
      'Find the latest sales numbers and create a presentation',
      'Check my calendar and reschedule any conflicts',
      'Analyze the quarterly results and prepare a summary'
    ],
    config: {
      ...DEFAULT_CONFIG,
      transcriptionAccuracy: 0.9
    }
  },
  'error-conditions': {
    name: 'Error Conditions',
    description: 'Simulates various error conditions in voice processing',
    commands: [
      'Create a new report',
      'Schedule a meeting for tomorrow at 2pm',
      'Send an email to John',
      'What is the status of project Alpha?',
      'Remind me to call Sarah in 30 minutes'
    ],
    config: {
      ...DEFAULT_CONFIG,
      transcriptionAccuracy: 0.7,
      simulateMicrophoneErrors: true,
      simulateInterruptions: true
    }
  }
};

interface VoiceTestHarnessProps {
  config?: Partial<VoiceSimulationConfig>;
  onResult?: (result: VoiceSimulationResult) => void;
  onScenarioComplete?: (results: VoiceSimulationResult[]) => void;
  autoStart?: boolean;
  className?: string;
}

const VoiceTestHarness: React.FC<VoiceTestHarnessProps> = ({
  config = {},
  onResult,
  onScenarioComplete,
  autoStart = false,
  className = ''
}) => {
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<VoiceSimulationConfig>({
    ...DEFAULT_CONFIG,
    ...config
  });
  const [inputText, setInputText] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [scenarioCommands, setScenarioCommands] = useState<string[]>([]);
  const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
  const [results, setResults] = useState<VoiceSimulationResult[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRunningScenario, setIsRunningScenario] = useState(false);
  
  // Refs
  const resultsRef = useRef<VoiceSimulationResult[]>([]);
  
  // Initialize
  useEffect(() => {
    const initializeHarness = async () => {
      try {
        // Initialize mock backend
        await mockBackend.initialize();
        
        // Load saved scenarios from localStorage
        const savedScenariosJson = localStorage.getItem('voiceTestScenarios');
        if (savedScenariosJson) {
          const parsed = JSON.parse(savedScenariosJson);
          setSavedScenarios(parsed);
        }
        
        setIsInitialized(true);
      } catch (error) {
        setErrorMessage(`Failed to initialize voice test harness: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    
    initializeHarness();
  }, []);
  
  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && isInitialized && selectedScenario && !isRunningScenario) {
      runScenario();
    }
  }, [autoStart, isInitialized, selectedScenario]);
  
  // Update results ref when results change
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);
  
  // Load scenario commands when scenario changes
  useEffect(() => {
    if (selectedScenario) {
      const scenario = VOICE_SCENARIOS[selectedScenario] || 
        savedScenarios.find(s => s.id === selectedScenario);
      
      if (scenario) {
        setScenarioCommands(scenario.commands || []);
        setCurrentCommandIndex(0);
        setResults([]);
        
        if (scenario.config) {
          setCurrentConfig({
            ...currentConfig,
            ...scenario.config
          });
        }
      }
    }
  }, [selectedScenario, savedScenarios]);
  
  // Simulate voice transcription with configurable accuracy
  const simulateTranscription = (text: string): { transcript: string, confidence: number } => {
    const { transcriptionAccuracy, confidenceRange, simulateBackgroundNoise } = currentConfig;
    
    // Base confidence from range
    const [minConfidence, maxConfidence] = confidenceRange;
    let confidence = minConfidence + Math.random() * (maxConfidence - minConfidence);
    
    // Adjust for accuracy setting
    confidence *= transcriptionAccuracy;
    
    // If perfect accuracy, return original text
    if (transcriptionAccuracy >= 0.99) {
      return { transcript: text, confidence };
    }
    
    // Otherwise, introduce errors based on accuracy
    let transcript = text;
    
    // Chance to introduce word errors
    const words = text.split(' ');
    const modifiedWords = words.map(word => {
      // Skip short words most of the time
      if (word.length <= 2 && Math.random() > 0.1) return word;
      
      // Chance to modify word based on accuracy
      if (Math.random() > transcriptionAccuracy) {
        // Different error types
        const errorType = Math.floor(Math.random() * 3);
        
        switch (errorType) {
          case 0: // Substitution
            // Replace with similar sounding word
            const similarWords: Record<string, string[]> = {
              'create': ['great', 'crate', 'crater'],
              'report': ['retort', 'resort', 'support'],
              'meeting': ['meaning', 'meating', 'greeting'],
              'schedule': ['scheduled', 'schedules', 'schedule a'],
              'email': ['e-mail', 'emails', 'female'],
              'send': ['sent', 'end', 'lend'],
              'status': ['statue', 'statues', 'status of'],
              'project': ['projects', 'reject', 'prospect'],
              'remind': ['rewind', 'reminder', 'remain'],
              'call': ['called', 'calls', 'fall']
            };
            
            if (similarWords[word.toLowerCase()]) {
              const options = similarWords[word.toLowerCase()];
              return options[Math.floor(Math.random() * options.length)];
            }
            return word;
            
          case 1: // Deletion (skip word)
            return Math.random() > 0.5 ? '' : word;
            
          case 2: // Insertion (add filler)
            const fillers = ['um', 'uh', 'like', 'you know'];
            return Math.random() > 0.5 ? 
              `${word} ${fillers[Math.floor(Math.random() * fillers.length)]}` : 
              word;
        }
      }
      
      return word;
    });
    
    // Filter out empty strings and join
    transcript = modifiedWords.filter(w => w).join(' ');
    
    // Simulate background noise by adding random words
    if (simulateBackgroundNoise && Math.random() > 0.7) {
      const noiseWords = ['background', 'noise', 'sorry', 'excuse me', '[inaudible]'];
      const noiseWord = noiseWords[Math.floor(Math.random() * noiseWords.length)];
      
      // Add at beginning, middle, or end
      const position = Math.floor(Math.random() * 3);
      switch (position) {
        case 0:
          transcript = `${noiseWord} ${transcript}`;
          break;
        case 1:
          const words = transcript.split(' ');
          const midPoint = Math.floor(words.length / 2);
          words.splice(midPoint, 0, noiseWord);
          transcript = words.join(' ');
          break;
        case 2:
          transcript = `${transcript} ${noiseWord}`;
          break;
      }
      
      // Reduce confidence for noisy transcription
      confidence *= 0.8;
    }
    
    return { transcript, confidence };
  };
  
  // Simulate microphone error
  const simulateMicrophoneError = (): Error => {
    const errors = [
      new Error('Microphone access denied'),
      new Error('No microphone detected'),
      new Error('Microphone disconnected'),
      new Error('Audio capture failed'),
      new Error('Speech recognition not supported')
    ];
    
    return errors[Math.floor(Math.random() * errors.length)];
  };
  
  // Process a single voice command
  const processVoiceCommand = async (text: string): Promise<VoiceSimulationResult> => {
    setIsProcessing(true);
    setErrorMessage(null);
    
    const startTime = Date.now();
    const resultId = uuidv4();
    
    try {
      // Check if we should simulate microphone error
      if (currentConfig.simulateMicrophoneErrors && Math.random() > 0.8) {
        throw simulateMicrophoneError();
      }
      
      // Simulate transcription delay
      await new Promise(resolve => setTimeout(resolve, currentConfig.transcriptionDelay));
      
      // Simulate transcription
      const { transcript, confidence } = simulateTranscription(text);
      
      // Simulate interruption
      if (currentConfig.simulateInterruptions && Math.random() > 0.8) {
        throw new Error('Voice command interrupted');
      }
      
      // Process intent
      let intent: Intent | null = null;
      let dispatchResult: DispatchResult | null = null;
      
      if (transcript.trim()) {
        // Check if it's a compound command
        if (transcript.toLowerCase().includes(' and ')) {
          intent = await mockBackend.processCompoundIntent(transcript);
        } else {
          intent = await mockBackend.processText(transcript);
        }
        
        // Dispatch intent
        if (intent) {
          dispatchResult = await mockBackend.dispatchIntent(intent.id);
          
          // Store in Redis memory
          await mockBackend.storeIntent(intent.id);
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const result: VoiceSimulationResult = {
        id: resultId,
        originalText: text,
        transcribedText: transcript,
        transcriptionConfidence: confidence,
        intent,
        dispatchResult,
        error: null,
        duration,
        timestamp: new Date()
      };
      
      // Update results
      setResults(prev => [...prev, result]);
      
      // Call onResult callback
      if (onResult) {
        onResult(result);
      }
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrorMessage(errorMessage);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const result: VoiceSimulationResult = {
        id: resultId,
        originalText: text,
        transcribedText: '',
        transcriptionConfidence: 0,
        intent: null,
        dispatchResult: null,
        error: errorMessage,
        duration,
        timestamp: new Date()
      };
      
      // Update results
      setResults(prev => [...prev, result]);
      
      // Call onResult callback
      if (onResult) {
        onResult(result);
      }
      
      return result;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Run a single command
  const runCommand = async () => {
    if (!inputText.trim()) {
      setErrorMessage('Please enter a command');
      return;
    }
    
    await processVoiceCommand(inputText);
    setInputText('');
  };
  
  // Run the current scenario
  const runScenario = async () => {
    if (!scenarioCommands.length) {
      setErrorMessage('No commands in scenario');
      return;
    }
    
    setIsRunningScenario(true);
    setResults([]);
    setCurrentCommandIndex(0);
    
    try {
      for (let i = 0; i < scenarioCommands.length; i++) {
        setCurrentCommandIndex(i);
        await processVoiceCommand(scenarioCommands[i]);
        
        // Add a small delay between commands
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Call onScenarioComplete callback
      if (onScenarioComplete) {
        onScenarioComplete(resultsRef.current);
      }
    } catch (error) {
      setErrorMessage(`Error running scenario: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunningScenario(false);
    }
  };
  
  // Return a placeholder UI for now
  return (
    <div className={`voice-test-harness ${className}`} data-testid="voice-test-harness">
      <h2>Voice Command Test Harness</h2>
      {!isInitialized && <p>Initializing...</p>}
      
      {errorMessage && (
        <div className="error-message">
          <p>{errorMessage}</p>
          <button onClick={() => setErrorMessage(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="command-input">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter voice command to test..."
          disabled={isProcessing || isRunningScenario}
        />
        
        <button
          onClick={runCommand}
          disabled={!inputText.trim() || isProcessing || isRunningScenario}
        >
          {isProcessing ? 'Processing...' : 'Run Command'}
        </button>
      </div>
      
      <div className="results">
        <h3>Results</h3>
        {results.length === 0 ? (
          <p>No results yet. Run a command or scenario to see results.</p>
        ) : (
          <ul>
            {results.map((result) => (
              <li key={result.id}>
                <div><strong>Original:</strong> {result.originalText}</div>
                <div><strong>Transcribed:</strong> {result.transcribedText}</div>
                {result.intent && (
                  <div><strong>Intent:</strong> {result.intent.type}</div>
                )}
                {result.error && (
                  <div className="error"><strong>Error:</strong> {result.error}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VoiceTestHarness;