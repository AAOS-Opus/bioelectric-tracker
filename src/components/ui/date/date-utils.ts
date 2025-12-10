import { format, parse, isValid, isSameDay, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addMonths, addYears, differenceInCalendarDays } from 'date-fns';
import { enUS, ar } from 'date-fns/locale';

export type DateFormat = 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd' | string;
export type Locale = 'en-US' | 'ar' | string;
export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DateConfig {
  format: DateFormat;
  locale: Locale;
  weekStartsOn: WeekStartsOn;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  holidays?: Date[];
  businessDays?: boolean;
}

const locales = {
  'en-US': enUS,
  'ar': ar,
};

export const defaultConfig: DateConfig = {
  format: 'MM/dd/yyyy',
  locale: 'en-US',
  weekStartsOn: 0,
};

// Format date according to locale and format string
export function formatDate(date: Date, config: Partial<DateConfig> = {}): string {
  const { format: dateFormat, locale } = { ...defaultConfig, ...config };
  return format(date, dateFormat, {
    locale: locales[locale] || locales['en-US'],
  });
}

// Parse string to date, supporting multiple formats
export function parseDate(dateStr: string, config: Partial<DateConfig> = {}): Date | null {
  const { format: dateFormat, locale } = { ...defaultConfig, ...config };
  
  try {
    const parsed = parse(dateStr, dateFormat, new Date(), {
      locale: locales[locale] || locales['en-US'],
    });
    return isValid(parsed) ? parsed : null;
  } catch {
    // Try alternative formats
    const formats = ['MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd'];
    for (const format of formats) {
      try {
        const parsed = parse(dateStr, format, new Date(), {
          locale: locales[locale] || locales['en-US'],
        });
        if (isValid(parsed)) return parsed;
      } catch {
        continue;
      }
    }
    return null;
  }
}

// Check if date is within allowed range
export function isDateInRange(date: Date, config: Partial<DateConfig> = {}): boolean {
  const { minDate, maxDate } = { ...defaultConfig, ...config };
  
  if (!minDate && !maxDate) return true;
  if (minDate && date < minDate) return false;
  if (maxDate && date > maxDate) return false;
  
  return true;
}

// Check if date is disabled
export function isDateDisabled(date: Date, config: Partial<DateConfig> = {}): boolean {
  const { disabledDates, businessDays, holidays } = { ...defaultConfig, ...config };
  
  // Check disabled dates
  if (disabledDates?.some(disabled => isSameDay(date, disabled))) {
    return true;
  }
  
  // Check business days
  if (businessDays) {
    const day = date.getDay();
    if (day === 0 || day === 6) return true;
  }
  
  // Check holidays
  if (holidays?.some(holiday => isSameDay(date, holiday))) {
    return true;
  }
  
  return false;
}

// Generate calendar grid for a month
export function generateCalendarGrid(
  month: Date,
  config: Partial<DateConfig> = {}
): Date[][] {
  const { weekStartsOn } = { ...defaultConfig, ...config };
  const start = startOfWeek(startOfMonth(month), { weekStartsOn });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn });
  const days = differenceInCalendarDays(end, start) + 1;
  
  const weeks: Date[][] = [];
  let week: Date[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    week.push(date);
    
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  
  if (week.length > 0) {
    weeks.push(week);
  }
  
  return weeks;
}

// Generate common date presets
export function generateDatePresets(now: Date = new Date()): Record<string, [Date, Date]> {
  return {
    'Today': [now, now],
    'Last 7 Days': [addDays(now, -6), now],
    'Last 30 Days': [addDays(now, -29), now],
    'This Month': [startOfMonth(now), endOfMonth(now)],
    'Last Month': [
      startOfMonth(addMonths(now, -1)),
      endOfMonth(addMonths(now, -1))
    ],
    'This Year': [
      new Date(now.getFullYear(), 0, 1),
      new Date(now.getFullYear(), 11, 31)
    ],
    'Last Year': [
      new Date(now.getFullYear() - 1, 0, 1),
      new Date(now.getFullYear() - 1, 11, 31)
    ],
  };
}

// Format date range for display
export function formatDateRange(
  start: Date,
  end: Date,
  config: Partial<DateConfig> = {}
): string {
  const { format: dateFormat, locale } = { ...defaultConfig, ...config };
  
  return `${formatDate(start, { format: dateFormat, locale })} - ${formatDate(end, {
    format: dateFormat,
    locale,
  })}`;
}

// Validate and correct date input
export function validateAndCorrectDate(
  date: Date,
  config: Partial<DateConfig> = {}
): Date | null {
  if (!isValid(date)) return null;
  
  const { minDate, maxDate } = { ...defaultConfig, ...config };
  
  if (minDate && date < minDate) return minDate;
  if (maxDate && date > maxDate) return maxDate;
  
  return date;
}

// Get week day names based on locale
export function getWeekDayNames(config: Partial<DateConfig> = {}): string[] {
  const { locale, weekStartsOn } = { ...defaultConfig, ...config };
  const start = startOfWeek(new Date(), { weekStartsOn });
  
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i);
    return format(day, 'EEEE', {
      locale: locales[locale] || locales['en-US'],
    });
  });
}

// Get month names based on locale
export function getMonthNames(config: Partial<DateConfig> = {}): string[] {
  const { locale } = { ...defaultConfig, ...config };
  
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2000, i, 1);
    return format(date, 'MMMM', {
      locale: locales[locale] || locales['en-US'],
    });
  });
}

// Check if date is today
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

// Navigate to next/previous month
export function navigateMonth(date: Date, direction: 'next' | 'prev'): Date {
  return direction === 'next' ? addMonths(date, 1) : addMonths(date, -1);
}

// Navigate to next/previous year
export function navigateYear(date: Date, direction: 'next' | 'prev'): Date {
  return direction === 'next' ? addYears(date, 1) : addYears(date, -1);
}
