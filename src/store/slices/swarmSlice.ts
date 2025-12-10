import { v4 as uuidv4 } from 'uuid';
import { produce } from 'immer';
import { SwarmSlice, Swarm, SwarmAgent } from '../types';

// Mock data for development mode
const mockSwarms: Swarm[] = [
  {
    id: '1',
    name: 'Data Processing Swarm',
    description: 'Processes and analyzes incoming data',
    agents: [
      { agentId: '2', role: 'processor', priority: 1 },
      { agentId: '3', role: 'analyzer', priority: 2 }
    ],
    status: 'running',
    createdAt: new Date(),
    lastActive: new Date()
  },
  {
    id: '2',
    name: 'User Interaction Swarm',
    description: 'Handles user queries and interactions',
    agents: [
      { agentId: '1', role: 'assistant', priority: 1 },
      { agentId: '4', role: 'executor', priority: 2 }
    ],
    status: 'idle',
    createdAt: new Date(),
    lastActive: new Date()
  }
];

export const createSwarmSlice: SwarmSlice = (set, get) => ({
  swarms: {},
  isLoading: false,
  error: null,

  addSwarm: (swarm) => {
    set(
      produce((state) => {
        const newSwarm = {
          ...swarm,
          id: swarm.id || uuidv4(),
          createdAt: swarm.createdAt || new Date(),
          lastActive: swarm.lastActive || new Date()
        };
        state.swarms[newSwarm.id] = newSwarm;
      })
    );
  },

  updateSwarm: (id, updates) => {
    set(
      produce((state) => {
        if (state.swarms[id]) {
          state.swarms[id] = {
            ...state.swarms[id],
            ...updates,
            lastActive: new Date()
          };
        }
      })
    );
  },

  removeSwarm: (id) => {
    set(
      produce((state) => {
        delete state.swarms[id];
      })
    );
  },

  addAgentToSwarm: (swarmId, agent) => {
    set(
      produce((state) => {
        if (state.swarms[swarmId]) {
          // Check if agent already exists in swarm
          const existingAgentIndex = state.swarms[swarmId].agents.findIndex(
            (a: SwarmAgent) => a.agentId === agent.agentId
          );

          if (existingAgentIndex === -1) {
            // Add agent if it doesn't exist
            state.swarms[swarmId].agents.push(agent);
          } else {
            // Update existing agent
            state.swarms[swarmId].agents[existingAgentIndex] = agent;
          }

          state.swarms[swarmId].lastActive = new Date();
        }
      })
    );
  },

  removeAgentFromSwarm: (swarmId, agentId) => {
    set(
      produce((state) => {
        if (state.swarms[swarmId]) {
          state.swarms[swarmId].agents = state.swarms[swarmId].agents.filter(
            (agent: SwarmAgent) => agent.agentId !== agentId
          );
          state.swarms[swarmId].lastActive = new Date();
        }
      })
    );
  },

  setSwarmStatus: (swarmId, status) => {
    set(
      produce((state) => {
        if (state.swarms[swarmId]) {
          state.swarms[swarmId].status = status;
          state.swarms[swarmId].lastActive = new Date();
        }
      })
    );
  },

  loadSwarms: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // In a real app, this would be an API call
      // For now, we'll use mock data in development mode
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const swarmsRecord = mockSwarms.reduce((acc, swarm) => {
          acc[swarm.id] = swarm;
          return acc;
        }, {} as Record<string, Swarm>);
        
        set({ swarms: swarmsRecord, isLoading: false });
      } else {
        // In production, we would fetch from an API
        // const response = await fetch('/api/swarms');
        // const data = await response.json();
        // set({ swarms: data, isLoading: false });
        
        // For now, just set an empty object in production
        set({ swarms: {}, isLoading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load swarms', 
        isLoading: false 
      });
    }
  }
});