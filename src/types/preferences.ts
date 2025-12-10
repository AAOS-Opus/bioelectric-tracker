/**
 * User Preferences Type Definitions
 */

import { UserPreferences as BaseUserPreferences } from './user';

export type ThemeOption = 'light' | 'dark' | 'system' | 'scheduled';
export type MeasurementUnit = 'imperial' | 'metric';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type TimeFormat = '12h' | '24h';
export type DashboardView = 'weekly' | 'daily' | 'calendar' | 'progress';
export type Language = 'en' | 'es' | 'fr' | 'de'; // Expandable as needed
export type TextDirection = 'ltr' | 'rtl';
export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type ChartType = 'bar' | 'line' | 'pie' | 'radar' | 'scatter';
export type TooltipBehavior = 'hover' | 'click' | 'disabled';
export type UIDensity = 'comfortable' | 'compact' | 'ultra-compact';
export type DataRetentionPolicy = 'short-term' | 'long-term' | 'custom';
export type BackupFrequency = 'daily' | 'weekly' | 'monthly' | 'manual';
export type ExportFormat = 'json' | 'csv' | 'pdf';
export type PrivacyLevel = 'standard' | 'anonymized' | 'restricted';
export type AutoSaveInterval = 'off' | '5s' | '15s' | '30s' | '60s';
export type FontFamily = 'system' | 'serif' | 'sans-serif' | 'monospace' | 'inter' | 'roboto' | 'open-sans' | 'lato' | 'montserrat';
export type FontSize = 'small' | 'medium' | 'large' | 'x-large';

export interface ThemeSchedule {
  darkModeStart: string; // 24h format "HH:MM"
  darkModeEnd: string; // 24h format "HH:MM"
  enabled: boolean;
}

export interface CustomColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  text: string;
}

export interface ThemeSettings {
  mode: ThemeOption;
  highContrast: boolean;
  schedule: ThemeSchedule;
  fontFamily: FontFamily;
  fontSize: FontSize;
  customPalette?: CustomColorPalette;
  useCustomPalette: boolean;
  // Extended theme properties for the new UI
  current: ThemeOption;
  scheduleEnabled: boolean;
  lightModeStartTime: string;
  darkModeStartTime: string;
  fontScale: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface ReminderDefaults {
  leadTime: number; // minutes before event
  quietHoursStart: string; // 24h format "HH:MM"
  quietHoursEnd: string; // 24h format "HH:MM"
  enableQuietHours: boolean;
  allowUrgentDuringQuietHours: boolean;
  frequencyLimits: {
    daily: number; // Maximum number of notifications per day
    hourly: number; // Maximum number of notifications per hour
  };
}

export interface NotificationChannels {
  email: boolean;
  inApp: boolean;
  sms: boolean;
}

export interface NotificationCategories {
  products: boolean;
  modalities: boolean;
  progress: boolean;
  reminders: boolean;
  system: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  channels: NotificationChannels;
  categories: NotificationCategories;
  quietHours: {
    enabled: boolean;
    start: string; // 24h format "HH:MM"
    end: string; // 24h format "HH:MM"
    allowCritical: boolean;
  };
  frequencyLimits: {
    enabled: boolean;
    daily: number; // Maximum number of notifications per day
    hourly: number; // Maximum number of notifications per hour
  };
}

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReaderOptimized: boolean;
  useSimplifiedLanguage: boolean;
  enableAudioCues: boolean;
  showReadingTime: boolean;
  enhancedFocus: boolean;
}

export interface DashboardWidgetVisibility {
  productTracking: boolean;
  dailyAffirmation: boolean;
  upcomingModalities: boolean;
  recentProgress: boolean;
  biomarkerTrends: boolean;
  journalSummary: boolean;
  phaseProgress: boolean;
}

export interface UICustomization {
  density: UIDensity;
  animationsEnabled: boolean;
  widgetsVisibility: DashboardWidgetVisibility;
  dashboardSectionOrder: string[]; // Array of section IDs in display order
}

export interface DataVisualizationPreferences {
  defaultChartType: ChartType;
  showTrendlines: boolean;
  tooltipBehavior: TooltipBehavior;
  usePatternRedundancy: boolean; // For color vision deficiencies
  customPalette?: string[]; // Custom colors for charts
  enableComparisons: boolean; // Show baseline comparisons
}

export interface RegionalFormatSettings {
  measurementUnit: MeasurementUnit;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  temperatureUnit: TemperatureUnit;
  numberFormat: {
    decimalSeparator: '.' | ',';
    thousandsSeparator: ',' | '.' | ' ' | '';
  };
}

export interface DataHandlingPreferences {
  retentionPolicy: DataRetentionPolicy;
  customRetentionDays?: number; // Only used if retentionPolicy is 'custom'
  backupFrequency: BackupFrequency;
  defaultExportFormat: ExportFormat;
  privacyLevel: PrivacyLevel;
  analyticsOptIn: boolean;
}

export interface BehavioralPreferences {
  autoSaveInterval: AutoSaveInterval;
  defaultLandingPage: 'dashboard' | 'journal' | 'progress' | 'settings';
  touchGestures: {
    swipeToNavigate: boolean;
    pinchToZoom: boolean;
    doubleTapToEdit: boolean;
  };
}

export interface DisplayPreferences {
  measurementUnit: MeasurementUnit;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  defaultDashboardView: DashboardView;
  language: Language;
  textDirection: TextDirection;
  accessibility: AccessibilitySettings;
  uiCustomization: UICustomization;
  regionalSettings: RegionalFormatSettings;
}

