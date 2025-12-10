import React, { useRef, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../button/button';
import { Calendar } from './calendar';
import { useDatePicker, useDateInput } from './date-context';
import { Popover, PopoverTrigger, PopoverContent } from '../popover';
import type { DateConfig } from './date-utils';

interface DatePickerProps {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  format?: string;
  config?: Partial<DateConfig>;
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date | null) => void;
  onRangeChange?: (range: [Date | null, Date | null]) => void;
  isRange?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  showPresets?: boolean;
}

export function DatePicker({
  className,
  inputClassName,
  placeholder = 'Select date',
  format,
  config,
  value,
  defaultValue,
  onChange,
  onRangeChange,
  isRange = false,
  disabled = false,
  clearable = true,
  showPresets = true,
}: DatePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isOpen,
    openPicker,
    closePicker,
    selectedDate,
    selectedRange,
    formatSelectedDate,
    formatSelectedRange,
    setSelectedDate,
    setSelectedRange,
  } = useDatePicker();

  const { inputValue, error, handleChange } = useDateInput({
    format,
    onChange: (date) => {
      if (date) {
        if (isRange) {
          setSelectedRange([date, null]);
        } else {
          setSelectedDate(date);
        }
      }
    },
  });

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        closePicker();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closePicker]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closePicker();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closePicker]);

  // Focus restoration
  useEffect(() => {
    if (!isOpen) {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  const displayValue = isRange
    ? formatSelectedRange()
    : formatSelectedDate() || inputValue;

  return (
    <div className={cn('relative inline-block', className)}>
      <div className="flex items-center">
        <input
          type="text"
          ref={inputRef}
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={openPicker}
          disabled={disabled}
          readOnly={false}
          {...(error ? { 'aria-invalid': 'true' } : { 'aria-invalid': 'false' })}
          aria-label={placeholder || "Date input"}
          aria-describedby={error ? "date-input-error" : undefined}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-md',
            'border border-gray-300 dark:border-gray-700',
            'bg-white dark:bg-gray-900',
            'text-gray-900 dark:text-gray-100',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500 dark:border-red-400',
            inputClassName
          )}
        />

        <Popover open={isOpen} onOpenChange={(open) => open ? openPicker() : closePicker()}>
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              variant="outline"
              size="icon"
              className="ml-2"
              disabled={disabled}
              onClick={() => isOpen ? closePicker() : openPicker()}
              aria-label="Choose date"
              aria-expanded={isOpen}
              aria-controls="date-picker-calendar"
            >
              <CalendarIcon className="w-4 h-4" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            id="date-picker-calendar"
            className="p-0"
            align="start"
            sideOffset={4}
          >
            <Calendar />

            {showPresets && (
              <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                <div className="flex justify-between">
                  {clearable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (isRange) {
                          setSelectedRange([null, null]);
                        } else {
                          setSelectedDate(null);
                        }
                        closePicker();
                      }}
                    >
                      Clear
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (isRange) {
                        setSelectedRange([new Date(), new Date()]);
                      } else {
                        setSelectedDate(new Date());
                      }
                      closePicker();
                    }}
                  >
                    Today
                  </Button>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {error && (
        <p
          id="date-input-error"
          className="mt-1 text-sm text-red-500 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
