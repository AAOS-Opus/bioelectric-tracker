import React, { useState, useRef, useEffect } from 'react';
import { format, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { JournalEntry } from '@/types/journal';
import { Phase } from '@/types/user';
import { useUser } from '@/hooks/useUser';

interface JournalTimelineProps {
  entries: JournalEntry[];
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}

const JournalTimeline: React.FC<JournalTimelineProps> = ({
  entries,
  onSelectDate,
  selectedDate
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [animationDirection, setAnimationDirection] = useState<'next' | 'prev' | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const { user, phases } = useUser();

  // Get days in the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get entries for each day
  const getEntriesForDay = (day: Date) => {
    return entries.filter(entry => isSameDay(new Date(entry.date), day));
  };

  // Get phase for a particular date
  const getPhaseForDate = (date: Date): Phase | null => {
    if (!phases) return null;
    
    return phases.find(phase => {
      const startDate = new Date(phase.startDate);
      const endDate = phase.endDate ? new Date(phase.endDate) : new Date();
      return date >= startDate && date <= endDate;
    }) || null;
  };

  // Navigate to previous month
  const prevMonth = () => {
    setAnimationDirection('prev');
    setTimeout(() => {
      setCurrentMonth(subMonths(currentMonth, 1));
    }, 50);
  };

  // Navigate to next month
  const nextMonth = () => {
    setAnimationDirection('next');
    setTimeout(() => {
      setCurrentMonth(addMonths(currentMonth, 1));
    }, 50);
  };

  // Handle animation end
  useEffect(() => {
    const resetAnimation = () => setAnimationDirection(null);
    
    if (timelineRef.current && animationDirection) {
      timelineRef.current.addEventListener('animationend', resetAnimation);
      
      return () => {
        timelineRef.current?.removeEventListener('animationend', resetAnimation);
      };
    }
  }, [animationDirection]);

  // Scroll to selected date when visible
  useEffect(() => {
    if (isSameMonth(selectedDate, currentMonth) && timelineRef.current) {
      const dayElement = timelineRef.current.querySelector(`[data-date="${format(selectedDate, 'yyyy-MM-dd')}"]`);
      if (dayElement) {
        dayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedDate, currentMonth]);

  return (
    <div className="journal-timeline" data-testid="journal-timeline">
      <div className="timeline-header">
        <button 
          className="month-nav-btn" 
          onClick={prevMonth} 
          aria-label="Previous month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <h2 className="timeline-month">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button 
          className="month-nav-btn" 
          onClick={nextMonth} 
          aria-label="Next month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div 
        className={`timeline-days ${animationDirection ? `slide-${animationDirection}` : ''}`}
        ref={timelineRef}
        role="grid"
        aria-label={`Calendar for ${format(currentMonth, 'MMMM yyyy')}`}
      >
        <div className="timeline-weekdays" role="row">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday" role="columnheader">
              {day}
            </div>
          ))}
        </div>
        
        <div className="timeline-grid" role="rowgroup">
          {/* Group days into weeks for proper ARIA structure */}
          {Array.from({ length: Math.ceil(daysInMonth.length / 7) }, (_, weekIndex) => (
            <div key={`week-${weekIndex}`} className="timeline-week" role="row">
              {daysInMonth.slice(weekIndex * 7, weekIndex * 7 + 7).map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayEntries = getEntriesForDay(day);
                const hasEntries = dayEntries.length > 0;
                const isSelected = isSameDay(day, selectedDate);
                const phase = getPhaseForDate(day);
                
                return (
                  <div 
                    key={dateStr} 
                    className={`timeline-day ${isSelected ? 'selected' : ''} ${hasEntries ? 'has-entries' : ''} phase-${phase?.id || 'none'}`}
                    role="gridcell"
                    aria-selected={isSelected ? 'true' : 'false'}
                    data-date={dateStr}
                  >
                    <div className="timeline-day-inner" onClick={() => onSelectDate(day)}>
                      <div className="day-number">{format(day, 'd')}</div>
                      {hasEntries && (
                        <div className="entry-indicators">
                          {dayEntries.map((entry) => (
                            <div 
                              key={entry.id} 
                              className={`entry-dot emotion-${entry.emotion.toLowerCase()}`}
                              aria-label={`${entry.title} - ${entry.emotion} mood`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .journal-timeline {
          display: flex;
          flex-direction: column;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .timeline-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .timeline-month {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
          color: #111827;
        }

        .month-nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border: none;
          border-radius: 50%;
          background-color: #f3f4f6;
          color: #4b5563;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .month-nav-btn:hover {
          background-color: #e5e7eb;
        }

        .timeline-days {
          padding: 0.5rem;
        }

        .timeline-days.slide-next {
          animation: slideNext 0.3s ease-in-out;
        }

        .timeline-days.slide-prev {
          animation: slidePrev 0.3s ease-in-out;
        }

        @keyframes slideNext {
          from { opacity: 0; transform: translateX(10%); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slidePrev {
          from { opacity: 0; transform: translateX(-10%); }
          to { opacity: 1; transform: translateX(0); }
        }

        .timeline-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 0.5rem;
        }

        .weekday {
          text-align: center;
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
          padding: 0.5rem 0;
        }

        .timeline-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.25rem;
        }

        .timeline-day {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          height: 4rem;
          border-radius: 6px;
          padding: 0.25rem;
          cursor: pointer;
          position: relative;
          border: 1px solid #e5e7eb;
        }

        .timeline-day-inner {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
        }

        .timeline-day.selected {
          border-color: #4f46e5;
        }

        .day-number {
          font-size: 0.875rem;
          font-weight: 500;
          color: #4b5563;
        }

        .entry-indicators {
          display: flex;
          gap: 3px;
          margin-top: auto;
          padding-bottom: 0.25rem;
        }

        .entry-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .emotion-joyful {
          background-color: #fbbf24;
        }

        .emotion-optimistic {
          background-color: #a3e635;
        }

        .emotion-content {
          background-color: #34d399;
        }

        .emotion-neutral {
          background-color: #60a5fa;
        }

        .emotion-fatigued {
          background-color: #818cf8;
        }

        .emotion-anxious {
          background-color: #a78bfa;
        }

        .emotion-frustrated {
          background-color: #f472b6;
        }

        .emotion-discouraged {
          background-color: #fb7185;
        }

        .timeline-day.has-entries {
          font-weight: 600;
        }

        .phase-1 {
          background-color: #fbbf24;
        }

        .phase-2 {
          background-color: #a3e635;
        }

        .phase-3 {
          background-color: #34d399;
        }

        .phase-4 {
          background-color: #60a5fa;
        }

        .phase-5 {
          background-color: #818cf8;
        }

        .phase-6 {
          background-color: #a78bfa;
        }

        .phase-7 {
          background-color: #f472b6;
        }

        .phase-8 {
          background-color: #fb7185;
        }

        @media (max-width: 640px) {
          .timeline-grid {
            grid-template-columns: repeat(7, 1fr);
          }
          
          .timeline-day {
            height: 3.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default JournalTimeline;
