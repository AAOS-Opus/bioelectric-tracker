import { StateCreator } from 'zustand';

// Agent Types
export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'completed';
export type AgentType = 'assistant' | 'processor' | 'analyzer' | 'executor';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  description: string;
  createdAt: Date;
  lastActive: Date;
  cpuUsage: number;
  memoryUsage: number;
  capabilities: string[];
}

export interface AgentState {
  agents: Record<string, Agent>;
  isLoading: boolean;
  error: string | null;
  // Actions
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  setAgentStatus: (id: string, status: AgentStatus) => void;
  loadAgents: () => Promise<void>;
}

// UI Types
export type ThemeMode = 'light' | 'dark' | 'system';

export interface UIState {
  theme: ThemeMode;
  isSidebarOpen: boolean;
  notifications: Notification[];
  unreadNotifications: number;
  isCommandPaletteOpen: boolean;
  // Actions
  setTheme: (theme: ThemeMode) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  toggleCommandPalette: () => void;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: Date;
  read: boolean;
}

// Settings Types
export interface WidgetLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  isDraggable?: boolean;
  isResizable?: boolean;
}

export interface DashboardSettings {
  widgets: Record<string, WidgetLayout>;
  refreshInterval: number;
  autoRefresh: boolean;
  defaultView: 'grid' | 'list';
}

export interface SettingsState {
  dashboardSettings: DashboardSettings;
  userPreferences: {
    notifications: boolean;
    sounds: boolean;
    animations: boolean;
    telemetry: boolean;
  };
  // Actions
  updateDashboardSettings: (settings: Partial<DashboardSettings>) => void;
  updateWidgetLayout: (widgetId: string, layout: Partial<WidgetLayout>) => void;
  updateUserPreferences: (preferences: Partial<SettingsState['userPreferences']>) => void;
  resetSettings: () => void;
}

// Swarm Types
export interface SwarmAgent {
  agentId: string;
  role: string;
  priority: number;
}

export interface Swarm {
  id: string;
  name: string;
  description: string;
  agents: SwarmAgent[];
  status: 'idle' | 'running' | 'paused' | 'error' | 'completed';
  createdAt: Date;
  lastActive: Date;
}

export interface SwarmState {
  swarms: Record<string, Swarm>;
  isLoading: boolean;
  error: string | null;
  // Actions
  addSwarm: (swarm: Swarm) => void;
  updateSwarm: (id: string, updates: Partial<Swarm>) => void;
  removeSwarm: (id: string) => void;
  addAgentToSwarm: (swarmId: string, agent: SwarmAgent) => void;
  removeAgentFromSwarm: (swarmId: string, agentId: string) => void;
  setSwarmStatus: (swarmId: string, status: Swarm['status']) => void;
  loadSwarms: () => Promise<void>;
}

// Store Slice Types
export type AgentSlice = StateCreator<
  AgentState & UIState & SettingsState & SwarmState,
  [],
  [],
  AgentState
>;

export type UISlice = StateCreator<
  AgentState & UIState & SettingsState & SwarmState,
  [],
  [],
  UIState
>;

export type SettingsSlice = StateCreator<
  AgentState & UIState & SettingsState & SwarmState,
  [],
  [],
  SettingsState
>;

export type SwarmSlice = StateCreator<
  AgentState & UIState & SettingsState & SwarmState,
  [],
  [],
  SwarmState
>;

// Combined Store Type
export type AppState = AgentState & UIState & SettingsState & SwarmState;

// System Event Types for Activity Timeline
export interface SystemEvent {
  id: string;
  timestamp: Date;
  type: 'agent' | 'swarm' | 'system' | 'user';
  action: string;
  details: Record<string, any>;
}