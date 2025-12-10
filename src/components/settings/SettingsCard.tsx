'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SettingsCardProps {
  children: ReactNode;
  variant?: 'standard' | 'compact' | 'expanded';
  className?: string;
}

export function SettingsCard({ 
  children, 
  variant = 'standard',
  className 
}: SettingsCardProps) {
  const baseStyles = "bg-gray-800/90 rounded-xl border border-gray-700/30 shadow-lg shadow-black/20 overflow-hidden transition-all duration-300 hover:border-gray-600/40 hover:shadow-lg focus-within:border-primary/30 focus-within:shadow-lg focus-within:shadow-primary/5";
  
  const variantStyles = {
    standard: "p-6 space-y-4",
    compact: "p-4 space-y-2",
    expanded: "flex flex-col divide-y divide-gray-700/30"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(baseStyles, variantStyles[variant], className)}
    >
      {children}
    </motion.div>
  );
}
