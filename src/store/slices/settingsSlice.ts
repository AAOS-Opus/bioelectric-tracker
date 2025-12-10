import { produce } from 'immer';
import { SettingsSlice, DashboardSettings, WidgetLayout } from '../types';

// Default widget layouts
const defaultWidgetLayouts: Record<string, WidgetLayout> = {
  'agent-status': {
    id: 'agent-status',
    x: 0,
    y: 0,
    width: 6,
    height: 2,
    minWidth: 3,
    minHeight: 2,
    isDraggable: true,
    isResizable: true
  },
  'recent-activity': {
    id: 'recent-activity',
    x: 6,
    y: 0,
    width: 6,
    height: 4,
    minWidth: 4,
    minHeight: 3,
    isDraggable: true,
    isResizable: true
  },
  'system-health': {
    id: 'system-health',
    x: 0,
    y: 2,
    width: 6,
    height: 3,
    minWidth: 3,
    minHeight: 2,
    isDraggable: true,
    isResizable: true
  },
  'quick-command': {
    id: 'quick-command',
    x: 0,
    y: 5,
    width: 12,
    height: 2,
    minWidth: 6,
    minHeight: 2,
    isDraggable: true,
    isResizable: true
  }
};

// Default dashboard settings
const defaultDashboardSettings: DashboardSettings = {
  widgets: defaultWidgetLayouts,
  refreshInterval: 30000, // 30 seconds
  autoRefresh: true,
  defaultView: 'grid'
};

// Default user preferences
const defaultUserPreferences = {
  notifications: true,
  sounds: true,
  animations: true,
  telemetry: false
};

export const createSettingsSlice: SettingsSlice = (set) => ({
  dashboardSettings: defaultDashboardSettings,
  userPreferences: defaultUserPreferences,

  updateDashboardSettings: (settings) => {
    set(
      produce((state) => {
        state.dashboardSettings = {
          ...state.dashboardSettings,
          ...settings
        };
      })
    );
  },

  updateWidgetLayout: (widgetId, layout) => {
    set(
      produce((state) => {
        if (state.dashboardSettings.widgets[widgetId]) {
          state.dashboardSettings.widgets[widgetId] = {
            ...state.dashboardSettings.widgets[widgetId],
            ...layout
          };
        }
      })
    );
  },

  updateUserPreferences: (preferences) => {
    set(
      produce((state) => {
        state.userPreferences = {
          ...state.userPreferences,
          ...preferences
        };
      })
    );
  },

  resetSettings: () => {
    set({
      dashboardSettings: defaultDashboardSettings,
      userPreferences: defaultUserPreferences
    });
  }
});