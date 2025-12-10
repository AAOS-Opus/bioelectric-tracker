'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import { prefersReducedMotion } from '@/lib/motion';

interface MotionContextType {
  intensity: 'subtle' | 'standard' | 'expressive';
  reducedMotion: boolean;
  performanceMode: 'high' | 'balanced' | 'battery-saving';
  setIntensity: (intensity: 'subtle' | 'standard' | 'expressive') => void;
  setPerformanceMode: (mode: 'high' | 'balanced' | 'battery-saving') => void;
}

const MotionContext = createContext<MotionContextType | undefined>(undefined);

interface MotionProviderProps {
  children: ReactNode;
}

export function MotionProvider({ children }: MotionProviderProps) {
  const [intensity, setIntensity] = useState<'subtle' | 'standard' | 'expressive'>('standard');
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion());
  const [performanceMode, setPerformanceMode] = useState<'high' | 'balanced' | 'battery-saving'>('balanced');

  // Listen for reduced motion preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for battery status changes
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updatePerformanceMode = () => {
          if (battery.charging) {
            setPerformanceMode('high');
          } else if (battery.level <= 0.2) {
            setPerformanceMode('battery-saving');
          } else {
            setPerformanceMode('balanced');
          }
        };

        battery.addEventListener('levelchange', updatePerformanceMode);
        battery.addEventListener('chargingchange', updatePerformanceMode);
        
        return () => {
          battery.removeEventListener('levelchange', updatePerformanceMode);
          battery.removeEventListener('chargingchange', updatePerformanceMode);
        };
      });
    }
  }, []);

  const value = {
    intensity,
    reducedMotion,
    performanceMode,
    setIntensity,
    setPerformanceMode
  };

  return (
    <MotionContext.Provider value={value}>
      {children}
    </MotionContext.Provider>
  );
}

export function useMotionContext() {
  const context = useContext(MotionContext);
  if (context === undefined) {
    throw new Error('useMotionContext must be used within a MotionProvider');
  }
  return context;
}

// Motion settings component for user preferences
interface MotionSettingsProps {
  className?: string;
}

export function MotionSettings({ className }: MotionSettingsProps) {
  const { intensity, setIntensity, performanceMode, setPerformanceMode } = useMotionContext();

  return (
    <div className={className}>
      <div className="space-y-4">
        <div>
          <label htmlFor="animation-intensity" className="text-sm font-medium">
            Animation Intensity
          </label>
          <select
            id="animation-intensity"
            value={intensity}
            onChange={(e) => setIntensity(e.target.value as any)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            aria-label="Select animation intensity"
          >
            <option value="subtle">Subtle</option>
            <option value="standard">Standard</option>
            <option value="expressive">Expressive</option>
          </select>
        </div>

        <div>
          <label htmlFor="performance-mode" className="text-sm font-medium">
            Performance Mode
          </label>
          <select
            id="performance-mode"
            value={performanceMode}
            onChange={(e) => setPerformanceMode(e.target.value as any)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            aria-label="Select performance mode"
          >
            <option value="high">High Performance</option>
            <option value="balanced">Balanced</option>
            <option value="battery-saving">Battery Saving</option>
          </select>
        </div>
      </div>
    </div>
  );
}
