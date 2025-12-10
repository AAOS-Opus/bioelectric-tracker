import React, { createContext, useContext, useCallback, useState, useMemo } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { DateConfig } from './date-utils';
import { defaultConfig, parseDate, formatDate, isDateInRange, isDateDisabled } from './date-utils';

interface DatePickerState {
  selectedDate: Date | null;
  selectedRange: [Date | null, Date | null];
  viewDate: Date;
  isOpen: boolean;
  isMobile: boolean;
  view: 'days' | 'months' | 'years';
}

interface DatePickerContextValue extends DatePickerState {
  config: DateConfig;
  setSelectedDate: (date: Date | null) => void;
  setSelectedRange: (range: [Date | null, Date | null]) => void;
  setViewDate: (date: Date) => void;
  setView: (view: 'days' | 'months' | 'years') => void;
  openPicker: () => void;
  closePicker: () => void;
  handleDateSelect: (date: Date) => void;
  handleRangeSelect: (date: Date) => void;
  formatSelectedDate: () => string;
  formatSelectedRange: () => string;
  isSelected: (date: Date) => boolean;
  isInRange: (date: Date) => boolean;
  isRangeStart: (date: Date) => boolean;
  isRangeEnd: (date: Date) => boolean;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
}

const DatePickerContext = createContext<DatePickerContextValue | null>(null);

interface DatePickerProviderProps {
  children: React.ReactNode;
  config?: Partial<DateConfig>;
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date | null) => void;
  onRangeChange?: (range: [Date | null, Date | null]) => void;
  isRange?: boolean;
}

export function DatePickerProvider({
  children,
  config: userConfig,
  value,
  defaultValue,
  onChange,
  onRangeChange,
  isRange = false,
}: DatePickerProviderProps) {
  const config = useMemo(() => ({ ...defaultConfig, ...userConfig }), [userConfig]);
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  // State
  const [state, setState] = useState<DatePickerState>(() => ({
    selectedDate: value ?? defaultValue ?? null,
    selectedRange: [null, null],
    viewDate: value ?? defaultValue ?? new Date(),
    isOpen: false,
    isMobile,
    view: 'days',
  }));

  // Memoized state updates
  const setSelectedDate = useCallback((date: Date | null) => {
    setState(prev => ({ ...prev, selectedDate: date }));
    onChange?.(date);
  }, [onChange]);

  const setSelectedRange = useCallback((range: [Date | null, Date | null]) => {
    setState(prev => ({ ...prev, selectedRange: range }));
    onRangeChange?.(range);
  }, [onRangeChange]);

  const setViewDate = useCallback((date: Date) => {
    setState(prev => ({ ...prev, viewDate: date }));
  }, []);

  const setView = useCallback((view: 'days' | 'months' | 'years') => {
    setState(prev => ({ ...prev, view }));
  }, []);

  const openPicker = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
  }, []);

  const closePicker = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Date selection handlers
  const handleDateSelect = useCallback((date: Date) => {
    if (!isDateInRange(date, config) || isDateDisabled(date, config)) {
      return;
    }

    setSelectedDate(date);
    closePicker();
  }, [config, setSelectedDate, closePicker]);

  const handleRangeSelect = useCallback((date: Date) => {
    if (!isDateInRange(date, config) || isDateDisabled(date, config)) {
      return;
    }

    setState(prev => {
      const [start, end] = prev.selectedRange;
      
      if (!start || (start && end)) {
        return { ...prev, selectedRange: [date, null] };
      }
      
      if (date < start) {
        return { ...prev, selectedRange: [date, start] };
      }
      
      return { ...prev, selectedRange: [start, date], isOpen: false };
    });
  }, [config]);

  // Formatting helpers
  const formatSelectedDate = useCallback(() => {
    if (!state.selectedDate) return '';
    return formatDate(state.selectedDate, config);
  }, [state.selectedDate, config]);

  const formatSelectedRange = useCallback(() => {
    const [start, end] = state.selectedRange;
    if (!start) return '';
    if (!end) return formatDate(start, config);
    return `${formatDate(start, config)} - ${formatDate(end, config)}`;
  }, [state.selectedRange, config]);

  // Date checking helpers
  const isSelected = useCallback((date: Date) => {
    return state.selectedDate ? state.selectedDate.getTime() === date.getTime() : false;
  }, [state.selectedDate]);

  const isInRange = useCallback((date: Date) => {
    const [start, end] = state.selectedRange;
    if (!start || !end) return false;
    return date >= start && date <= end;
  }, [state.selectedRange]);

  const isRangeStart = useCallback((date: Date) => {
    const [start] = state.selectedRange;
    return start ? start.getTime() === date.getTime() : false;
  }, [state.selectedRange]);

  const isRangeEnd = useCallback((date: Date) => {
    const [, end] = state.selectedRange;
    return end ? end.getTime() === date.getTime() : false;
  }, [state.selectedRange]);

  // Navigation constraints
  const canNavigateBack = useMemo(() => {
    if (!config.minDate) return true;
    return state.viewDate > config.minDate;
  }, [config.minDate, state.viewDate]);

  const canNavigateForward = useMemo(() => {
    if (!config.maxDate) return true;
    return state.viewDate < config.maxDate;
  }, [config.maxDate, state.viewDate]);

  const contextValue = useMemo(
    () => ({
      ...state,
      config,
      setSelectedDate,
      setSelectedRange,
      setViewDate,
      setView,
      openPicker,
      closePicker,
      handleDateSelect,
      handleRangeSelect,
      formatSelectedDate,
      formatSelectedRange,
      isSelected,
      isInRange,
      isRangeStart,
      isRangeEnd,
      canNavigateBack,
      canNavigateForward,
    }),
    [
      state,
      config,
      setSelectedDate,
      setSelectedRange,
      setViewDate,
      setView,
      openPicker,
      closePicker,
      handleDateSelect,
      handleRangeSelect,
      formatSelectedDate,
      formatSelectedRange,
      isSelected,
      isInRange,
      isRangeStart,
      isRangeEnd,
      canNavigateBack,
      canNavigateForward,
    ]
  );

  return (
    <DatePickerContext.Provider value={contextValue}>
      {children}
    </DatePickerContext.Provider>
  );
}

export function useDatePicker() {
  const context = useContext(DatePickerContext);
  if (!context) {
    throw new Error('useDatePicker must be used within a DatePickerProvider');
  }
  return context;
}

// Custom hook for date input
export function useDateInput(options: {
  format?: string;
  onChange?: (date: Date | null) => void;
}) {
  const { config } = useDatePicker();
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    (value: string) => {
      setInputValue(value);
      setError(null);

      if (!value) {
        options.onChange?.(null);
        return;
      }

      const date = parseDate(value, {
        ...config,
        format: options.format || config.format,
      });

      if (!date) {
        setError('Invalid date format');
        return;
      }

      if (!isDateInRange(date, config)) {
        setError('Date is out of allowed range');
        return;
      }

      if (isDateDisabled(date, config)) {
        setError('This date is not available');
        return;
      }

      options.onChange?.(date);
    },
    [config, options]
  );

  return {
    inputValue,
    error,
    handleChange,
  };
}
