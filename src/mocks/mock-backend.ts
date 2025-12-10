/**
 * Mock Backend
 *
 * This module provides a mock implementation of backend services for testing purposes.
 * It simulates API responses, intent processing, and other backend functionality.
 *
 * @federation-compatible
 * @machine-readable
 */

// Intent types
export type IntentType =
  | 'query'
  | 'command'
  | 'create'
  | 'update'
  | 'delete'
  | 'navigate'
  | 'search'
  | 'filter'
  | 'sort'
  | 'compound'
  | 'unknown';

/**
 * Result of dispatching an intent
 * @federation-result-type
 */
export interface DispatchResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  timestamp: number;
  trace?: string[];
  dependencyTag?: string;
}

/**
 * Federation mock result schema
 * @federation-schema
 */
export interface FederatedMockResult {
  success: boolean;
  data?: any;
  error?: string;
  reasoning: string[];
  federationMetadata: {
    version: string;
    origin: string;
    propagationPath: string[];
    timestamp: number;
  };
}

/**
 * Scenario options for customizing mock behavior
 * @federation-config
 */
export interface ScenarioOptions {
  failureRate?: number;
  latency?: number;
  errorType?: string;
  recoveryTime?: number;
  circuitOpen?: boolean;
}

// Intent object
export interface Intent {
  id: string;
  text: string;
  type: IntentType;
  confidence: number;
  entities?: Record<string, any>;
  metadata?: Record<string, any>;
  childIds?: string[];
  parentId?: string;
  timestamp: number;
}

// Mock backend state
interface MockBackendState {
  initialized: boolean;
  intents: Map<string, Intent>;
  failureRate: number;
  latency: number;
  enabled: boolean;
  sessionHistory: Map<string, string[]>;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF-OPEN';
  failureCount: number;
  lastFailureTime: number;
  customScenario: ScenarioOptions;
}

// Default state
const state: MockBackendState = {
  initialized: false,
  intents: new Map(),
  failureRate: 0,
  latency: 0,
  enabled: false,
  sessionHistory: new Map(),
  circuitState: 'CLOSED',
  failureCount: 0,
  lastFailureTime: 0,
  customScenario: {}
};

/**
 * Enable the mock backend
 */
export function enableMockBackend(): void {
  state.enabled = true;
  console.log('[MockBackend] Enabled');
}

/**
 * Disable the mock backend
 */
export function disableMockBackend(): void {
  state.enabled = false;
  console.log('[MockBackend] Disabled');
}

/**
 * Initialize the mock backend
 */
export async function initialize(): Promise<void> {
  if (!state.enabled) {
    throw new Error('Mock backend is not enabled');
  }
  
  if (state.initialized) {
    console.log('[MockBackend] Already initialized');
    return;
  }
  
  // Simulate initialization delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Clear existing data
  state.intents.clear();
  
  // Set default values
  state.failureRate = 0;
  state.latency = 50;
  
  state.initialized = true;
  console.log('[MockBackend] Initialized');
}

/**
 * Reset the mock backend state
 */
export function reset(): void {
  state.initialized = false;
  state.intents.clear();
  state.failureRate = 0;
  state.latency = 0;
  console.log('[MockBackend] Reset');
}

/**
 * Set the failure rate (0-1)
 */
export function setFailureRate(rate: number): void {
  state.failureRate = Math.max(0, Math.min(1, rate));
  console.log(`[MockBackend] Failure rate set to ${state.failureRate}`);
}

/**
 * Set the simulated latency (ms)
 */
export function setLatency(latency: number): void {
  state.latency = Math.max(0, latency);
  console.log(`[MockBackend] Latency set to ${state.latency}ms`);
}

/**
 * Simulate a random failure based on failure rate
 */
async function simulateFailure(): Promise<void> {
  // Simulate latency
  if (state.latency > 0) {
    await new Promise(resolve => setTimeout(resolve, state.latency));
  }
  
  // Check if should fail
  if (Math.random() < state.failureRate) {
    throw new Error('Simulated backend failure');
  }
}

/**
 * Process text to extract intent
 */
