import { useEffect, useState, useCallback, useRef } from 'react';

interface MotionConfig {
  duration?: number;
  delay?: number;
  easing?: string;
}

interface LoadingConfig extends MotionConfig {
  estimatedTime?: number;
  showEstimate?: boolean;
}

export function useLoadingState(initialState = false, config: LoadingConfig = {}) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const estimatedTimeRef = useRef(config.estimatedTime || 0);

  const start = useCallback(() => {
    setIsLoading(true);
    startTimeRef.current = Date.now();
    setProgress(0);
    if (config.showEstimate && estimatedTimeRef.current > 0) {
      setTimeRemaining(estimatedTimeRef.current);
    }
  }, [config.showEstimate]);

  const stop = useCallback((success = true) => {
    const duration = Date.now() - startTimeRef.current;
    // Update estimated time using exponential moving average
    if (duration > 0) {
      estimatedTimeRef.current = estimatedTimeRef.current === 0
        ? duration
        : Math.round(0.7 * estimatedTimeRef.current + 0.3 * duration);
    }
    setIsLoading(false);
    setProgress(100);
    setTimeRemaining(null);
  }, []);

  useEffect(() => {
    if (isLoading && config.showEstimate) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const estimated = estimatedTimeRef.current;
        if (estimated > 0) {
          const newProgress = Math.min(90, (elapsed / estimated) * 100);
          setProgress(newProgress);
          setTimeRemaining(Math.max(0, Math.round((estimated - elapsed) / 1000)));
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isLoading, config.showEstimate]);

  return {
    isLoading,
    progress,
    timeRemaining,
    start,
    stop
  };
}

export function useStaggeredMotion(count: number, config: MotionConfig = {}) {
  const [items, setItems] = useState<boolean[]>([]);
  
  useEffect(() => {
    const delay = config.delay || 50;
    const newItems: boolean[] = new Array(count).fill(false);
    
    const timeouts = newItems.map((_, index) => {
      return setTimeout(() => {
        setItems(prev => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
      }, index * delay);
    });
    
    return () => timeouts.forEach(clearTimeout);
  }, [count, config.delay]);
  
  return items;
}

export function usePreferredMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
}

export function useAnimationFrame(callback: (deltaTime: number) => void) {
  const requestRef = useRef<number | undefined>(undefined);
  const previousTimeRef = useRef<number | undefined>(undefined);
  
  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);
  
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);
}

export function useFocusManagement() {
  const previousFocus = useRef<HTMLElement | null>(null);
  
  const trapFocus = useCallback((element: HTMLElement) => {
    previousFocus.current = document.activeElement as HTMLElement;
    
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
    
    const handleTab = (e: KeyboardEvent) => {
      if (!element.contains(document.activeElement)) {
        (focusableElements[0] as HTMLElement).focus();
        e.preventDefault();
      }
    };
    
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);
  
  const restoreFocus = useCallback(() => {
    if (previousFocus.current) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, []);
  
  return { trapFocus, restoreFocus };
}
