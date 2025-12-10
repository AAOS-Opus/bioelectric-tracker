# MaestroDeck State Management

This directory contains the state management implementation for MaestroDeck using Zustand.

## Architecture

The state management is organized into domain-specific slices:

- **Agent Slice**: Manages agent entities, their statuses, and operations
- **UI Slice**: Handles UI state like theme, sidebar, notifications, and command palette
- **Settings Slice**: Manages dashboard settings and user preferences
- **Swarm Slice**: Handles swarm entities and their agent associations

## Store Structure

- `types.ts`: Contains TypeScript interfaces and types for the store
- `slices/`: Contains individual domain slices
  - `agentSlice.ts`: Agent state and actions
  - `uiSlice.ts`: UI state and actions
  - `settingsSlice.ts`: Settings state and actions
  - `swarmSlice.ts`: Swarm state and actions
- `index.ts`: Main store that combines all slices and exports custom hooks
- `__tests__/`: Test files for the store

## Custom Hooks

The store exports several custom hooks for accessing state:

### Agent Hooks
- `useAgents()`: Access all agents
- `useAgentsByStatus(status)`: Filter agents by status
- `useAgentCounts()`: Get counts of agents by status

### UI Hooks
- `useTheme()`: Access theme state
- `useSidebar()`: Access sidebar state and actions
- `useNotifications()`: Access notifications and related actions
- `useCommandPalette()`: Access command palette state and actions

### Settings Hooks
- `useDashboardSettings()`: Access dashboard settings
- `useWidgetLayouts()`: Access widget layout settings
- `useUserPreferences()`: Access user preferences

### Swarm Hooks
- `useSwarms()`: Access all swarms
- `useSwarmAgents(swarmId)`: Get agents associated with a specific swarm

## State Initialization

The `initializeAppState()` function initializes the application state:

1. Loads agents and swarms
2. Auto-detects system dark/light mode and syncs theme
3. Registers keyboard shortcuts (e.g., Ctrl+K for command palette)

## Persistence

The store uses Zustand's persist middleware to save certain parts of the state to localStorage:

- Theme preference
- Dashboard settings
- User preferences

## Usage Example

```tsx
import { useAgents, useTheme, setAgentStatus } from '../store';

function MyComponent() {
  const agents = useAgents();
  const theme = useTheme();
  
  const handleStartAgent = (agentId) => {
    setAgentStatus(agentId, 'running');
  };
  
  return (
    <div className={theme === 'dark' ? 'dark-mode' : 'light-mode'}>
      {Object.values(agents).map(agent => (
        <div key={agent.id}>
          {agent.name} - {agent.status}
          <button onClick={() => handleStartAgent(agent.id)}>
            Start Agent
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Dashboard Widgets

The state management powers several dashboard widgets:

- **AgentStatusWidget**: Displays agent counts by status and type
- **RecentActivityWidget**: Shows timeline of agent and system events
- **SystemHealthWidget**: Displays real-time metrics with mini charts
- **QuickCommandWidget**: Provides a command console for interacting with agents and swarms

## Testing

Tests are provided for:

- Store slices and actions
- Custom hooks
- Widget rendering and interactions

Run tests with:

```bash
npm test