// Create a type that extends BaseUserPreferences but allows for our enhanced Theme type
type EnhancedBasePreferences = Omit<BaseUserPreferences, 'theme'> & {
  theme: ThemeSettings | ThemeOption;
};

export interface ExtendedUserPreferences extends EnhancedBasePreferences {
  display: DisplayPreferences;
  reminderDefaults: ReminderDefaults;
  notifications: NotificationSettings;
  dataVisualization: DataVisualizationPreferences;
  dataHandling: DataHandlingPreferences;
  behavioral: BehavioralPreferences;
  lastSyncedAt?: string; // ISO date string
}

export interface PreferencesContextType {
  preferences: ExtendedUserPreferences;
  setPreference: <K extends keyof ExtendedUserPreferences>(key: K, value: ExtendedUserPreferences[K]) => void;
  setDisplayPreference: <K extends keyof DisplayPreferences>(key: K, value: DisplayPreferences[K]) => void;
  setReminderPreference: <K extends keyof ReminderDefaults>(key: K, value: ReminderDefaults[K]) => void;
  setAccessibilityPreference: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  setThemePreference: <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => void;
  setNotificationPreference: <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => void;
  setDataVisualizationPreference: <K extends keyof DataVisualizationPreferences>(key: K, value: DataVisualizationPreferences[K]) => void;
  setUICustomizationPreference: <K extends keyof UICustomization>(key: K, value: UICustomization[K]) => void;
  setDataHandlingPreference: <K extends keyof DataHandlingPreferences>(key: K, value: DataHandlingPreferences[K]) => void;
  setBehavioralPreference: <K extends keyof BehavioralPreferences>(key: K, value: BehavioralPreferences[K]) => void;
  resetPreferences: () => void;
  isLoading: boolean;
  isSyncing: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: string | null;
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  screenReaderOptimized: false,
  useSimplifiedLanguage: false,
  enableAudioCues: false,
  showReadingTime: false,
  enhancedFocus: false
};

export const DEFAULT_DASHBOARD_WIDGET_VISIBILITY: DashboardWidgetVisibility = {
  productTracking: true,
  dailyAffirmation: true,
  upcomingModalities: true,
  recentProgress: true,
  biomarkerTrends: true,
  journalSummary: true,
  phaseProgress: true
};

export const DEFAULT_UI_CUSTOMIZATION: UICustomization = {
  density: 'comfortable',
  animationsEnabled: true,
  widgetsVisibility: DEFAULT_DASHBOARD_WIDGET_VISIBILITY,
  dashboardSectionOrder: [
    'phaseProgress',
    'dailyAffirmation',
    'productTracking',
    'upcomingModalities',
    'recentProgress',
    'biomarkerTrends',
    'journalSummary'
  ]
};

export const DEFAULT_REGIONAL_FORMAT_SETTINGS: RegionalFormatSettings = {
  measurementUnit: 'imperial',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  temperatureUnit: 'fahrenheit',
  numberFormat: {
    decimalSeparator: '.',
    thousandsSeparator: ','
  }
};

export const DEFAULT_DATA_VISUALIZATION_PREFERENCES: DataVisualizationPreferences = {
  defaultChartType: 'bar',
  showTrendlines: true,
  tooltipBehavior: 'hover',
  usePatternRedundancy: false,
  enableComparisons: true
};

export const DEFAULT_DATA_HANDLING_PREFERENCES: DataHandlingPreferences = {
  retentionPolicy: 'long-term',
  backupFrequency: 'weekly',
  defaultExportFormat: 'json',
  privacyLevel: 'standard',
  analyticsOptIn: true
};

export const DEFAULT_BEHAVIORAL_PREFERENCES: BehavioralPreferences = {
  autoSaveInterval: '15s',
  defaultLandingPage: 'dashboard',
  touchGestures: {
    swipeToNavigate: true,
    pinchToZoom: true,
    doubleTapToEdit: false
  }
};

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'system',
  highContrast: false,
  schedule: {
    darkModeStart: '19:00', // 7 PM
    darkModeEnd: '07:00',   // 7 AM
    enabled: false
  },
  fontFamily: 'system',
  fontSize: 'medium',
  useCustomPalette: false,
  current: 'system',
  scheduleEnabled: false,
  lightModeStartTime: '07:00',
  darkModeStartTime: '19:00',
  fontScale: 1,
  primaryColor: '#000',
  secondaryColor: '#fff',
  accentColor: '#ccc'
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  channels: {
    email: true,
    inApp: true,
    sms: false
  },
  categories: {
    products: true,
    modalities: true,
    progress: true,
    reminders: true,
    system: true
  },
  quietHours: {
    enabled: true,
    start: '22:00', // 10 PM
    end: '07:00',   // 7 AM
    allowCritical: true
  },
  frequencyLimits: {
    enabled: true,
    daily: 10,
    hourly: 3
  }
};

export const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferences = {
  measurementUnit: 'imperial',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  defaultDashboardView: 'weekly',
  language: 'en',
  textDirection: 'ltr',
  accessibility: DEFAULT_ACCESSIBILITY_SETTINGS,
  uiCustomization: DEFAULT_UI_CUSTOMIZATION,
  regionalSettings: DEFAULT_REGIONAL_FORMAT_SETTINGS
};

export const DEFAULT_REMINDER_DEFAULTS: ReminderDefaults = {
  leadTime: 15, // 15 minutes before event
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  enableQuietHours: true,
  allowUrgentDuringQuietHours: true,
  frequencyLimits: {
    daily: 10,
    hourly: 3
  }
};