export async function processText(text: string): Promise<Intent> {
  if (!state.enabled || !state.initialized) {
    throw new Error('Mock backend is not enabled or initialized');
  }
  
  await simulateFailure();
  
  // Validate input
  if (!text || text.trim() === '') {
    throw new Error('Empty text input');
  }
  
  // Generate a unique ID for this intent
  const id = `intent_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // Determine intent type and confidence based on text
  const { type, confidence, entities } = analyzeText(text);
  
  // Create intent object
  const intent: Intent = {
    id,
    text,
    type,
    confidence,
    entities,
    timestamp: Date.now()
  };
  
  // Store intent
  state.intents.set(id, intent);
  
  return intent;
}

/**
 * Process compound intent (multiple intents in one text)
 */
export async function processCompoundIntent(text: string): Promise<Intent> {
  if (!state.enabled || !state.initialized) {
    throw new Error('Mock backend is not enabled or initialized');
  }
  
  await simulateFailure();
  
  // Validate input
  if (!text || text.trim() === '') {
    throw new Error('Empty text input');
  }
  
  // Generate a unique ID for this compound intent
  const compoundId = `intent_compound_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // Split text into potential sub-intents
  const subTexts = splitIntoSubIntents(text);
  
  // Process each sub-intent
  const childIds: string[] = [];
  
  for (const subText of subTexts) {
    const childIntent = await processText(subText);
    childIntent.parentId = compoundId;
    childIds.push(childIntent.id);
  }
  
  // Create compound intent object
  const compoundIntent: Intent = {
    id: compoundId,
    text,
    type: 'compound',
    confidence: 0.9, // Compound intents typically have high confidence
    childIds,
    timestamp: Date.now()
  };
  
  // Store compound intent
  state.intents.set(compoundId, compoundIntent);
  
  return compoundIntent;
}

/**
 * Get an intent by ID
 */
export async function getIntent(id: string): Promise<Intent> {
  if (!state.enabled || !state.initialized) {
    throw new Error('Mock backend is not enabled or initialized');
  }
  
  await simulateFailure();
  
  const intent = state.intents.get(id);
  
  if (!intent) {
    throw new Error(`Intent not found: ${id}`);
  }
  
  return intent;
}

/**
 * Get all intents
 */
export async function getAllIntents(): Promise<Intent[]> {
  if (!state.enabled || !state.initialized) {
    throw new Error('Mock backend is not enabled or initialized');
  }
  
  await simulateFailure();
  
  return Array.from(state.intents.values());
}

/**
 * Delete an intent
 */
export async function deleteIntent(id: string): Promise<void> {
  if (!state.enabled || !state.initialized) {
    throw new Error('Mock backend is not enabled or initialized');
  }
  
  await simulateFailure();
  
  if (!state.intents.has(id)) {
    throw new Error(`Intent not found: ${id}`);
  }
  
  state.intents.delete(id);
}

/**
 * Analyze text to determine intent type, confidence, and entities
 */
function analyzeText(text: string): { 
  type: IntentType; 
  confidence: number; 
  entities?: Record<string, any>;
} {
  const lowerText = text.toLowerCase();
  
  // Check for command intents
  if (lowerText.startsWith('create') || lowerText.includes('make a new') || lowerText.includes('add a')) {
    return {
      type: 'create',
      confidence: 0.85,
      entities: extractEntities(text)
    };
  }
  
  if (lowerText.startsWith('update') || lowerText.startsWith('edit') || lowerText.startsWith('change')) {
    return {
      type: 'update',
      confidence: 0.82,
      entities: extractEntities(text)
    };
  }
  
  if (lowerText.startsWith('delete') || lowerText.startsWith('remove') || lowerText.startsWith('get rid of')) {
    return {
      type: 'delete',
      confidence: 0.88,
      entities: extractEntities(text)
    };
  }
  
  if (lowerText.startsWith('search') || lowerText.startsWith('find') || lowerText.startsWith('look for')) {
    return {
      type: 'search',
      confidence: 0.9,
      entities: extractEntities(text)
    };
  }
  
  if (lowerText.startsWith('filter') || lowerText.includes('show only') || lowerText.includes('where')) {
    return {
      type: 'filter',
      confidence: 0.8,
      entities: extractEntities(text)
    };
  }
  
  if (lowerText.startsWith('sort') || lowerText.includes('order by') || lowerText.includes('arrange')) {
    return {
      type: 'sort',
      confidence: 0.85,
      entities: extractEntities(text)
    };
  }
  
  if (lowerText.startsWith('go to') || lowerText.startsWith('navigate to') || lowerText.startsWith('open')) {
    return {
      type: 'navigate',
      confidence: 0.9,
      entities: extractEntities(text)
    };
  }
  
  // Check for query intents
  if (lowerText.startsWith('what') || lowerText.startsWith('who') ||
      lowerText.startsWith('when') || lowerText.startsWith('where') ||
      lowerText.startsWith('why') || lowerText.startsWith('how')) {
    return {
      type: 'query',
      confidence: 0.9,
      entities: extractEntities(text)
    };
  }
  
  // Check for command intents
  if (lowerText.includes('please') || lowerText.endsWith('!') ||
      lowerText.startsWith('can you') || lowerText.startsWith('could you')) {
    return {
      type: 'command',
      confidence: 0.75,
      entities: extractEntities(text)
    };
  }
  
  // Default to unknown with low confidence
  return {
    type: 'unknown',
    confidence: 0.3,
    entities: {}
  };
}

