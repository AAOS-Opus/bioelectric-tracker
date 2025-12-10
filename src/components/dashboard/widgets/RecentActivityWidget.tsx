import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { useStore } from '../../../store';

interface ActivityEvent {
  id: string;
  timestamp: Date;
  title: string;
  description: string;
  type: 'agent' | 'swarm' | 'system' | 'user';
  icon?: string;
}

interface RecentActivityWidgetProps {
  id: string;
  title?: string;
  maxEvents?: number;
}

const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  id,
  title = 'Recent Activity',
  maxEvents = 10
}) => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const agents = useStore(state => state.agents);
  const swarms = useStore(state => state.swarms);
  
  // Generate activity events based on agents and swarms
  useEffect(() => {
    const generatedEvents: ActivityEvent[] = [];
    
    // Add agent events
    Object.values(agents).forEach(agent => {
      generatedEvents.push({
        id: `agent-${agent.id}-${agent.lastActive.getTime()}`,
        timestamp: agent.lastActive,
        title: `Agent ${agent.name}`,
        description: `Status changed to ${agent.status}`,
        type: 'agent',
        icon: getIconForAgentType(agent.type)
      });
    });
    
    // Add swarm events
    Object.values(swarms).forEach(swarm => {
      generatedEvents.push({
        id: `swarm-${swarm.id}-${swarm.lastActive.getTime()}`,
        timestamp: swarm.lastActive,
        title: `Swarm ${swarm.name}`,
        description: `Status changed to ${swarm.status}`,
        type: 'swarm',
        icon: '🔄'
      });
    });
    
    // Add some system events
    generatedEvents.push({
      id: 'system-startup',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      title: 'System',
      description: 'MaestroDeck started',
      type: 'system',
      icon: '🚀'
    });
    
    generatedEvents.push({
      id: 'user-login',
      timestamp: new Date(Date.now() - 3300000), // 55 minutes ago
      title: 'User',
      description: 'Admin user logged in',
      type: 'user',
      icon: '👤'
    });
    
    // Sort by timestamp (newest first) and limit to maxEvents
    const sortedEvents = generatedEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, maxEvents);
    
    setEvents(sortedEvents);
  }, [agents, swarms, maxEvents]);
  
  // Helper function to get icon for agent type
  const getIconForAgentType = (type: string): string => {
    switch (type) {
      case 'assistant': return '🤖';
      case 'processor': return '⚙️';
      case 'analyzer': return '📊';
      case 'executor': return '🔨';
      default: return '📦';
    }
  };
  
  // Helper function to get color for event type
  const getColorForEventType = (type: string): string => {
    switch (type) {
      case 'agent': return '#007bff';
      case 'swarm': return '#6f42c1';
      case 'system': return '#28a745';
      case 'user': return '#fd7e14';
      default: return '#6c757d';
    }
  };
  
  return (
    <div className="recent-activity-widget">
      <div className="widget-header" style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
      </div>
      
      <div className="widget-content" style={{ padding: '0.5rem' }}>
        <div className="activity-timeline">
          {events.length === 0 ? (
            <div className="no-events" style={{ padding: '1rem', textAlign: 'center' }}>
              No recent activity
            </div>
          ) : (
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0,
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {events.map(event => (
                <li key={event.id} style={{ 
                  padding: '0.75rem 1rem',
                  borderLeft: `3px solid ${getColorForEventType(event.type)}`,
                  marginBottom: '0.5rem',
                  backgroundColor: 'rgba(0,0,0,0.02)',
                  position: 'relative'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '1.25rem', 
                        marginRight: '0.75rem' 
                      }}>
                        {event.icon}
                      </span>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{event.title}</div>
                        <div>{event.description}</div>
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#6c757d',
                      whiteSpace: 'nowrap',
                      marginLeft: '0.5rem'
                    }}>
                      <div title={format(event.timestamp, 'PPpp')}>
                        {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivityWidget;