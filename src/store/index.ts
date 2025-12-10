import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { AppState } from './types';
import { createAgentSlice } from './slices/agentSlice';
import { createUISlice } from './slices/uiSlice';
import { createSettingsSlice } from './slices/settingsSlice';
import { createSwarmSlice } from './slices/swarmSlice';

// Create the store with all slices
export const useStore = create<AppState>()(
  devtools(
    persist(
      immer((...a) => ({
        ...createAgentSlice(...a),
        ...createUISlice(...a),
        ...createSettingsSlice(...a),
        ...createSwarmSlice(...a),
      })),
      {
        name: 'maestro-deck-storage',
        storage: createJSONStorage(() => localStorage),
        // Only persist certain parts of the state
        partialize: (state) => ({
          theme: state.theme,
          dashboardSettings: state.dashboardSettings,
          userPreferences: state.userPreferences,
          // Don't persist agents and swarms in this example
          // In a real app, you might want to persist them
        }),
      }
    ),
    {
      name: 'MaestroDeck',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Initialize app state function
export const initializeAppState = async () => {
  const store = useStore.getState();
  
  // Load agents and swarms
  await store.loadAgents();
  await store.loadSwarms();
  
  // Auto-detect system theme if set to 'system'
  if (store.theme === 'system' && typeof window !== 'undefined') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const root = document.documentElement;
    
    if (prefersDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }
  
  // Register keyboard shortcuts
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      // Command/Ctrl + K to toggle command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        store.toggleCommandPalette();
      }
    });
  }
};

// Custom hooks for accessing state
// Agent hooks
export const useAgents = () => useStore((state) => state.agents);
export const useAgentsByStatus = (status: string) => 
  useStore((state) => 
    Object.values(state.agents).filter((agent) => agent.status === status)
  );
export const useAgentCounts = () => {
  const agents = useStore((state) => state.agents);
  
  return {
    total: Object.keys(agents).length,
    idle: Object.values(agents).filter((agent) => agent.status === 'idle').length,
    running: Object.values(agents).filter((agent) => agent.status === 'running').length,
    paused: Object.values(agents).filter((agent) => agent.status === 'paused').length,
    error: Object.values(agents).filter((agent) => agent.status === 'error').length,
    completed: Object.values(agents).filter((agent) => agent.status === 'completed').length,
  };
};

// UI hooks
export const useTheme = () => useStore((state) => state.theme);
export const useSidebar = () => ({
  isOpen: useStore((state) => state.isSidebarOpen),
  toggle: useStore((state) => state.toggleSidebar),
  setOpen: useStore((state) => state.setSidebarOpen),
});
export const useNotifications = () => ({
  notifications: useStore((state) => state.notifications),
  unreadCount: useStore((state) => state.unreadNotifications),
  addNotification: useStore((state) => state.addNotification),
  markAsRead: useStore((state) => state.markNotificationAsRead),
  clearAll: useStore((state) => state.clearNotifications),
});
export const useCommandPalette = () => ({
  isOpen: useStore((state) => state.isCommandPaletteOpen),
  toggle: useStore((state) => state.toggleCommandPalette),
});

// Settings hooks
export const useDashboardSettings = () => useStore((state) => state.dashboardSettings);
export const useWidgetLayouts = () => useStore((state) => state.dashboardSettings.widgets);
export const useUserPreferences = () => useStore((state) => state.userPreferences);

// Swarm hooks
export const useSwarms = () => useStore((state) => state.swarms);
export const useSwarmAgents = (swarmId: string) => {
  const swarm = useStore((state) => state.swarms[swarmId]);
  const agents = useStore((state) => state.agents);
  
  if (!swarm) return [];
  
  return swarm.agents.map((swarmAgent) => ({
    ...swarmAgent,
    agent: agents[swarmAgent.agentId],
  }));
};