/**
 * Extract entities from text
 */
function extractEntities(text: string): Record<string, any> {
  const entities: Record<string, any> = {};
  
  // Extract dates
  const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{2,4})|(\d{1,2}-\d{1,2}-\d{2,4})|((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(st|nd|rd|th)?, \d{4})/gi;
  const dates = text.match(dateRegex);
  if (dates && dates.length > 0) {
    entities.dates = dates;
  }
  
  // Extract numbers
  const numberRegex = /\b\d+(\.\d+)?\b/g;
  const numbers = text.match(numberRegex);
  if (numbers && numbers.length > 0) {
    entities.numbers = numbers.map(n => parseFloat(n));
  }
  
  // Extract email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex);
  if (emails && emails.length > 0) {
    entities.emails = emails;
  }
  
  // Extract URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRegex);
  if (urls && urls.length > 0) {
    entities.urls = urls;
  }
  
  // Extract quoted strings
  const quoteRegex = /"([^"]*)"/g;
  const quotes = [];
  let match;
  while ((match = quoteRegex.exec(text)) !== null) {
    quotes.push(match[1]);
  }
  if (quotes.length > 0) {
    entities.quotes = quotes;
  }
  
  return entities;
}

/**
 * Split text into potential sub-intents
 */
function splitIntoSubIntents(text: string): string[] {
  // Split by common conjunctions and punctuation
  const splits = text.split(/\s+(?:and|then|but|or|;)\s+|\.\s+/);
  
  // Filter out empty splits
  return splits.filter(split => split.trim().length > 0);
}

/**
 * Dispatch an intent for processing
 *
 * @federation-intent-dispatch
 * @input intentId
 * @output result with trace and dependency tag
 */
export async function dispatchIntent(intentId: string): Promise<DispatchResult> {
  if (!state.enabled || !state.initialized) {
    throw new Error('Mock backend is not enabled or initialized');
  }
  
  console.log('REASONING: Processing intent dispatch request');
  
  await simulateFailure();
  
  // Check circuit breaker state
  if (state.circuitState === 'OPEN') {
    console.log('REASONING: Circuit breaker is open, rejecting request');
    return {
      success: false,
      message: 'Circuit breaker is open',
      error: 'CIRCUIT_OPEN',
      timestamp: Date.now(),
      trace: ['circuit_breaker_check', 'circuit_open_rejection'],
      dependencyTag: 'circuit-breaker'
    };
  }
  
  const intent = state.intents.get(intentId);
  
  if (!intent) {
    console.log('REASONING: Intent not found in dispatch');
    state.failureCount++;
    
    // Check if circuit breaker should open
    if (state.failureCount >= 3 && (Date.now() - state.lastFailureTime) < 5000) {
      state.circuitState = 'OPEN';
      setTimeout(() => {
        state.circuitState = 'HALF-OPEN';
        console.log('REASONING: Circuit breaker moved to HALF-OPEN state');
      }, 10000); // 10 second timeout
    }
    
    state.lastFailureTime = Date.now();
    
    return {
      success: false,
      message: `Intent not found: ${intentId}`,
      error: 'INTENT_NOT_FOUND',
      timestamp: Date.now(),
      trace: ['intent_lookup', 'not_found'],
      dependencyTag: 'intent-store'
    };
  }
  
  // Process the intent
  console.log('REASONING: Processing intent with type: ' + intent.type);
  
  // Simulate successful processing
  if (Math.random() >= state.failureRate) {
    // Reset failure count on success if in HALF-OPEN state
    if (state.circuitState === 'HALF-OPEN') {
      state.circuitState = 'CLOSED';
      state.failureCount = 0;
      console.log('REASONING: Circuit breaker closed after successful request');
    }
    
    return {
      success: true,
      message: `Intent ${intent.type} processed successfully`,
      data: { intentId, type: intent.type, timestamp: Date.now() },
      timestamp: Date.now(),
      trace: ['intent_lookup', 'process_' + intent.type, 'success'],
      dependencyTag: 'intent-processor'
    };
  } else {
    // Increment failure count
    state.failureCount++;
    state.lastFailureTime = Date.now();
    
    // Check if circuit breaker should open
    if (state.failureCount >= 3 && (Date.now() - state.lastFailureTime) < 5000) {
      state.circuitState = 'OPEN';
      setTimeout(() => {
        state.circuitState = 'HALF-OPEN';
        console.log('REASONING: Circuit breaker moved to HALF-OPEN state');
      }, 10000); // 10 second timeout
    }
    
    console.log('REASONING: Intent processing failed');
    
    return {
      success: false,
      message: `Error processing intent: ${intent.type}`,
      error: 'PROCESSING_ERROR',
      timestamp: Date.now(),
      trace: ['intent_lookup', 'process_' + intent.type, 'error'],
      dependencyTag: 'intent-processor'
    };
  }
}

