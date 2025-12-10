/**
 * Timeline Navigator Component
 * 
 * This component provides an intuitive way to navigate through historical weekly snapshots
 * with date range selection and quick-jump controls.
 */

'use client'

import React, { useState, useCallback } from 'react';
import { format, subMonths, startOfDay, endOfDay, parseISO, isValid, isBefore, isAfter } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface TimelineNavigatorProps {
  currentStartDate: string;
  currentEndDate: string;
  onPrevious: () => void;
  onNext: () => void;
  onDateRangeChange: (startDate: string, endDate: string) => void;
  hasNext: boolean;
}

const TimelineNavigator: React.FC<TimelineNavigatorProps> = ({
  currentStartDate,
  currentEndDate,
  onPrevious,
  onNext,
  onDateRangeChange,
  hasNext
}) => {
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedRange, setSelectedRange] = useState<{start: Date | undefined, end: Date | undefined}>({
    start: parseISO(currentStartDate),
    end: parseISO(currentEndDate)
  });
  
  // Parse dates for display
  const startDate = parseISO(currentStartDate);
  const endDate = parseISO(currentEndDate);
  
  // Validate dates
  if (!isValid(startDate) || !isValid(endDate)) {
    console.error('Invalid date format received');
    return null;
  }
  
  // Format dates for display
  const formattedStartDate = format(startDate, 'MMM d, yyyy');
  const formattedEndDate = format(endDate, 'MMM d, yyyy');
  
  // Handle quick jump selections with validation
  const handleQuickJump = useCallback(async (months: number) => {
    try {
      setIsLoading(true);
      const today = new Date();
      const newEndDate = today;
      const newStartDate = subMonths(today, months);
      
      // Format dates for API
      const formattedStart = format(startOfDay(newStartDate), 'yyyy-MM-dd');
      const formattedEnd = format(endOfDay(newEndDate), 'yyyy-MM-dd');
      
      // Update selected range
      setSelectedRange({
        start: newStartDate,
        end: newEndDate
      });
      
      // Notify parent component
      await onDateRangeChange(formattedStart, formattedEnd);
      
      // Hide date picker
      setShowDatePicker(false);
    } catch (error) {
      console.error('Error in quick jump:', error);
      toast({
        title: "Error",
        description: "Failed to update date range. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [onDateRangeChange]);
  
  // Handle date changes with validation
  const handleDateChange = useCallback((date: Date | undefined, field: 'start' | 'end') => {
    if (!date || !isValid(date)) {
      toast({
        title: "Invalid Date",
        description: "Please select a valid date.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate date range
    if (field === 'end' && selectedRange.start && isBefore(date, selectedRange.start)) {
      toast({
        title: "Invalid Range",
        description: "End date must be after start date.",
        variant: "destructive"
      });
      return;
    }
    
    if (field === 'start' && selectedRange.end && isAfter(date, selectedRange.end)) {
      toast({
        title: "Invalid Range",
        description: "Start date must be before end date.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedRange(prev => ({
      ...prev,
      [field]: date
    }));
  }, [selectedRange]);
  
  // Handle apply button click with validation
  const handleApplyDateRange = useCallback(async () => {
    if (!selectedRange.start || !selectedRange.end) {
      toast({
        title: "Incomplete Selection",
        description: "Please select both start and end dates.",
        variant: "destructive"
      });
      return;
    }
    
    if (!isValid(selectedRange.start) || !isValid(selectedRange.end)) {
      toast({
        title: "Invalid Dates",
        description: "Please select valid dates.",
        variant: "destructive"
      });
      return;
    }
    
    if (isBefore(selectedRange.end, selectedRange.start)) {
      toast({
        title: "Invalid Range",
        description: "End date must be after start date.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const formattedStart = format(startOfDay(selectedRange.start), 'yyyy-MM-dd');
      const formattedEnd = format(endOfDay(selectedRange.end), 'yyyy-MM-dd');
      
      await onDateRangeChange(formattedStart, formattedEnd);
      setShowDatePicker(false);
    } catch (error) {
      console.error('Error applying date range:', error);
      toast({
        title: "Error",
        description: "Failed to update date range. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedRange, onDateRangeChange]);
  
  return (
    <div className="timeline-navigator">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Main date display */}
        <div className="flex items-center">
          <button
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onPrevious()}
            aria-label="Previous time period"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            className="flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => !isLoading && setShowDatePicker(!showDatePicker)}
            aria-expanded={showDatePicker}
            aria-controls="date-range-picker"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2 animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {formattedStartDate} - {formattedEndDate}
            </span>
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <button
            className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              hasNext ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'
            }`}
            onClick={() => hasNext && onNext()}
            disabled={!hasNext || isLoading}
            aria-label="Next time period"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Quick jump controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Quick Jump:</span>
          
          <button
            className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleQuickJump(1)}
            aria-label="Last month"
            disabled={isLoading}
          >
            1 Month
          </button>
          
          <button
            className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleQuickJump(3)}
            aria-label="Last 3 months"
            disabled={isLoading}
          >
            3 Months
          </button>
          
          <button
            className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleQuickJump(6)}
            aria-label="Last 6 months"
            disabled={isLoading}
          >
            6 Months
          </button>
          
          <button
            className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleQuickJump(12)}
            aria-label="Last year"
            disabled={isLoading}
          >
            1 Year
          </button>
        </div>
      </div>
      
      {/* Date range picker */}
      {showDatePicker && (
        <div 
          id="date-range-picker"
          className="absolute z-10 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-300 dark:border-gray-700 p-4 w-80"
          role="dialog"
          aria-modal="true"
          aria-labelledby="date-range-picker-title"
        >
          <h3 
            id="date-range-picker-title"
            className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3"
          >
            Select Date Range
          </h3>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="start-date" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Start Date
              </label>
              <DatePicker
                date={selectedRange.start}
                onChange={(date) => handleDateChange(date, 'start')}
                placeholder="Select start date"
                className="w-full"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="end-date" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                End Date
              </label>
              <DatePicker
                date={selectedRange.end}
                onChange={(date) => handleDateChange(date, 'end')}
                placeholder="Select end date"
                className="w-full"
                disabled={!selectedRange.start || isLoading}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <button
                className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setShowDatePicker(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleApplyDateRange}
                disabled={!selectedRange.start || !selectedRange.end || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  'Apply'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineNavigator;
