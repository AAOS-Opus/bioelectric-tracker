import { useStore, initializeAppState } from '../index';
import { Agent, AgentStatus, AgentType, Swarm } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Reset store between tests
beforeEach(() => {
  useStore.setState({
    // Agent state
    agents: {},
    isLoading: false,
    error: null,
    addAgent: useStore.getState().addAgent,
    updateAgent: useStore.getState().updateAgent,
    removeAgent: useStore.getState().removeAgent,
    setAgentStatus: useStore.getState().setAgentStatus,
    loadAgents: useStore.getState().loadAgents,
    
    // UI state
    theme: 'light',
    isSidebarOpen: true,
    notifications: [],
    unreadNotifications: 0,
    isCommandPaletteOpen: false,
    setTheme: useStore.getState().setTheme,
    toggleSidebar: useStore.getState().toggleSidebar,
    setSidebarOpen: useStore.getState().setSidebarOpen,
    addNotification: useStore.getState().addNotification,
    markNotificationAsRead: useStore.getState().markNotificationAsRead,
    clearNotifications: useStore.getState().clearNotifications,
    toggleCommandPalette: useStore.getState().toggleCommandPalette,
    
    // Settings state
    dashboardSettings: {
      widgets: {},
      refreshInterval: 30000,
      autoRefresh: true,
      defaultView: 'grid'
    },
    userPreferences: {
      notifications: true,
      sounds: true,
      animations: true,
      telemetry: false
    },
    updateDashboardSettings: useStore.getState().updateDashboardSettings,
    updateWidgetLayout: useStore.getState().updateWidgetLayout,
    updateUserPreferences: useStore.getState().updateUserPreferences,
    resetSettings: useStore.getState().resetSettings,
    
    // Swarm state
    swarms: {},
    addSwarm: useStore.getState().addSwarm,
    updateSwarm: useStore.getState().updateSwarm,
    removeSwarm: useStore.getState().removeSwarm,
    addAgentToSwarm: useStore.getState().addAgentToSwarm,
    removeAgentFromSwarm: useStore.getState().removeAgentFromSwarm,
    setSwarmStatus: useStore.getState().setSwarmStatus,
    loadSwarms: useStore.getState().loadSwarms
  });
  
  localStorageMock.clear();
});

// Helper functions
const createTestAgent = (overrides: Partial<Agent> = {}): Agent => ({
  id: 'test-agent-id',
  name: 'Test Agent',
  type: 'assistant',
  status: 'idle',
  description: 'Test agent description',
  createdAt: new Date(),
  lastActive: new Date(),
  cpuUsage: 10,
  memoryUsage: 200,
  capabilities: ['test'],
  ...overrides
});

const createTestSwarm = (overrides: Partial<Swarm> = {}): Swarm => ({
  id: 'test-swarm-id',
  name: 'Test Swarm',
  description: 'Test swarm description',
  agents: [],
  status: 'idle',
  createdAt: new Date(),
  lastActive: new Date(),
  ...overrides
});

// Tests
describe('Agent Slice', () => {
  test('should add an agent', () => {
    const agent = createTestAgent();
    useStore.getState().addAgent(agent);
    
    expect(useStore.getState().agents[agent.id]).toEqual(agent);
  });
  
  test('should update an agent', () => {
    const agent = createTestAgent();
    useStore.getState().addAgent(agent);
    
    const updates = {
      name: 'Updated Agent',
      description: 'Updated description'
    };
    
    useStore.getState().updateAgent(agent.id, updates);
    
    expect(useStore.getState().agents[agent.id].name).toBe(updates.name);
    expect(useStore.getState().agents[agent.id].description).toBe(updates.description);
  });
  
  test('should remove an agent', () => {
    const agent = createTestAgent();
    useStore.getState().addAgent(agent);
    
    useStore.getState().removeAgent(agent.id);
    
    expect(useStore.getState().agents[agent.id]).toBeUndefined();
  });
  
  test('should set agent status', () => {
    const agent = createTestAgent();
    useStore.getState().addAgent(agent);
    
    const newStatus: AgentStatus = 'running';
    useStore.getState().setAgentStatus(agent.id, newStatus);
    
    expect(useStore.getState().agents[agent.id].status).toBe(newStatus);
  });
});

