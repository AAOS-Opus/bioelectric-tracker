import React, { useState, useEffect } from 'react';
import { Button } from '../interactive/Button';
import { FormInput } from '../interactive/FormInput';
import { useToast } from '../../context/ToastContext';
import { usePersistedForm } from '../../hooks/usePersistedForm';
import styles from './TestForm.module.css';

interface FormData {
  name: string;
  email: string;
  date: string;
  notes: string;
}

const initialData: FormData = {
  name: '',
  email: '',
  date: '',
  notes: ''
};

// Form validators
const validators = {
  name: (value: string) => 
    !value.trim() ? 'Name is required' : undefined,
  
  email: (value: string) => {
    if (!value.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Invalid email format';
    }
    return undefined;
  },
  
  date: (value: string) => 
    !value ? 'Date is required' : undefined
};

export function TestForm() {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    formData,
    errors,
    updateFormData,
    clearForm,
    validateForm,
    hasUnsavedChanges
  } = usePersistedForm<FormData>({
    storageKey: 'test-form',
    initialData,
    validateOnLoad: true,
    expirationMinutes: 30
  });

  // Warn user about unsaved changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData(
      name as keyof FormData,
      value,
      validators[name as keyof typeof validators]
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(validators)) {
      addToast({
        type: 'error',
        message: 'Please fix the errors in the form',
        duration: 5000
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      addToast({
        type: 'success',
        message: 'Form submitted successfully!',
        duration: 5000
      });
      
      // Reset form
      clearForm();
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to submit form. Please try again.',
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <FormInput
        label="Full Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
        disabled={isSubmitting}
      />
      
      <FormInput
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
        disabled={isSubmitting}
      />
      
      <FormInput
        label="Date"
        name="date"
        type="date"
        value={formData.date}
        onChange={handleChange}
        error={errors.date}
        required
        disabled={isSubmitting}
      />
      
      <FormInput
        label="Additional Notes"
        name="notes"
        value={formData.notes}
        onChange={handleChange}
        disabled={isSubmitting}
      />
      
      <div className={styles.actions}>
        <Button
          type="button"
          variant="outline"
          isDisabled={isSubmitting}
          onClick={clearForm}
        >
          Reset
        </Button>
        
        <Button
          type="submit"
          isLoading={isSubmitting}
          loadingText="Submitting..."
          isDisabled={isSubmitting}
        >
          Submit
        </Button>
      </div>
    </form>
  );
}
