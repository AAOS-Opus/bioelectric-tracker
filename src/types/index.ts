/**
 * Central export file for all type definitions
 * 
 * This barrel file improves import consistency by allowing:
 * import { User, Phase, JournalEntry } from '@/types';
 * 
 * Instead of separate imports:
 * import { User } from '@/types/user';
 * import { Phase } from '@/types/phase';
 * import { JournalEntry } from '@/types/journal';
 */

// User and Authentication related types
export * from './user';

// Protocol Phase related types
export * from './phase';

// Journal and Reflection related types
export * from './journal';

// API Request/Response types
export * from './api';

// User Preferences types
export * from './preferences';

// Add other type exports here as needed
