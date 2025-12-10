/**
 * Optimized Intent Processor
 * 
 * This module provides an optimized implementation of the intent processing pipeline,
 * including caching, priority queues, and performance monitoring.
 */

import { v4 as uuidv4 } from 'uuid';
import { performance } from 'perf_hooks';

// Use any type for external modules
// @ts-ignore
import LRUCache from 'lru-cache';
// @ts-ignore
import PriorityQueue from 'p-queue';

// Types
export interface Intent {
  id: string;
  type: string;
  text: string;
  confidence: number;
  entities?: Record<string, any>;
  metadata?: Record<string, any>;
  childIds?: string[];
  parentId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: Date;
  priority?: number; // Higher number = higher priority
}

export interface IntentProcessingResult {
  intent: Intent;
  success: boolean;
  processingTime: number;
  dispatchTime?: number;
  error?: Error;
}

export interface IntentProcessorOptions {
  cacheSize?: number;
  cacheTTL?: number; // in milliseconds
  concurrency?: number;
  defaultPriority?: number;
  enableMetrics?: boolean;
  intentPatterns?: Record<string, RegExp>;
  entityPatterns?: Record<string, RegExp>;
  backend?: any; // The backend service to use for processing
}

export interface IntentProcessorMetrics {
  totalProcessed: number;
  totalSucceeded: number;
  totalFailed: number;
  averageProcessingTime: number;
  averageDispatchTime: number;
  cacheHits: number;
  cacheMisses: number;
  priorityDistribution: Record<number, number>;
  typeDistribution: Record<string, number>;
}

// Default intent patterns
const DEFAULT_INTENT_PATTERNS: Record<string, RegExp> = {
  create: /create|make|new|add/i,
  read: /get|find|show|display|list|search/i,
  update: /update|change|modify|edit/i,
  delete: /delete|remove|clear/i,
  schedule: /schedule|plan|book|reserve/i,
  remind: /remind|remember|notification/i,
  query: /what|when|where|who|how|why|status|progress/i,
  navigate: /go to|open|navigate|visit/i
};

