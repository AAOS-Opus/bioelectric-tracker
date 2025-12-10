import { useState, useEffect, useCallback } from 'react';

interface UsePersistedFormOptions<T> {
  storageKey: string;
  initialData: T;
  validateOnLoad?: boolean;
  expirationMinutes?: number;
}

interface StoredData<T> {
  data: T;
  timestamp: number;
}

// Safe check for browser environment
const isBrowser = typeof window !== 'undefined';

// Safe localStorage access
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('Error accessing localStorage:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Error setting localStorage:', error);
    }
  },
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Error removing from localStorage:', error);
    }
  }
};

export function usePersistedForm<T extends Record<string, any>>({
  storageKey,
  initialData,
  validateOnLoad = false,
  expirationMinutes = 60
}: UsePersistedFormOptions<T>) {
  const [formData, setFormData] = useState<T>(() => {
    try {
      const stored = safeLocalStorage.getItem(storageKey);
      if (stored) {
        const { data, timestamp }: StoredData<T> = JSON.parse(stored);
        
        // Check if data has expired
        const now = Date.now();
        const expirationTime = timestamp + (expirationMinutes * 60 * 1000);
        
        if (now < expirationTime) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Error loading persisted form data:', error);
    }
    
    return initialData;
  });

  const [errors, setErrors] = useState<Partial<T>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Persist form data whenever it changes
  useEffect(() => {
    if (isDirty) {
      try {
        const storedData: StoredData<T> = {
          data: formData,
          timestamp: Date.now()
        };
        safeLocalStorage.setItem(storageKey, JSON.stringify(storedData));
      } catch (error) {
        console.warn('Error saving form data:', error);
      }
    }
  }, [formData, storageKey, isDirty]);

  // Handle browser storage events for multi-tab sync
  useEffect(() => {
    if (!isBrowser) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        try {
          const { data }: StoredData<T> = JSON.parse(event.newValue);
          setFormData(data);
        } catch (error) {
          console.warn('Error syncing form data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  // Update form data with validation
  const updateFormData = useCallback((
    name: keyof T,
    value: any,
    validator?: (value: any) => string | undefined
  ) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    setIsDirty(true);

    if (validator) {
      const error = validator(value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    } else if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  // Clear form data and storage
  const clearForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setIsDirty(false);
    safeLocalStorage.removeItem(storageKey);
  }, [initialData, storageKey]);

  // Validate entire form
  const validateForm = useCallback((validators: Partial<Record<keyof T, (value: any) => string | undefined>>) => {
    const newErrors: Partial<T> = {};
    let isValid = true;

    Object.keys(validators).forEach(key => {
      const validator = validators[key as keyof T];
      if (validator) {
        const error = validator(formData[key as keyof T]);
        if (error) {
          newErrors[key as keyof T] = error as any;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData]);

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return isDirty && Object.keys(formData).some(key => 
      formData[key] !== initialData[key]
    );
  }, [formData, initialData, isDirty]);

  return {
    formData,
    errors,
    updateFormData,
    clearForm,
    validateForm,
    hasUnsavedChanges,
    isDirty
  };
}
