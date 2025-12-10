import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDatePicker } from './date-context';
import {
  generateCalendarGrid,
  getWeekDayNames,
  getMonthNames,
  isToday,
  navigateMonth,
  navigateYear,
  isDateInRange,
} from './date-utils';

interface CalendarProps {
  className?: string;
}

export function Calendar({ className }: CalendarProps): React.ReactElement {
  const {
    viewDate,
    setViewDate,
    view,
    setView,
    handleDateSelect,
    handleRangeSelect,
    isSelected,
    isInRange,
    isRangeStart,
    isRangeEnd,
    config,
    canNavigateBack,
    canNavigateForward,
  } = useDatePicker();

  const gridRef = React.useRef<HTMLDivElement>(null);

  // Focus management
  React.useEffect(() => {
    if (view === 'days' && gridRef.current) {
      const selectedCell = gridRef.current.querySelector('[aria-selected="true"]');
      const todayCell = gridRef.current.querySelector('[data-today="true"]');
      const firstCell = gridRef.current.querySelector('[role="gridcell"]');
      
      const targetCell = selectedCell || todayCell || firstCell;
      if (targetCell instanceof HTMLElement) {
        targetCell.focus();
      }
    }
  }, [view, viewDate]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const { key } = e;
    
    switch (key) {
      case 'ArrowLeft':
        e.preventDefault();
        setViewDate(navigateMonth(viewDate, 'prev'));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setViewDate(navigateMonth(viewDate, 'next'));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (e.altKey) {
          setView('months');
        } else {
          setViewDate(navigateYear(viewDate, 'prev'));
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (e.altKey) {
          setView('days');
        } else {
          setViewDate(navigateYear(viewDate, 'next'));
        }
        break;
      case 'Home':
        e.preventDefault();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1));
        break;
      case 'End':
        e.preventDefault();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0));
        break;
      case 'PageUp':
        e.preventDefault();
        setViewDate(navigateMonth(viewDate, 'prev'));
        break;
      case 'PageDown':
        e.preventDefault();
        setViewDate(navigateMonth(viewDate, 'next'));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (e.currentTarget.hasAttribute('data-date')) {
          const date = new Date(e.currentTarget.getAttribute('data-date')!);
          handleDateSelect(date);
        }
        break;
    }
  };

  // Render calendar grid
  const renderDays = () => {
    const weeks = generateCalendarGrid(viewDate, config);
    const weekDays = getWeekDayNames(config);

    return (
      <div
        ref={gridRef}
        className="w-full"
        onKeyDown={handleKeyDown}
      >
        {/* Calendar header with day names */}
        <div className="grid grid-cols-7 mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className="h-8 flex items-center justify-center"
              aria-label={day}
            >
              {day.charAt(0)}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-rows-6">
          {weeks.map((week, i) => (
            <div
              key={i}
              className="grid grid-cols-7"
            >
              {week.map((date, j) => {
                const isDisabled = !isDateInRange(date, config);
                const isSelectedDate = isSelected(date);
                const isWithinRange = isInRange(date);
                const isStart = isRangeStart(date);
                const isEnd = isRangeEnd(date);
                const isCurrent = isToday(date);
                const isCurrentMonth = date.getMonth() === viewDate.getMonth();

                // Create button elements with proper attributes based on conditions
                const buttonElement = React.createElement(
                  'button',
                  {
                    type: 'button',
                    tabIndex: isSelectedDate || isCurrent ? 0 : -1,
                    disabled: isDisabled,
                    'aria-label': date.toLocaleDateString(),
                    'aria-selected': isSelectedDate ? 'true' : 'false',
                    className: cn(
                      'w-full h-9 flex items-center justify-center text-sm rounded-md relative',
                      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:z-10',
                      'transition-colors duration-200',
                      isDisabled && 'text-gray-300 dark:text-gray-600 cursor-not-allowed',
                      !isDisabled && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800',
                      isSelectedDate && 'bg-primary text-primary-foreground hover:bg-primary/90',
                      isWithinRange && 'bg-primary/10 dark:bg-primary/20',
                      isStart && 'rounded-r-none',
                      isEnd && 'rounded-l-none',
                      !isCurrentMonth && 'text-gray-400 dark:text-gray-500',
                      isCurrent && !isSelectedDate && 'border-2 border-primary'
                    ),
                    onClick: () => !isDisabled && handleDateSelect(date)
                  },
                  date.getDate()
                );

                return (
                  <div key={j} className="p-0">
                    {buttonElement}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render month selection
  const renderMonths = () => {
    const months = getMonthNames(config);
    const currentMonth = viewDate.getMonth();

    return (
      <div
        className="grid grid-cols-3 gap-2 p-2"
        onKeyDown={handleKeyDown}
      >
        {months.map((month, i) => {
          // Generate the button with the correct attributes based on whether it's selected
          if (i === currentMonth) {
            return (
              <button
                key={i}
                type="button"
                tabIndex={0}
                aria-pressed="true"
                className={cn(
                  'h-12 flex items-center justify-center text-sm rounded-md',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20',
                  'transition-colors duration-200',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'bg-primary text-primary-foreground'
                )}
                onClick={() => {
                  setViewDate(new Date(viewDate.getFullYear(), i, 1));
                  setView('days');
                }}
              >
                {month}
              </button>
            );
          } else {
            return (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                aria-pressed="false"
                className={cn(
                  'h-12 flex items-center justify-center text-sm rounded-md',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20',
                  'transition-colors duration-200',
                  'hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
                onClick={() => {
                  setViewDate(new Date(viewDate.getFullYear(), i, 1));
                  setView('days');
                }}
              >
                {month}
              </button>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'p-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg',
        'border border-gray-200 dark:border-gray-800',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          disabled={!canNavigateBack}
          className={cn(
            'p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          onClick={() => setViewDate(navigateMonth(viewDate, 'prev'))}
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          className={cn(
            'px-4 py-2 text-sm font-medium',
            'hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md',
            'focus:outline-none focus:ring-2 focus:ring-primary/20'
          )}
          onClick={() => setView(view === 'days' ? 'months' : 'days')}
        >
          {view === 'days'
            ? `${getMonthNames(config)[viewDate.getMonth()]} ${viewDate.getFullYear()}`
            : viewDate.getFullYear()}
        </button>

        <button
          type="button"
          disabled={!canNavigateForward}
          className={cn(
            'p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          onClick={() => setViewDate(navigateMonth(viewDate, 'next'))}
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="relative">
        {view === 'days' ? renderDays() : renderMonths()}
      </div>
    </div>
  );
}
