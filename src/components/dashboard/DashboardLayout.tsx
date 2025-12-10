import React, { useEffect } from 'react';
import { useDashboardSettings, useWidgetLayouts, initializeAppState } from '../../store';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const dashboardSettings = useDashboardSettings();
  const widgetLayouts = useWidgetLayouts();

  useEffect(() => {
    // Initialize app state when the dashboard is mounted
    initializeAppState();
  }, []);

  return (
    <div className="dashboard-layout">
      <div 
        className="dashboard-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridGap: '1rem',
          padding: '1rem',
          width: '100%',
          maxWidth: '100%',
          margin: '0 auto',
        }}
      >
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null;
          
          // Get widget ID from child props
          const widgetId = (child.props as any).id;
          if (!widgetId || !widgetLayouts[widgetId]) return child;
          
          // Get layout for this widget
          const layout = widgetLayouts[widgetId];
          
          return (
            <div
              className="dashboard-widget"
              style={{
                gridColumn: `span ${layout.width}`,
                gridRow: `span ${layout.height}`,
                minHeight: layout.minHeight ? `${layout.minHeight * 100}px` : 'auto',
                backgroundColor: 'var(--widget-bg, #ffffff)',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {child}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardLayout;