import { z } from 'zod';

// Common validation schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    'Password must contain uppercase, lowercase, number and special character'
  );

export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    'Invalid phone number format. Use international format (e.g., +1234567890)'
  );

// Input masking functions
export const maskPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

export const unmaskPhone = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Form error utilities
export const hasErrors = (errors: Record<string, string[]>): boolean => {
  return Object.keys(errors).length > 0;
};

export const getFirstError = (errors: Record<string, string[]>): string | null => {
  const firstKey = Object.keys(errors)[0];
  return firstKey ? errors[firstKey][0] : null;
};

// Form state persistence
export const persistFormState = <T extends Record<string, any>>(
  key: string,
  state: T
): void => {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to persist form state:', error);
  }
};

export const loadFormState = <T extends Record<string, any>>(
  key: string
): T | null => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load form state:', error);
    return null;
  }
};

export const clearFormState = (key: string): void => {
  localStorage.removeItem(key);
};

// Focus management
export const focusFirstError = (errors: Record<string, string[]>): void => {
  const firstErrorField = Object.keys(errors)[0];
  if (firstErrorField) {
    const element = document.querySelector(
      `[name="${firstErrorField}"]`
    ) as HTMLElement;
    element?.focus();
  }
};

// Offline submission queue
type QueuedSubmission<T> = {
  id: string;
  formId: string;
  data: T;
  timestamp: number;
};

export const queueOfflineSubmission = <T extends Record<string, any>>(
  formId: string,
  data: T
): void => {
  try {
    const queue = JSON.parse(
      localStorage.getItem('offlineSubmissionQueue') || '[]'
    ) as QueuedSubmission<T>[];
    
    queue.push({
      id: Math.random().toString(36).slice(2),
      formId,
      data,
      timestamp: Date.now(),
    });
    
    localStorage.setItem('offlineSubmissionQueue', JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to queue offline submission:', error);
  }
};

export const getOfflineQueue = <T extends Record<string, any>>(): QueuedSubmission<T>[] => {
  try {
    return JSON.parse(localStorage.getItem('offlineSubmissionQueue') || '[]');
  } catch (error) {
    console.error('Failed to get offline queue:', error);
    return [];
  }
};

export const removeFromOfflineQueue = (id: string): void => {
  try {
    const queue = JSON.parse(localStorage.getItem('offlineSubmissionQueue') || '[]');
    const filtered = queue.filter((item: QueuedSubmission<any>) => item.id !== id);
    localStorage.setItem('offlineSubmissionQueue', JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove from offline queue:', error);
  }
};

// Layout shift prevention
export const calculateFormHeight = (form: HTMLElement): number => {
  const clone = form.cloneNode(true) as HTMLElement;
  clone.style.visibility = 'hidden';
  clone.style.position = 'absolute';
  document.body.appendChild(clone);
  const height = clone.offsetHeight;
  document.body.removeChild(clone);
  return height;
};
