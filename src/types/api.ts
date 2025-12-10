/**
 * API Request and Response Type Definitions
 * 
 * This file defines type-safe interfaces for all API requests and responses,
 * ensuring consistency between frontend and backend data contracts.
 */

import { User, UserPreferences, UserRole } from './user';
import { Phase } from './phase';
import { JournalEntry } from './journal';

// Generic API Response Structure
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==============================================
// Authentication API Types
// ==============================================

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  expiresAt: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// ==============================================
// User Profile API Types
// ==============================================

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  height?: number;
  weight?: number;
  bloodType?: string;
  bio?: string;
  profileImage?: string;
}

export interface UpdatePreferencesRequest {
  notificationSettings?: {
    email?: boolean;
    inApp?: boolean;
    sms?: boolean;
  };
  theme?: 'light' | 'dark' | 'system';
  dataSharing?: {
    shareBiomarkers?: boolean;
    shareJournalEntries?: boolean;
    shareProgress?: boolean;
  };
  privacySettings?: {
    encryptJournalEntries?: boolean;
    twoFactorAuthentication?: boolean;
  };
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ==============================================
// Phase API Types
// ==============================================

export type PhaseStatus = 'not_started' | 'in_progress' | 'completed';

export interface PhaseWithProgress extends Phase {
  progress: number; // Percentage of completion (0-100)
  status: PhaseStatus;
  remainingDays: number;
}

export interface UpdatePhaseRequest {
  isCompleted?: boolean;
  startDate?: string;
  endDate?: string;
  affirmation?: string;
}

// ==============================================
// Journal API Types
// ==============================================

export interface CreateJournalEntryRequest {
  title: string;
  content: string;
  date?: string; // ISO date string, defaults to current date if not provided
  emotion: string;
  tags?: string[];
  isDraft?: boolean;
  isShared?: boolean;
  sharedWith?: string[]; // Array of practitioner IDs
  phaseId?: string;
}

export interface UpdateJournalEntryRequest {
  id: string;
  title?: string;
  content?: string;
  date?: string;
  emotion?: string;
  tags?: string[];
  isDraft?: boolean;
  isShared?: boolean;
  sharedWith?: string[];
}

// ==============================================
// Product and Modality API Types
// ==============================================

export interface ProductUsageRequest {
  productId: string;
  date: string; // ISO date string
  completed: boolean;
  notes?: string;
  dosage?: string;
}

export interface ModalitySessionRequest {
  modalityId: string;
  date: string; // ISO date string
  duration: number; // in minutes
  intensity?: number; // 1-10 scale
  notes?: string;
  settings?: Record<string, any>; // Specific settings used for the session
}

// ==============================================
// Notification API Types
// ==============================================

export interface UpdateNotificationSettingsRequest {
  email?: boolean;
  inApp?: boolean;
  sms?: boolean;
  dailyReminders?: boolean;
  weeklyReports?: boolean;
  protocolUpdates?: boolean;
}

export interface MarkNotificationReadRequest {
  notificationId: string;
}

// Update the index.ts barrel file to include these API types
export * from './api';
