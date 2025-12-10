import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useStore } from '../../../../store';
import { 
  AgentStatusWidget, 
  RecentActivityWidget, 
  SystemHealthWidget, 
  QuickCommandWidget 
} from '../index';

// Mock the store
jest.mock('../../../../store', () => {
  const originalModule = jest.requireActual('../../../../store');
  
  // Create a mock store with test data
  const mockStore = {
    ...originalModule,
    useAgents: jest.fn(),
    useAgentCounts: jest.fn(),
    useStore: jest.fn()
  };
  
  return mockStore;
});

// Get the mocked functions
const mockedUseStore = useStore as unknown as jest.Mock;
const mockedUseAgents = jest.fn();
const mockedUseAgentCounts = jest.fn();

// Mock Recharts to avoid rendering issues in tests
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

describe('Dashboard Widgets', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('AgentStatusWidget', () => {
    beforeEach(() => {
      // Mock agent counts
      mockedUseAgentCounts.mockReturnValue({
        total: 4,
        idle: 2,
        running: 1,
        paused: 1,
        error: 0,
        completed: 0
      });
      
      // Mock agents
      mockedUseAgents.mockReturnValue({
        'agent-1': { id: 'agent-1', name: 'Agent 1', type: 'assistant', status: 'idle' },
        'agent-2': { id: 'agent-2', name: 'Agent 2', type: 'processor', status: 'running' },
        'agent-3': { id: 'agent-3', name: 'Agent 3', type: 'analyzer', status: 'idle' },
        'agent-4': { id: 'agent-4', name: 'Agent 4', type: 'executor', status: 'paused' }
      });
    });
    
    test('renders agent status counts', () => {
      render(<AgentStatusWidget id="agent-status" />);
      
      expect(screen.getByText('Agent Status')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // idle count
      expect(screen.getByText('1')).toBeInTheDocument(); // running count
      expect(screen.getByText('1')).toBeInTheDocument(); // paused count
      expect(screen.getByText('Idle')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();
      expect(screen.getByText('Paused')).toBeInTheDocument();
      expect(screen.getByText('Total Agents: 4')).toBeInTheDocument();
    });
  });
  
  describe('RecentActivityWidget', () => {
    beforeEach(() => {
      // Mock store state for RecentActivityWidget
      mockedUseStore.mockImplementation((selector) => selector({
        agents: {
          'agent-1': {
            id: 'agent-1',
            name: 'Agent 1',
            type: 'assistant',
            status: 'idle',
            lastActive: new Date()
          }
        },
        swarms: {
          'swarm-1': {
            id: 'swarm-1',
            name: 'Swarm 1',
            status: 'running',
            lastActive: new Date(),
            agents: []
          }
        }
      }));
    });
    
    test('renders activity timeline', () => {
      render(<RecentActivityWidget id="recent-activity" />);
      
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      // Due to the dynamic nature of the events, we'll just check for some expected content
      expect(screen.getByText(/Agent Agent 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Swarm Swarm 1/i)).toBeInTheDocument();
    });
  });
  
  describe('SystemHealthWidget', () => {
    beforeEach(() => {
      // Mock agents for SystemHealthWidget
      mockedUseAgents.mockReturnValue({
        'agent-1': {
          id: 'agent-1',
          name: 'Agent 1',
          cpuUsage: 20,
          memoryUsage: 150
        },
        'agent-2': {
          id: 'agent-2',
          name: 'Agent 2',
          cpuUsage: 30,
          memoryUsage: 200
        }
      });
    });
    
    test('renders system health charts', () => {
      render(<SystemHealthWidget id="system-health" />);
      
      expect(screen.getByText('System Health')).toBeInTheDocument();
      expect(screen.getByText('CPU Usage (%)')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage (MB)')).toBeInTheDocument();
      expect(screen.getByText('Response Latency (ms)')).toBeInTheDocument();
      expect(screen.getAllByTestId('responsive-container').length).toBe(3);
    });
  });
  
  describe('QuickCommandWidget', () => {
    beforeEach(() => {
      // Mock store state and actions for QuickCommandWidget
      const mockState = {
        agents: {
          'agent-1': { id: 'agent-1', name: 'Agent 1', status: 'idle' }
        },
        swarms: {
          'swarm-1': { id: 'swarm-1', name: 'Swarm 1', status: 'idle' }
        },
        addNotification: jest.fn(),
        setAgentStatus: jest.fn(),
        setSwarmStatus: jest.fn()
      };
      
      mockedUseStore.mockImplementation((selector) => {
        if (typeof selector === 'function') {
          return selector(mockState);
        }
        return mockState;
      });
    });
    
    test('renders command input', () => {
      render(<QuickCommandWidget id="quick-command" />);
      
      expect(screen.getByText('Quick Command')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter command...')).toBeInTheDocument();
      expect(screen.getByText("Type 'help' to see available commands")).toBeInTheDocument();
    });
    
    test('executes help command', () => {
      render(<QuickCommandWidget id="quick-command" />);
      
      const input = screen.getByPlaceholderText('Enter command...');
      fireEvent.change(input, { target: { value: 'help' } });
      fireEvent.submit(input);
      
      expect(screen.getByText(/Available commands/i)).toBeInTheDocument();
      expect(screen.getByText(/list agents/i)).toBeInTheDocument();
      expect(screen.getByText(/start agent/i)).toBeInTheDocument();
    });
    
    test('executes list agents command', () => {
      render(<QuickCommandWidget id="quick-command" />);
      
      const input = screen.getByPlaceholderText('Enter command...');
      fireEvent.change(input, { target: { value: 'list agents' } });
      fireEvent.submit(input);
      
      expect(screen.getByText(/agent-1: Agent 1 \(idle\)/i)).toBeInTheDocument();
    });
  });
});