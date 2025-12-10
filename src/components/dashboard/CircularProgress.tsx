'use client'

import React, { useEffect, useRef } from 'react';
import styles from '@/styles/CircularProgress.module.css';

export interface CircularProgressProps {
  phase: number;
  progress: number;
}

export default function CircularProgress({ phase, progress }: CircularProgressProps) {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  
  // Reference to the progress circle element
  const circleRef = useRef<SVGCircleElement>(null);
  
  useEffect(() => {
    // Calculate the stroke dash values
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;
    
    // Update CSS variables using the DOM API instead of inline styles
    if (circleRef.current) {
      circleRef.current.style.setProperty('--circumference', `${circumference}px`);
      circleRef.current.style.setProperty('--dashoffset', `${strokeDashoffset}px`);
    }
  }, [normalizedProgress]);
  
  return (
    <div className={styles.container}>
      <svg className={styles.svg}>
        <circle
          cx="96"
          cy="96"
          r="45"
          className={styles.backgroundCircle}
        />
        <circle
          ref={circleRef}
          cx="96"
          cy="96"
          r="45"
          className={`${styles.progressCircle} text-primary`}
        />
      </svg>
      
      <div className={styles.centerText}>
        <span className={styles.phaseNumber}>Phase {phase}</span>
        <span className={styles.progressText}>{normalizedProgress}% Complete</span>
      </div>
    </div>
  );
}
