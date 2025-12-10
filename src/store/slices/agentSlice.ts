import { v4 as uuidv4 } from 'uuid';
import { produce } from 'immer';
import { AgentSlice, Agent, AgentStatus } from '../types';

// Mock data for development mode
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Assistant Agent',
    type: 'assistant',
    status: 'idle',
    description: 'Handles user interactions and queries',
    createdAt: new Date(),
    lastActive: new Date(),
    cpuUsage: 5,
    memoryUsage: 120,
    capabilities: ['natural language processing', 'query answering', 'task routing']
  },
  {
    id: '2',
    name: 'Data Processor',
    type: 'processor',
    status: 'running',
    description: 'Processes and transforms data',
    createdAt: new Date(),
    lastActive: new Date(),
    cpuUsage: 25,
    memoryUsage: 350,
    capabilities: ['data transformation', 'batch processing', 'ETL operations']
  },
  {
    id: '3',
    name: 'Analytics Engine',
    type: 'analyzer',
    status: 'idle',
    description: 'Analyzes data and generates insights',
    createdAt: new Date(),
    lastActive: new Date(),
    cpuUsage: 15,
    memoryUsage: 280,
    capabilities: ['statistical analysis', 'pattern recognition', 'trend detection']
  },
  {
    id: '4',
    name: 'Task Executor',
    type: 'executor',
    status: 'paused',
    description: 'Executes scheduled and triggered tasks',
    createdAt: new Date(),
    lastActive: new Date(),
    cpuUsage: 10,
    memoryUsage: 200,
    capabilities: ['task scheduling', 'workflow execution', 'system operations']
  }
];

export const createAgentSlice: AgentSlice = (set, get) => ({
  agents: {},
  isLoading: false,
  error: null,

  addAgent: (agent) => {
    set(
      produce((state) => {
        const newAgent = {
          ...agent,
          id: agent.id || uuidv4(),
          createdAt: agent.createdAt || new Date(),
          lastActive: agent.lastActive || new Date()
        };
        state.agents[newAgent.id] = newAgent;
      })
    );
  },

  updateAgent: (id, updates) => {
    set(
      produce((state) => {
        if (state.agents[id]) {
          state.agents[id] = {
            ...state.agents[id],
            ...updates,
            lastActive: new Date()
          };
        }
      })
    );
  },

  removeAgent: (id) => {
    set(
      produce((state) => {
        delete state.agents[id];
      })
    );
  },

  setAgentStatus: (id, status) => {
    set(
      produce((state) => {
        if (state.agents[id]) {
          state.agents[id].status = status;
          state.agents[id].lastActive = new Date();
        }
      })
    );
  },

  loadAgents: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // In a real app, this would be an API call
      // For now, we'll use mock data in development mode
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const agentsRecord = mockAgents.reduce((acc, agent) => {
          acc[agent.id] = agent;
          return acc;
        }, {} as Record<string, Agent>);
        
        set({ agents: agentsRecord, isLoading: false });
      } else {
        // In production, we would fetch from an API
        // const response = await fetch('/api/agents');
        // const data = await response.json();
        // set({ agents: data, isLoading: false });
        
        // For now, just set an empty object in production
        set({ agents: {}, isLoading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load agents', 
        isLoading: false 
      });
    }
  }
});