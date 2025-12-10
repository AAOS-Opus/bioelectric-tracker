'use client';

import { motion } from 'framer-motion';
import { Check, X, Edit } from 'lucide-react';
import { formatTime, formatDuration, getTimeFromMinutes } from './utils';
import { ModalitySession } from '../WeeklySchedule';
import { cn } from '@/lib/utils';

interface SessionBlockProps {
  session: ModalitySession;
  provided: any;
  isDragging: boolean;
  timeIncrement: number;
  isSelected: boolean;
  onClick: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

export default function SessionBlock({
  session,
  provided,
  isDragging,
  timeIncrement,
  isSelected,
  onClick,
  onComplete,
  onDelete
}: SessionBlockProps) {
  const { hours, minutes } = getTimeFromMinutes(session.startTime);
  const startTime = formatTime(session.startTime);
  const endTime = formatTime(session.startTime + session.duration);

  // Calculate position and size
  const rowHeight = 12; // 3rem height for each time slot
  const top = (session.startTime / timeIncrement) * rowHeight;
  const height = (session.duration / timeIncrement) * rowHeight;

  return (
    <motion.div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        boxShadow: isDragging 
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
          : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'absolute left-0 right-0 mx-1 rounded-lg p-2 text-white',
        'flex flex-col justify-between',
        isSelected ? 'ring-2 ring-white' : '',
        session.completed ? 'opacity-70' : 'opacity-100'
      )}
      style={{
        backgroundColor: session.color,
        top: `${top}px`,
        height: `${Math.max(height, 24)}px`, // Minimum height
        ...provided.draggableProps.style,
      }}
      onClick={onClick}
      // Accessibility attributes
      role="button"
      tabIndex={0}
      aria-label={`${session.modalityType} session from ${startTime} to ${endTime}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="font-medium truncate">
            {session.title || session.modalityType}
          </span>
          <span className="text-xs opacity-90">
            {startTime} - {endTime} ({formatDuration(session.duration)})
          </span>
        </div>
        
        {isSelected && (
          <div className="flex space-x-1">
            <button
              className="p-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              aria-label={session.completed ? "Mark as incomplete" : "Mark as complete"}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="Delete session"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      
      {session.recurring && (
        <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded mt-1 self-start">
          {session.recurring === 'daily' ? 'Daily' : 
            session.recurring === 'weekly' ? 'Weekly' : 'Recurring'}
        </span>
      )}
      
      {session.completed && (
        <div className="absolute inset-0 bg-black/10 rounded-lg flex items-center justify-center">
          <Check className="w-5 h-5" />
        </div>
      )}
    </motion.div>
  );
}
