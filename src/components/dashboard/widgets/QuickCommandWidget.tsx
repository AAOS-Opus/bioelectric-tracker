import React, { useState, useRef, useEffect } from 'react';
import { useStore, useAgents, useSwarms } from '../../../store';

interface QuickCommandWidgetProps {
  id: string;
  title?: string;
}

interface CommandHistory {
  command: string;
  result: string;
  timestamp: Date;
  success: boolean;
}

interface CommandSuggestion {
  command: string;
  description: string;
}

const QuickCommandWidget: React.FC<QuickCommandWidgetProps> = ({
  id,
  title = 'Quick Command'
}) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const agents = useAgents();
  const swarms = useSwarms();
  const addAgent = useStore(state => state.addAgent);
  const updateAgent = useStore(state => state.updateAgent);
  const removeAgent = useStore(state => state.removeAgent);
  const setAgentStatus = useStore(state => state.setAgentStatus);
  const addSwarm = useStore(state => state.addSwarm);
  const setSwarmStatus = useStore(state => state.setSwarmStatus);
  const addNotification = useStore(state => state.addNotification);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Update suggestions based on current command
  useEffect(() => {
    if (!command) {
      setSuggestions([]);
      return;
    }
    
    const availableCommands: CommandSuggestion[] = [
      { command: 'help', description: 'Show available commands' },
      { command: 'list agents', description: 'List all agents' },
      { command: 'list swarms', description: 'List all swarms' },
      { command: 'start agent <id>', description: 'Start an agent' },
      { command: 'stop agent <id>', description: 'Stop an agent' },
      { command: 'pause agent <id>', description: 'Pause an agent' },
      { command: 'resume agent <id>', description: 'Resume an agent' },
      { command: 'start swarm <id>', description: 'Start a swarm' },
      { command: 'stop swarm <id>', description: 'Stop a swarm' },
      { command: 'clear', description: 'Clear command history' }
    ];
    
    // Filter suggestions based on current command
    const filtered = availableCommands.filter(
      suggestion => suggestion.command.toLowerCase().includes(command.toLowerCase())
    );
    
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [command]);
  
  // Handle command execution
  const executeCommand = (cmd: string) => {
    // Add command to history
    const newHistoryItem: CommandHistory = {
      command: cmd,
      result: '',
      timestamp: new Date(),
      success: true
    };
    
    // Process command
    const parts = cmd.trim().toLowerCase().split(' ');
    const mainCommand = parts[0];
    
    switch (mainCommand) {
      case 'help':
        newHistoryItem.result = `
Available commands:
- help: Show available commands
- list agents: List all agents
- list swarms: List all swarms
- start agent <id>: Start an agent
- stop agent <id>: Stop an agent
- pause agent <id>: Pause an agent
- resume agent <id>: Resume an agent
- start swarm <id>: Start a swarm
- stop swarm <id>: Stop a swarm
- clear: Clear command history
        `.trim();
        break;
        
      case 'list':
        if (parts[1] === 'agents') {
          const agentList = Object.values(agents).map(
            agent => `${agent.id}: ${agent.name} (${agent.status})`
          ).join('\n');
          newHistoryItem.result = agentList || 'No agents found';
        } else if (parts[1] === 'swarms') {
          const swarmList = Object.values(swarms).map(
            swarm => `${swarm.id}: ${swarm.name} (${swarm.status})`
          ).join('\n');
          newHistoryItem.result = swarmList || 'No swarms found';
        } else {
          newHistoryItem.result = 'Unknown list command. Try "list agents" or "list swarms"';
          newHistoryItem.success = false;
        }
        break;
        
      case 'start':
      case 'stop':
      case 'pause':
      case 'resume':
        if (parts[1] === 'agent' && parts[2]) {
          const agentId = parts[2];
          const agent = agents[agentId];
          
          if (!agent) {
            newHistoryItem.result = `Agent with ID ${agentId} not found`;
            newHistoryItem.success = false;
            break;
          }
          
          let newStatus: 'idle' | 'running' | 'paused' | 'error' | 'completed';
          
          switch (mainCommand) {
            case 'start':
              newStatus = 'running';
              break;
            case 'stop':
              newStatus = 'idle';
              break;
            case 'pause':
              newStatus = 'paused';
              break;
            case 'resume':
              newStatus = 'running';
              break;
            default:
              newStatus = 'idle';
          }
          
          setAgentStatus(agentId, newStatus);
          newHistoryItem.result = `Agent ${agent.name} (${agentId}) is now ${newStatus}`;
          
          // Add notification
          addNotification({
            id: '',
            title: 'Agent Status Changed',
            message: `Agent ${agent.name} is now ${newStatus}`,
            type: 'info',
            createdAt: new Date(),
            read: false
          });
          
        } else if (parts[1] === 'swarm' && parts[2]) {
          const swarmId = parts[2];
          const swarm = swarms[swarmId];
          
          if (!swarm) {
            newHistoryItem.result = `Swarm with ID ${swarmId} not found`;
            newHistoryItem.success = false;
            break;
          }
          
          let newStatus: 'idle' | 'running' | 'paused' | 'error' | 'completed';
          
          switch (mainCommand) {
            case 'start':
              newStatus = 'running';
              break;
            case 'stop':
              newStatus = 'idle';
              break;
            default:
              newStatus = 'idle';
          }
          
          setSwarmStatus(swarmId, newStatus);
          newHistoryItem.result = `Swarm ${swarm.name} (${swarmId}) is now ${newStatus}`;
          
          // Add notification
          addNotification({
            id: '',
            title: 'Swarm Status Changed',
            message: `Swarm ${swarm.name} is now ${newStatus}`,
            type: 'info',
            createdAt: new Date(),
            read: false
          });
          
        } else {
          newHistoryItem.result = 'Invalid command format. Try "start agent <id>" or "start swarm <id>"';
          newHistoryItem.success = false;
        }
        break;
        
      case 'clear':
        setHistory([]);
        newHistoryItem.result = 'Command history cleared';
        break;
        
      default:
        newHistoryItem.result = `Unknown command: ${cmd}`;
        newHistoryItem.success = false;
    }
    
    // Update history
    if (mainCommand !== 'clear') {
      setHistory(prev => [...prev, newHistoryItem]);
    }
    
    // Clear input
    setCommand('');
    setShowSuggestions(false);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) return;
    
    executeCommand(command.trim());
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setCommand(suggestion);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  return (
    <div className="quick-command-widget">
      <div className="widget-header" style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
      </div>
      
      <div className="widget-content" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)' }}>
        {/* Command History */}
        <div className="command-history" style={{ 
          flexGrow: 1, 
          overflowY: 'auto',
          padding: '0.5rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '0.25rem',
          marginBottom: '0.5rem',
          fontFamily: 'monospace',
          fontSize: '0.9rem'
        }}>
          {history.length === 0 ? (
            <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
              Type 'help' to see available commands
            </div>
          ) : (
            history.map((item, index) => (
              <div key={index} style={{ marginBottom: '0.75rem' }}>
                <div style={{ 
                  color: '#495057', 
                  fontWeight: 'bold',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>$ {item.command}</span>
                  <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                    {item.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ 
                  whiteSpace: 'pre-wrap',
                  color: item.success ? '#212529' : '#dc3545',
                  marginTop: '0.25rem',
                  paddingLeft: '1rem'
                }}>
                  {item.result || 'Command executed successfully'}
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Command Input */}
        <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
          <div style={{ display: 'flex' }}>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: '0 0.5rem',
              backgroundColor: '#e9ecef',
              borderTopLeftRadius: '0.25rem',
              borderBottomLeftRadius: '0.25rem',
              borderTop: '1px solid #ced4da',
              borderLeft: '1px solid #ced4da',
              borderBottom: '1px solid #ced4da',
              color: '#495057',
              fontWeight: 'bold'
            }}>
              $
            </span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter command..."
              style={{
                flexGrow: 1,
                padding: '0.5rem',
                border: '1px solid #ced4da',
                borderTopRightRadius: '0.25rem',
                borderBottomRightRadius: '0.25rem',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>
          
          {/* Command Suggestions */}
          {showSuggestions && (
            <div style={{
              position: 'absolute',
              top: '-1px',
              left: 0,
              right: 0,
              transform: 'translateY(-100%)',
              backgroundColor: 'white',
              border: '1px solid #ced4da',
              borderRadius: '0.25rem',
              boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
              zIndex: 10
            }}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.command)}
                  style={{
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    borderBottom: index < suggestions.length - 1 ? '1px solid #e9ecef' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>{suggestion.command}</span>
                  <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>{suggestion.description}</span>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default QuickCommandWidget;