describe('UI Slice', () => {
  test('should set theme', () => {
    useStore.getState().setTheme('dark');
    expect(useStore.getState().theme).toBe('dark');
  });
  
  test('should toggle sidebar', () => {
    const initialState = useStore.getState().isSidebarOpen;
    useStore.getState().toggleSidebar();
    expect(useStore.getState().isSidebarOpen).toBe(!initialState);
  });
  
  test('should add notification', () => {
    const notification = {
      id: 'test-notification',
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'info' as const,
      createdAt: new Date(),
      read: false
    };
    
    useStore.getState().addNotification(notification);
    
    expect(useStore.getState().notifications.length).toBe(1);
    expect(useStore.getState().notifications[0].title).toBe(notification.title);
    expect(useStore.getState().unreadNotifications).toBe(1);
  });
  
  test('should mark notification as read', () => {
    const notification = {
      id: 'test-notification',
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'info' as const,
      createdAt: new Date(),
      read: false
    };
    
    useStore.getState().addNotification(notification);
    useStore.getState().markNotificationAsRead(notification.id);
    
    expect(useStore.getState().notifications[0].read).toBe(true);
    expect(useStore.getState().unreadNotifications).toBe(0);
  });
  
  test('should clear notifications', () => {
    const notification = {
      id: 'test-notification',
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'info' as const,
      createdAt: new Date(),
      read: false
    };
    
    useStore.getState().addNotification(notification);
    useStore.getState().clearNotifications();
    
    expect(useStore.getState().notifications.length).toBe(0);
    expect(useStore.getState().unreadNotifications).toBe(0);
  });
});

describe('Settings Slice', () => {
  test('should update dashboard settings', () => {
    const newSettings = {
      refreshInterval: 60000,
      autoRefresh: false
    };
    
    useStore.getState().updateDashboardSettings(newSettings);
    
    expect(useStore.getState().dashboardSettings.refreshInterval).toBe(newSettings.refreshInterval);
    expect(useStore.getState().dashboardSettings.autoRefresh).toBe(newSettings.autoRefresh);
  });
  
  test('should update widget layout', () => {
    const widgetId = 'test-widget';
    const initialLayout = {
      id: widgetId,
      x: 0,
      y: 0,
      width: 6,
      height: 2
    };
    
    // Set initial layout
    useStore.getState().updateDashboardSettings({
      widgets: { [widgetId]: initialLayout }
    });
    
    // Update layout
    const updatedLayout = {
      x: 2,
      y: 3,
      width: 4
    };
    
    useStore.getState().updateWidgetLayout(widgetId, updatedLayout);
    
    expect(useStore.getState().dashboardSettings.widgets[widgetId].x).toBe(updatedLayout.x);
    expect(useStore.getState().dashboardSettings.widgets[widgetId].y).toBe(updatedLayout.y);
    expect(useStore.getState().dashboardSettings.widgets[widgetId].width).toBe(updatedLayout.width);
    expect(useStore.getState().dashboardSettings.widgets[widgetId].height).toBe(initialLayout.height);
  });
  
  test('should update user preferences', () => {
    const newPreferences = {
      notifications: false,
      sounds: false
    };
    
    useStore.getState().updateUserPreferences(newPreferences);
    
    expect(useStore.getState().userPreferences.notifications).toBe(newPreferences.notifications);
    expect(useStore.getState().userPreferences.sounds).toBe(newPreferences.sounds);
    expect(useStore.getState().userPreferences.animations).toBe(true); // Unchanged
  });
  
  test('should reset settings', () => {
    // Change settings
    useStore.getState().updateDashboardSettings({
      refreshInterval: 60000,
      autoRefresh: false
    });
    
    useStore.getState().updateUserPreferences({
      notifications: false,
      sounds: false
    });
    
    // Reset settings
    useStore.getState().resetSettings();
    
    // Check defaults are restored
    expect(useStore.getState().dashboardSettings.refreshInterval).toBe(30000);
    expect(useStore.getState().dashboardSettings.autoRefresh).toBe(true);
    expect(useStore.getState().userPreferences.notifications).toBe(true);
    expect(useStore.getState().userPreferences.sounds).toBe(true);
  });
});

describe('Swarm Slice', () => {
  test('should add a swarm', () => {
    const swarm = createTestSwarm();
    useStore.getState().addSwarm(swarm);
    
    expect(useStore.getState().swarms[swarm.id]).toEqual(swarm);
  });
  
  test('should update a swarm', () => {
    const swarm = createTestSwarm();
    useStore.getState().addSwarm(swarm);
    
    const updates = {
      name: 'Updated Swarm',
      description: 'Updated description'
    };
    
    useStore.getState().updateSwarm(swarm.id, updates);
    
    expect(useStore.getState().swarms[swarm.id].name).toBe(updates.name);
    expect(useStore.getState().swarms[swarm.id].description).toBe(updates.description);
  });
  
  test('should remove a swarm', () => {
    const swarm = createTestSwarm();
    useStore.getState().addSwarm(swarm);
    
    useStore.getState().removeSwarm(swarm.id);
    
    expect(useStore.getState().swarms[swarm.id]).toBeUndefined();
  });
  
  test('should add agent to swarm', () => {
    const swarm = createTestSwarm();
    useStore.getState().addSwarm(swarm);
    
    const swarmAgent = {
      agentId: 'test-agent-id',
      role: 'processor',
      priority: 1
    };
    
    useStore.getState().addAgentToSwarm(swarm.id, swarmAgent);
    
    expect(useStore.getState().swarms[swarm.id].agents.length).toBe(1);
    expect(useStore.getState().swarms[swarm.id].agents[0]).toEqual(swarmAgent);
  });
  
  test('should remove agent from swarm', () => {
    const swarmAgent = {
      agentId: 'test-agent-id',
      role: 'processor',
      priority: 1
    };
    
    const swarm = createTestSwarm({
      agents: [swarmAgent]
    });
    
    useStore.getState().addSwarm(swarm);
    useStore.getState().removeAgentFromSwarm(swarm.id, swarmAgent.agentId);
    
    expect(useStore.getState().swarms[swarm.id].agents.length).toBe(0);
  });
  
  test('should set swarm status', () => {
    const swarm = createTestSwarm();
    useStore.getState().addSwarm(swarm);
    
    const newStatus: Swarm['status'] = 'running';
    useStore.getState().setSwarmStatus(swarm.id, newStatus);
    
    expect(useStore.getState().swarms[swarm.id].status).toBe(newStatus);
  });
});

describe('Store Initialization', () => {
  test('should initialize app state', async () => {
    // Mock the implementation of loadAgents and loadSwarms
    const originalLoadAgents = useStore.getState().loadAgents;
    const originalLoadSwarms = useStore.getState().loadSwarms;
    
    // Replace with mock implementations that add test data
    useStore.setState({
      loadAgents: async () => {
        const agent = createTestAgent();
        useStore.getState().addAgent(agent);
        return Promise.resolve();
      },
      loadSwarms: async () => {
        const swarm = createTestSwarm();
        useStore.getState().addSwarm(swarm);
        return Promise.resolve();
      }
    });
    
    await initializeAppState();
    
    // Check that agents and swarms are loaded
    expect(Object.keys(useStore.getState().agents).length).toBeGreaterThan(0);
    expect(Object.keys(useStore.getState().swarms).length).toBeGreaterThan(0);
    
    // Restore original implementations
    useStore.setState({
      loadAgents: originalLoadAgents,
      loadSwarms: originalLoadSwarms
    });
  });
});