import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Toast, ToastType } from '../components/feedback/Toast';
import { useStaggeredMotion } from '../hooks/useMotion';
import styles from './ToastContext.module.css';

// Define toast data structure
interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Context state
interface ToastContextState {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
}

// Initial context value
const initialContext: ToastContextState = {
  toasts: [],
  addToast: () => '',
  removeToast: () => {},
  removeAllToasts: () => {},
};

// Toast reducer actions
type ToastAction = 
  | { type: 'ADD_TOAST'; payload: ToastData }
  | { type: 'REMOVE_TOAST'; payload: { id: string } }
  | { type: 'REMOVE_ALL_TOASTS' };

// Reducer function to manage toast state
function toastReducer(state: ToastData[], action: ToastAction): ToastData[] {
  switch (action.type) {
    case 'ADD_TOAST':
      return [...state, action.payload];
    case 'REMOVE_TOAST':
      return state.filter(toast => toast.id !== action.payload.id);
    case 'REMOVE_ALL_TOASTS':
      return [];
    default:
      return state;
  }
}

// Create context
const ToastContext = createContext<ToastContextState>(initialContext);

// Generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Toast provider component
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  
  // Get staggered animation state for multiple toasts
  const animationStates = useStaggeredMotion(toasts.length, { delay: 100 });
  
  // Add a new toast
  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = generateId();
    dispatch({
      type: 'ADD_TOAST',
      payload: { ...toast, id },
    });
    return id;
  };
  
  // Remove a specific toast
  const removeToast = (id: string) => {
    dispatch({
      type: 'REMOVE_TOAST',
      payload: { id },
    });
  };
  
  // Remove all toasts
  const removeAllToasts = () => {
    dispatch({ type: 'REMOVE_ALL_TOASTS' });
  };
  
  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        removeAllToasts,
      }}
    >
      {children}
      
      {/* Toast container rendered at the end of the component tree */}
      {toasts.length > 0 && (
        <div className={styles.toastContainer} role="region" aria-label="Notifications">
          {toasts.map((toast, index) => (
            <div 
              key={toast.id}
              className={animationStates[index] ? styles.toastVisible : styles.toastHidden}
            >
              <Toast
                type={toast.type}
                message={toast.message}
                duration={toast.duration}
                action={toast.action}
                onClose={() => removeToast(toast.id)}
              />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

// Custom hook to use toast context
export function useToast() {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
}
