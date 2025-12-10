/**
 * User and authentication related type definitions
 */

import { Phase } from './phase';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  programStartDate: string;
  currentPhaseId: string;
  createdAt: string;
  updatedAt: string;
  preferences?: UserPreferences;
  profileImage?: string;
  // Profile extension fields
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  height?: number;
  weight?: number;
  bloodType?: string;
  bio?: string;
}

export type UserRole = 'user' | 'practitioner' | 'admin';

export interface UserPreferences {
  notificationSettings: {
    email: boolean;
    inApp: boolean;
    sms: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  dataSharing: {
    shareBiomarkers: boolean;
    shareJournalEntries: boolean;
    shareProgress: boolean;
  };
  privacySettings: {
    encryptJournalEntries: boolean;
    twoFactorAuthentication: boolean;
  };
}

export interface Practitioner extends User {
  role: 'practitioner';
  specialty: string;
  patients: string[]; // Array of user IDs
  bio?: string;
}

export interface UserSession {
  user: User;
  phases: Phase[];
  accessToken: string;
  expiresAt: number;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  session?: UserSession;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
