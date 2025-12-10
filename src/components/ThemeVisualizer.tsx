/**
 * Theme Visualizer Component for Bioelectric Regeneration Tracker
 * 
 * This component allows for visual comparison of light and dark modes,
 * generation of contrast ratio reports, and theme debugging.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { calculateContrastRatio, meetsContrastStandard } from '../utils/theme-utils';
import html2canvas from 'html2canvas'; // You would need to install this package

// Component interfaces
interface ComponentPreview {
  id: string;
  name: string;
  component: React.ReactNode;
}

interface ContrastReport {
  elementName: string;
  lightMode: {
    foreground: string;
    background: string;
    ratio: number;
    passesAA: boolean;
    passesAAA: boolean;
  };
  darkMode: {
    foreground: string;
    background: string;
    ratio: number;
    passesAA: boolean;
    passesAAA: boolean;
  };
}

const ThemeVisualizer: React.FC = () => {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const [reports, setReports] = useState<ContrastReport[]>([]);
  const [screenshots, setScreenshots] = useState<{light: string, dark: string}[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('dashboard');
  const lightPreviewRef = useRef<HTMLDivElement>(null);
  const darkPreviewRef = useRef<HTMLDivElement>(null);

  // Component previews for testing
  const componentPreviews: ComponentPreview[] = [
    {
      id: 'buttons',
      name: 'Buttons',
      component: (
        <div className="preview-section">
          <button className="btn-primary" data-preview-id="primary-button">Primary Button</button>
          <button className="btn-secondary" data-preview-id="secondary-button">Secondary Button</button>
          <button className="btn-outline" data-preview-id="outline-button">Outline Button</button>
        </div>
      )
    },
    {
      id: 'cards',
      name: 'Cards',
      component: (
        <div className="preview-section">
          <div className="card" data-preview-id="standard-card">
            <h3>Standard Card</h3>
            <p>This is a standard card component with regular text content.</p>
          </div>
          <div className="card" data-preview-id="interactive-card">
            <h3>Interactive Card</h3>
            <p>Card with interactive elements:</p>
            <button className="btn-primary">Action Button</button>
          </div>
        </div>
      )
    },
    {
      id: 'forms',
      name: 'Form Elements',
      component: (
        <div className="preview-section">
          <div className="form-group" data-preview-id="input-group">
            <label htmlFor="sample-input">Text Input</label>
            <input id="sample-input" type="text" placeholder="Enter text..." />
          </div>
          <div className="form-group" data-preview-id="checkbox-group">
            <label>
              <input type="checkbox" /> Checkbox Option
            </label>
          </div>
          <div className="form-group" data-preview-id="select-group">
            <label htmlFor="sample-select">Select Menu</label>
            <select id="sample-select">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
        </div>
      )
    },
    {
      id: 'alerts',
      name: 'Alerts & Notifications',
      component: (
        <div className="preview-section">
          <div className="alert alert-info" data-preview-id="info-alert">
            This is an informational alert
          </div>
          <div className="alert alert-success" data-preview-id="success-alert">
            Operation completed successfully
          </div>
          <div className="alert alert-warning" data-preview-id="warning-alert">
            Warning: This action cannot be undone
          </div>
          <div className="alert alert-error" data-preview-id="error-alert">
            Error: Operation failed
          </div>
        </div>
      )
    },
    {
      id: 'notification-center',
      name: 'Notification Center',
      component: (
        <div className="preview-section">
          <div className="notification-center" data-preview-id="notification-center">
            <div className="notification-header">
              <h3>Notifications</h3>
              <button className="btn-text">Mark all as read</button>
            </div>
            <div className="notification-list">
              <div className="notification-item unread" data-preview-id="protocol-notification">
                <div className="notification-icon medical-blue">
                  <span className="icon">📋</span>
                </div>
                <div className="notification-content">
                  <h4>Daily Protocol Reminder</h4>
                  <p>Complete your Phase 2 protocol activities for today</p>
                  <span className="notification-time">10 minutes ago</span>
                </div>
              </div>
              <div className="notification-item" data-preview-id="alert-notification">
                <div className="notification-icon medical-green">
                  <span className="icon">⚕️</span>
                </div>
                <div className="notification-content">
                  <h4>Modality Session Alert</h4>
                  <p>Your scheduled ultrasound session begins in 30 minutes</p>
                  <span className="notification-time">25 minutes ago</span>
                </div>
              </div>
              <div className="notification-item" data-preview-id="report-notification">
                <div className="notification-icon medical-purple">
                  <span className="icon">📊</span>
                </div>
                <div className="notification-content">
                  <h4>Weekly Progress Report</h4>
                  <p>Your biomarker trends show positive improvement</p>
                  <span className="notification-time">2 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'dashboard',
      name: 'Dashboard Layout',
      component: (
        <div className="preview-section dashboard-preview" data-preview-id="dashboard">
          <div className="sidebar" data-preview-id="sidebar">
            <div className="sidebar-header">
              <h2>Bioelectric Tracker</h2>
            </div>
            <nav className="sidebar-nav">
              <ul>
                <li className="active"><a href="#">Dashboard</a></li>
                <li><a href="#">Protocol</a></li>
                <li><a href="#">Biomarkers</a></li>
                <li><a href="#">Schedule</a></li>
                <li><a href="#">Resources</a></li>
                <li><a href="#">Settings</a></li>
              </ul>
            </nav>
          </div>
          <div className="main-content" data-preview-id="main-content">
            <header className="content-header">
              <h1>Your Regeneration Dashboard</h1>
              <div className="user-controls">
                <button className="btn-outline">Help</button>
                <div className="user-avatar">US</div>
              </div>
            </header>
            <div className="dashboard-grid">
              <div className="card" data-preview-id="progress-card">
                <h3>Protocol Progress</h3>
                <div className="progress-indicator">
                  <div className="progress-bar" style={{width: '65%'}}>65%</div>
                </div>
                <p>You're in Phase 2 - Day 14</p>
              </div>
              <div className="card" data-preview-id="biomarker-card">
                <h3>Key Biomarkers</h3>
                <div className="biomarker-list">
                  <div className="biomarker-item">
                    <span className="biomarker-name">ALT</span>
                    <span className="biomarker-value improved">32 U/L</span>
                  </div>
                  <div className="biomarker-item">
                    <span className="biomarker-name">AST</span>
                    <span className="biomarker-value improved">28 U/L</span>
                  </div>
                  <div className="biomarker-item">
                    <span className="biomarker-name">CEA</span>
                    <span className="biomarker-value normal">2.4 ng/mL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Generate contrast reports for both themes
  const generateContrastReports = async () => {
    // Helper to get computed styles
    const getElementStyles = (element: HTMLElement) => {
      const styles = window.getComputedStyle(element);
      return {
        foreground: styles.color,
        background: styles.backgroundColor
      };
    };

    // Clear existing reports
    setReports([]);
    
    // Elements to test (find by data-preview-id)
    const elementsToTest = [
      { id: 'primary-button', name: 'Primary Button' },
      { id: 'secondary-button', name: 'Secondary Button' },
      { id: 'outline-button', name: 'Outline Button' },
      { id: 'standard-card', name: 'Standard Card' },
      { id: 'info-alert', name: 'Info Alert' },
      { id: 'success-alert', name: 'Success Alert' },
      { id: 'warning-alert', name: 'Warning Alert' },
      { id: 'error-alert', name: 'Error Alert' },
      { id: 'protocol-notification', name: 'Protocol Notification' },
      { id: 'dashboard', name: 'Dashboard Background' }
    ];

    // Get light mode values
    setTheme('light');
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for theme to apply
    
    const lightModeValues: Record<string, {foreground: string, background: string}> = {};
    
    elementsToTest.forEach(({id}) => {
      const element = document.querySelector(`[data-preview-id="${id}"]`) as HTMLElement;
      if (element) {
        lightModeValues[id] = getElementStyles(element);
      }
    });
    
    // Get dark mode values
    setTheme('dark');
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for theme to apply
    
    const newReports: ContrastReport[] = [];
    
    elementsToTest.forEach(({id, name}) => {
      const element = document.querySelector(`[data-preview-id="${id}"]`) as HTMLElement;
      if (element && lightModeValues[id]) {
        const darkStyles = getElementStyles(element);
        const lightStyles = lightModeValues[id];
        
        const lightRatio = calculateContrastRatio(lightStyles.foreground, lightStyles.background);
        const darkRatio = calculateContrastRatio(darkStyles.foreground, darkStyles.background);
        
        newReports.push({
          elementName: name,
          lightMode: {
            foreground: lightStyles.foreground,
            background: lightStyles.background,
            ratio: lightRatio,
            passesAA: meetsContrastStandard(lightRatio, 'AA'),
            passesAAA: meetsContrastStandard(lightRatio, 'AAA')
          },
          darkMode: {
            foreground: darkStyles.foreground,
            background: darkStyles.background,
            ratio: darkRatio,
            passesAA: meetsContrastStandard(darkRatio, 'AA'),
            passesAAA: meetsContrastStandard(darkRatio, 'AAA')
          }
        });
      }
    });
    
    setReports(newReports);
  };

  // Capture screenshots of both themes
  const captureScreenshots = async () => {
    if (!lightPreviewRef.current || !darkPreviewRef.current) return;
    
    setTheme('light');
    await new Promise(resolve => setTimeout(resolve, 300)); // Wait for theme to apply
    
    const lightCanvas = await html2canvas(lightPreviewRef.current);
    const lightScreenshot = lightCanvas.toDataURL();
    
    setTheme('dark');
    await new Promise(resolve => setTimeout(resolve, 300)); // Wait for theme to apply
    
    const darkCanvas = await html2canvas(darkPreviewRef.current);
    const darkScreenshot = darkCanvas.toDataURL();
    
    setScreenshots(prev => [...prev, { light: lightScreenshot, dark: darkScreenshot }]);
  };

  // Download the report
  const downloadReport = () => {
    // Create report content
    let reportContent = `# Bioelectric Regeneration Tracker - Theme Contrast Report\n\n`;
    reportContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    reportContent += `## Contrast Ratio Summary\n\n`;
    reportContent += `| Element | Light Mode Ratio | Dark Mode Ratio | Light AA | Light AAA | Dark AA | Dark AAA |\n`;
    reportContent += `|---------|-----------------|-----------------|----------|-----------|---------|----------|\n`;
    
    reports.forEach(report => {
      reportContent += `| ${report.elementName} | ${report.lightMode.ratio.toFixed(2)}:1 | ${report.darkMode.ratio.toFixed(2)}:1 | ${report.lightMode.passesAA ? '✅' : '❌'} | ${report.lightMode.passesAAA ? '✅' : '❌'} | ${report.darkMode.passesAA ? '✅' : '❌'} | ${report.darkMode.passesAAA ? '✅' : '❌'} |\n`;
    });
    
    reportContent += `\n## Detailed Analysis\n\n`;
    
    reports.forEach(report => {
      reportContent += `### ${report.elementName}\n\n`;
      reportContent += `#### Light Mode\n`;
      reportContent += `- Foreground: ${report.lightMode.foreground}\n`;
      reportContent += `- Background: ${report.lightMode.background}\n`;
      reportContent += `- Contrast Ratio: ${report.lightMode.ratio.toFixed(2)}:1\n`;
      reportContent += `- WCAG AA: ${report.lightMode.passesAA ? 'Pass' : 'Fail'}\n`;
      reportContent += `- WCAG AAA: ${report.lightMode.passesAAA ? 'Pass' : 'Fail'}\n\n`;
      
      reportContent += `#### Dark Mode\n`;
      reportContent += `- Foreground: ${report.darkMode.foreground}\n`;
      reportContent += `- Background: ${report.darkMode.background}\n`;
      reportContent += `- Contrast Ratio: ${report.darkMode.ratio.toFixed(2)}:1\n`;
      reportContent += `- WCAG AA: ${report.darkMode.passesAA ? 'Pass' : 'Fail'}\n`;
      reportContent += `- WCAG AAA: ${report.darkMode.passesAAA ? 'Pass' : 'Fail'}\n\n`;
    });
    
    // Create downloadable file
    const element = document.createElement('a');
    const file = new Blob([reportContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'theme-contrast-report.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Find the selected component
  const selectedComponent = componentPreviews.find(comp => comp.id === selectedSection);

  // Styles for the visualizer
  const visualizerStyles = {
    container: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      marginBottom: '2rem'
    },
    controlsRow: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap' as const
    },
    section: {
      marginBottom: '2rem'
    },
    sectionTitle: {
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '0.5rem',
      marginBottom: '1rem'
    },
    splitView: {
      display: 'flex',
      gap: '2rem',
      marginBottom: '2rem'
    },
    previewColumn: {
      flex: 1,
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--border-radius-md)',
      overflow: 'hidden'
    },
    previewHeader: {
      backgroundColor: 'var(--surface-color)',
      padding: '0.75rem 1rem',
      borderBottom: '1px solid var(--border-color)',
      fontWeight: 'bold'
    },
    previewContent: {
      padding: '1.5rem'
    },
    reportTable: {
      width: '100%',
      borderCollapse: 'collapse' as const
    },
    navTabs: {
      display: 'flex',
      listStyle: 'none',
      padding: 0,
      margin: '0 0 1.5rem 0',
      borderBottom: '1px solid var(--border-color)'
    },
    navTab: {
      padding: '0.5rem 1rem',
      cursor: 'pointer',
      borderBottom: '3px solid transparent'
    },
    navTabActive: {
      borderBottom: '3px solid var(--primary-color)',
      fontWeight: 'bold'
    }
  };

  return (
    <div style={visualizerStyles.container}>
      <div style={visualizerStyles.header}>
        <h1>Theme Visualizer - Bioelectric Regeneration Tracker</h1>
        <p>Test and compare light and dark mode implementations side by side</p>
      </div>
      
      <div style={visualizerStyles.controlsRow}>
        <button className="btn-primary" onClick={generateContrastReports}>
          Generate Contrast Report
        </button>
        <button className="btn-primary" onClick={captureScreenshots}>
          Capture Screenshots
        </button>
        <button className="btn-outline" onClick={downloadReport}>
          Download Report
        </button>
      </div>
      
      <div style={visualizerStyles.section}>
        <h2 style={visualizerStyles.sectionTitle}>Component Selection</h2>
        <ul style={visualizerStyles.navTabs}>
          {componentPreviews.map(component => (
            <li 
              key={component.id}
              style={{
                ...visualizerStyles.navTab,
                ...(selectedSection === component.id ? visualizerStyles.navTabActive : {})
              }}
              onClick={() => setSelectedSection(component.id)}
            >
              {component.name}
            </li>
          ))}
        </ul>
      </div>
      
      <div style={visualizerStyles.section}>
        <h2 style={visualizerStyles.sectionTitle}>Side-by-Side Comparison</h2>
        <div style={visualizerStyles.splitView}>
          <div style={visualizerStyles.previewColumn}>
            <div style={visualizerStyles.previewHeader}>Light Mode</div>
            <div 
              style={visualizerStyles.previewContent} 
              className="light-mode"
              ref={lightPreviewRef}
            >
              {selectedComponent?.component}
            </div>
          </div>
          
          <div style={visualizerStyles.previewColumn}>
            <div style={visualizerStyles.previewHeader}>Dark Mode</div>
            <div 
              style={visualizerStyles.previewContent} 
              className="dark-mode"
              ref={darkPreviewRef}
            >
              {selectedComponent?.component}
            </div>
          </div>
        </div>
      </div>
      
      {reports.length > 0 && (
        <div style={visualizerStyles.section}>
          <h2 style={visualizerStyles.sectionTitle}>Contrast Ratio Analysis</h2>
          <table style={visualizerStyles.reportTable}>
            <thead>
              <tr>
                <th>Element</th>
                <th>Light Mode Ratio</th>
                <th>Light Mode AA</th>
                <th>Light Mode AAA</th>
                <th>Dark Mode Ratio</th>
                <th>Dark Mode AA</th>
                <th>Dark Mode AAA</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, index) => (
                <tr key={index}>
                  <td>{report.elementName}</td>
                  <td>{report.lightMode.ratio.toFixed(2)}:1</td>
                  <td>{report.lightMode.passesAA ? '✓' : '✗'}</td>
                  <td>{report.lightMode.passesAAA ? '✓' : '✗'}</td>
                  <td>{report.darkMode.ratio.toFixed(2)}:1</td>
                  <td>{report.darkMode.passesAA ? '✓' : '✗'}</td>
                  <td>{report.darkMode.passesAAA ? '✓' : '✗'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {screenshots.length > 0 && (
        <div style={visualizerStyles.section}>
          <h2 style={visualizerStyles.sectionTitle}>Captured Screenshots</h2>
          {screenshots.map((pair, index) => (
            <div key={index} style={{marginBottom: '2rem'}}>
              <h3>Screenshot Set {index + 1}</h3>
              <div style={visualizerStyles.splitView}>
                <div style={visualizerStyles.previewColumn}>
                  <div style={visualizerStyles.previewHeader}>Light Mode</div>
                  <img src={pair.light} alt="Light Mode Screenshot" style={{width: '100%'}} />
                </div>
                <div style={visualizerStyles.previewColumn}>
                  <div style={visualizerStyles.previewHeader}>Dark Mode</div>
                  <img src={pair.dark} alt="Dark Mode Screenshot" style={{width: '100%'}} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeVisualizer;
