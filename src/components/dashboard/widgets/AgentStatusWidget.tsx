import React, { useMemo } from 'react';
import { useAgentCounts, useAgents } from '../../../store';

interface AgentStatusWidgetProps {
  id: string;
  title?: string;
}

const AgentStatusWidget: React.FC<AgentStatusWidgetProps> = ({ 
  id, 
  title = 'Agent Status' 
}) => {
  const agentCounts = useAgentCounts();
  const agents = useAgents();
  
  // Calculate agent type counts
  const agentTypeCounts = useMemo(() => {
    const counts = {
      assistant: 0,
      processor: 0,
      analyzer: 0,
      executor: 0
    };
    
    Object.values(agents).forEach(agent => {
      if (counts.hasOwnProperty(agent.type)) {
        counts[agent.type as keyof typeof counts]++;
      }
    });
    
    return counts;
  }, [agents]);
  
  // Status colors
  const statusColors = {
    idle: '#6c757d',      // Gray
    running: '#28a745',   // Green
    paused: '#ffc107',    // Yellow
    error: '#dc3545',     // Red
    completed: '#17a2b8'  // Blue
  };
  
  return (
    <div className="agent-status-widget">
      <div className="widget-header" style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
      </div>
      
      <div className="widget-content" style={{ padding: '1rem' }}>
        <div className="status-counts" style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          {Object.entries(agentCounts).map(([status, count]) => {
            if (status === 'total') return null;
            
            return (
              <div key={status} className="status-count" style={{ textAlign: 'center' }}>
                <div className="count" style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold',
                  color: statusColors[status as keyof typeof statusColors] || '#000'
                }}>
                  {count}
                </div>
                <div className="label" style={{ textTransform: 'capitalize' }}>
                  {status}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="type-counts" style={{ marginTop: '1.5rem' }}>
          <h4 style={{ marginBottom: '0.5rem' }}>Agent Types</h4>
          
          {Object.entries(agentTypeCounts).map(([type, count]) => (
            <div key={type} className="type-count" style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderBottom: '1px solid #eee'
            }}>
              <div className="type" style={{ textTransform: 'capitalize' }}>{type}</div>
              <div className="count">{count}</div>
            </div>
          ))}
        </div>
        
        <div className="total-agents" style={{ 
          marginTop: '1rem',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          Total Agents: {agentCounts.total}
        </div>
      </div>
    </div>
  );
};

export default AgentStatusWidget;