// Default entity patterns
const DEFAULT_ENTITY_PATTERNS: Record<string, RegExp> = {
  date: /(today|tomorrow|yesterday|next week|next month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  time: /(\d{1,2}:\d{2}|\d{1,2} (am|pm)|morning|afternoon|evening|night)/i,
  person: /(john|jane|bob|alice|sarah|mike|david|lisa|team|everyone)/i,
  location: /(office|home|conference room|meeting room|kitchen|lobby)/i,
  project: /(project|task|alpha|beta|gamma|delta|epsilon)/i,
  document: /(report|document|file|spreadsheet|presentation|email)/i
};

// Default options
const DEFAULT_OPTIONS: IntentProcessorOptions = {
  cacheSize: 1000,
  cacheTTL: 60 * 60 * 1000, // 1 hour
  concurrency: 4,
  defaultPriority: 0,
  enableMetrics: true,
  intentPatterns: DEFAULT_INTENT_PATTERNS,
  entityPatterns: DEFAULT_ENTITY_PATTERNS
};

/**
 * Optimized Intent Processor class
 */
export class OptimizedIntentProcessor {
  private options: IntentProcessorOptions;
  private cache: LRUCache<string, Intent>;
  private queue: PriorityQueue;
  private metrics: IntentProcessorMetrics;
  private processingTimes: number[] = [];
  private dispatchTimes: number[] = [];
  
  constructor(options: IntentProcessorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Initialize cache
    this.cache = new LRUCache({
      max: this.options.cacheSize,
      ttl: this.options.cacheTTL,
      updateAgeOnGet: true
    });
    
    // Initialize priority queue
    this.queue = new PriorityQueue({
      concurrency: this.options.concurrency
    });
    
    // Initialize metrics
    this.metrics = {
      totalProcessed: 0,
      totalSucceeded: 0,
      totalFailed: 0,
      averageProcessingTime: 0,
      averageDispatchTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      priorityDistribution: {},
      typeDistribution: {}
    };
  }
  
  /**
   * Process text to extract intent
   */
  public async processText(text: string, priority: number = this.options.defaultPriority!): Promise<IntentProcessingResult> {
    const startTime = performance.now();
    
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(text);
      const cachedIntent = this.cache.get(cacheKey);
      
      if (cachedIntent) {
        // Cache hit
        if (this.options.enableMetrics) {
          this.metrics.cacheHits++;
        }
        
        const endTime = performance.now();
        const processingTime = endTime - startTime;
        
        return {
          intent: { ...cachedIntent, timestamp: new Date() },
          success: true,
          processingTime
        };
      }
      
      // Cache miss
      if (this.options.enableMetrics) {
        this.metrics.cacheMisses++;
      }
      
      // Extract intent
      const intent = await this.extractIntent(text, priority);
      
      // Store in cache
      this.cache.set(cacheKey, intent);
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Update metrics
      if (this.options.enableMetrics) {
        this.updateMetrics(intent, processingTime);
      }
      
      return {
        intent,
        success: true,
        processingTime
      };
    } catch (error) {
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Update failure metrics
      if (this.options.enableMetrics) {
        this.metrics.totalProcessed++;
        this.metrics.totalFailed++;
        this.processingTimes.push(processingTime);
        this.metrics.averageProcessingTime = this.calculateAverage(this.processingTimes);
      }
      
      return {
        intent: {
          id: uuidv4(),
          type: 'unknown',
          text,
          confidence: 0,
          status: 'failed',
          timestamp: new Date(),
          priority
        },
        success: false,
        processingTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  
  /**
   * Process text with priority queue
   */
  public async queueProcessText(text: string, priority: number = this.options.defaultPriority!): Promise<IntentProcessingResult> {
    return this.queue.add(() => this.processText(text, priority), { priority });
  }
  
  /**
   * Dispatch an intent to the backend
   */
  public async dispatchIntent(intent: Intent): Promise<IntentProcessingResult> {
    const startTime = performance.now();
    
    try {
      if (!this.options.backend) {
        throw new Error('No backend service provided');
      }
      
      // Update intent status
      const updatedIntent = { ...intent, status: 'processing' };
      
      // Dispatch to backend
      const dispatchResult = await this.options.backend.dispatchIntent(intent.id);
      
      // Update intent based on dispatch result
      const finalStatus: 'completed' | 'failed' = dispatchResult.success ? 'completed' : 'failed';
      const finalIntent: Intent = {
        ...updatedIntent,
        status: finalStatus
      };
      
      const endTime = performance.now();
      const dispatchTime = endTime - startTime;
      
      // Update metrics
      if (this.options.enableMetrics) {
        this.dispatchTimes.push(dispatchTime);
        this.metrics.averageDispatchTime = this.calculateAverage(this.dispatchTimes);
        
        if (dispatchResult.success) {
          this.metrics.totalSucceeded++;
        } else {
          this.metrics.totalFailed++;
        }
      }
      
      return {
        intent: finalIntent,
        success: dispatchResult.success,
        processingTime: 0, // Not applicable for dispatch
        dispatchTime
      };
    } catch (error) {
      const endTime = performance.now();
      const dispatchTime = endTime - startTime;
      
      // Update failure metrics
      if (this.options.enableMetrics) {
        this.metrics.totalFailed++;
        this.dispatchTimes.push(dispatchTime);
        this.metrics.averageDispatchTime = this.calculateAverage(this.dispatchTimes);
      }
      
      return {
        intent: { ...intent, status: 'failed' },
        success: false,
        processingTime: 0, // Not applicable for dispatch
        dispatchTime,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  
  /**
   * Dispatch an intent with priority queue
   */
  public async queueDispatchIntent(intent: Intent): Promise<IntentProcessingResult> {
    return this.queue.add(() => this.dispatchIntent(intent), { priority: intent.priority || this.options.defaultPriority! });
  }
  
  /**
   * Process and dispatch in a single operation
   */
  public async processAndDispatch(text: string, priority: number = this.options.defaultPriority!): Promise<IntentProcessingResult> {
    const processResult = await this.processText(text, priority);
    
    if (!processResult.success) {
      return processResult;
    }
    
    const dispatchResult = await this.dispatchIntent(processResult.intent);
    
    return {
      intent: dispatchResult.intent,
      success: dispatchResult.success,
      processingTime: processResult.processingTime,
      dispatchTime: dispatchResult.dispatchTime,
      error: dispatchResult.error
    };
  }
  
  /**
   * Process and dispatch with priority queue
   */
  public async queueProcessAndDispatch(text: string, priority: number = this.options.defaultPriority!): Promise<IntentProcessingResult> {
    return this.queue.add(() => this.processAndDispatch(text, priority), { priority });
  }
  
  /**
   * Get current metrics
   */
  public getMetrics(): IntentProcessorMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalProcessed: 0,
      totalSucceeded: 0,
      totalFailed: 0,
      averageProcessingTime: 0,
      averageDispatchTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      priorityDistribution: {},
      typeDistribution: {}
    };
    this.processingTimes = [];
    this.dispatchTimes = [];
  }
  
  /**
   * Clear the cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get the size of the queue
   */
  public getQueueSize(): number {
    return this.queue.size;
  }
  
  /**
   * Get the pending count of the queue
   */
  public getQueuePending(): number {
    return this.queue.pending;
  }
  
  /**
   * Pause the queue
   */
  public pauseQueue(): void {
    this.queue.pause();
  }
  
  /**
   * Resume the queue
   */
  public resumeQueue(): void {
    this.queue.start();
  }
  
  /**
   * Extract intent from text
   */
  private async extractIntent(text: string, priority: number): Promise<Intent> {
    // Generate a unique ID for the intent
    const intentId = uuidv4();
    
    // Determine intent type based on text
    let intentType = 'unknown';
    let confidence = 0.7 + Math.random() * 0.25; // 0.7-0.95
    
    // Check for intent type patterns
    const intentPatterns = this.options.intentPatterns || DEFAULT_INTENT_PATTERNS;
    for (const [type, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(text)) {
        intentType = type;
        break;
      }
    }
    
    // Extract entities
    const entities: Record<string, any> = {};
    const entityPatterns = this.options.entityPatterns || DEFAULT_ENTITY_PATTERNS;
    for (const [type, pattern] of Object.entries(entityPatterns)) {
      const match = text.match(pattern);
      if (match) {
        entities[type] = match[0];
      }
    }
    
    // Create intent object
    const intent: Intent = {
      id: intentId,
      type: intentType,
      text,
      confidence,
      entities: Object.keys(entities).length > 0 ? entities : undefined,
      status: 'pending',
      timestamp: new Date(),
      priority
    };
    
    return intent;
  }
  
  /**
   * Update metrics with new data
   */
  private updateMetrics(intent: Intent, processingTime: number): void {
    this.metrics.totalProcessed++;
    this.processingTimes.push(processingTime);
    this.metrics.averageProcessingTime = this.calculateAverage(this.processingTimes);
    
    // Update priority distribution
    const priority = intent.priority || this.options.defaultPriority!;
    this.metrics.priorityDistribution[priority] = (this.metrics.priorityDistribution[priority] || 0) + 1;
    
    // Update type distribution
    this.metrics.typeDistribution[intent.type] = (this.metrics.typeDistribution[intent.type] || 0) + 1;
  }
  
  /**
   * Calculate average of an array of numbers
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }
  
  /**
   * Generate a cache key for a text
   */
  private getCacheKey(text: string): string {
    // Normalize text for better cache hits
    return text.trim().toLowerCase();
  }
}

// Export a singleton instance with default options
export const intentProcessor = new OptimizedIntentProcessor();

// Export factory function for creating custom instances
export function createIntentProcessor(options: IntentProcessorOptions = {}): OptimizedIntentProcessor {
  return new OptimizedIntentProcessor(options);
}