/**
 * Set custom scenario for testing
 *
 * @federation-scenario-config
 * @input scenario options
 * @output void
 */
export function setCustomScenario(options: ScenarioOptions): void {
  console.log('REASONING: Setting custom scenario for testing');
  
  if (options.failureRate !== undefined) {
    state.failureRate = Math.max(0, Math.min(1, options.failureRate));
    console.log(`REASONING: Set failure rate to ${state.failureRate}`);
  }
  
  if (options.latency !== undefined) {
    state.latency = Math.max(0, options.latency);
    console.log(`REASONING: Set latency to ${state.latency}ms`);
  }
  
  if (options.circuitOpen !== undefined) {
    state.circuitState = options.circuitOpen ? 'OPEN' : 'CLOSED';
    console.log(`REASONING: Set circuit state to ${state.circuitState}`);
  }
  
  state.customScenario = { ...state.customScenario, ...options };
}

/**
 * Store intent in session history
 *
 * @federation-storage
 * @input intentId, sessionId
 * @output void
 */
export async function storeIntent(intentId: string, sessionId: string): Promise<void> {
  if (!state.enabled || !state.initialized) {
    throw new Error('Mock backend is not enabled or initialized');
  }
  
  console.log('REASONING: Storing intent in session history');
  
  await simulateFailure();
  
  if (!state.intents.has(intentId)) {
    throw new Error(`Intent not found: ${intentId}`);
  }
  
  // Get or create session history
  let sessionIntents = state.sessionHistory.get(sessionId) || [];
  
  // Add intent to session
  sessionIntents.push(intentId);
  
  // Update session history
  state.sessionHistory.set(sessionId, sessionIntents);
  
  console.log(`REASONING: Intent ${intentId} stored in session ${sessionId}`);
}

/**
 * Get session history
 *
 * @federation-retrieval
 * @input sessionId
 * @output array of intent IDs
 */
export async function getSessionHistory(sessionId: string): Promise<string[]> {
  if (!state.enabled || !state.initialized) {
    throw new Error('Mock backend is not enabled or initialized');
  }
  
  console.log('REASONING: Retrieving session history');
  
  await simulateFailure();
  
  // Get session history or empty array
  const sessionIntents = state.sessionHistory.get(sessionId) || [];
  
  return sessionIntents;
}

/**
 * Get telemetry data
 *
 * @federation-telemetry
 * @input none
 * @output telemetry data
 */
export async function getTelemetryData(): Promise<any> {
  if (!state.enabled || !state.initialized) {
    throw new Error('Mock backend is not enabled or initialized');
  }
  
  console.log('REASONING: Collecting telemetry data');
  
  await simulateFailure();
  
  return {
    avgDispatchTime: state.latency || 100,
    errorRate: state.failureRate,
    circuitState: state.circuitState,
    activeIntents: state.intents.size,
    sessionCount: state.sessionHistory.size
  };
}

// Export named exports
export const mockBackend = {
  enableMockBackend,
  disableMockBackend,
  initialize,
  reset,
  setFailureRate,
  setLatency,
  processText,
  processCompoundIntent,
  getIntent,
  getAllIntents,
  deleteIntent,
  dispatchIntent,
  setCustomScenario,
  storeIntent,
  getSessionHistory,
  getTelemetryData
};

// Export the mock backend as default with compatibility bridge
const mockBackendBridge = {
  ...mockBackend,
  default: mockBackend // Self-reference for nested default access pattern
};

export default mockBackendBridge;