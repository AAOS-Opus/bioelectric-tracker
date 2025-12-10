/**
 * Recovery Path Map Generator
 * 
 * This module provides utilities for documenting and visualizing recovery paths
 * for different components in the system. Recovery paths describe how components
 * recover from failures, including primary, secondary, and fallback strategies.
 */

import { RecoveryPath } from '../types/chaos';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate a recovery path map in the specified format
 * 
 * @param recoveryPaths Array of recovery paths
 * @param format Output format ('markdown', 'dot', 'json', or 'html')
 * @param outputDir Optional output directory
 * @returns The generated recovery path map as a string
 */
export function generateRecoveryPathMap(
  recoveryPaths: RecoveryPath[],
  format: 'markdown' | 'dot' | 'json' | 'html' = 'markdown',
  outputDir?: string
): string {
  let result = '';
  
  switch (format) {
    case 'markdown':
      result = generateMarkdownMap(recoveryPaths);
      break;
    case 'dot':
      result = generateDotGraph(recoveryPaths);
      break;
    case 'json':
      result = JSON.stringify(recoveryPaths, null, 2);
      break;
    case 'html':
      result = generateHtmlMap(recoveryPaths);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
  
  // Save to file if output directory is specified
  if (outputDir) {
    const fileName = `recovery-paths.${format === 'dot' ? 'gv' : format}`;
    const filePath = path.join(outputDir, fileName);
    
    try {
      // Ensure directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Write file
      fs.writeFileSync(filePath, result);
      console.log(`Recovery path map saved to: ${filePath}`);
    } catch (error) {
      console.error('Error saving recovery path map:', error);
    }
  }
  
  return result;
}

/**
 * Generate a markdown representation of recovery paths
 */
function generateMarkdownMap(recoveryPaths: RecoveryPath[]): string {
  let markdown = '# Recovery Path Map\n\n';
  
  // Add table header
  markdown += '| Component | Primary Recovery | Secondary Recovery | Fallback | Recovery Time (ms) |\n';
  markdown += '|-----------|------------------|-------------------|----------|--------------------|\n';
  
  // Add table rows
  for (const path of recoveryPaths) {
    markdown += `| ${path.component} | ${path.primary} | ${path.secondary || 'N/A'} | ${path.fallback || 'N/A'} | ${path.recoveryTime} |\n`;
  }
  
  // Add summary
  markdown += '\n## Summary\n\n';
  
  const totalComponents = recoveryPaths.length;
  const withSecondary = recoveryPaths.filter(p => p.secondary).length;
  const withFallback = recoveryPaths.filter(p => p.fallback).length;
  const avgRecoveryTime = recoveryPaths.reduce((sum, p) => sum + p.recoveryTime, 0) / totalComponents;
  
  markdown += `- Total Components: ${totalComponents}\n`;
  markdown += `- Components with Secondary Recovery: ${withSecondary} (${Math.round(withSecondary / totalComponents * 100)}%)\n`;
  markdown += `- Components with Fallback: ${withFallback} (${Math.round(withFallback / totalComponents * 100)}%)\n`;
  markdown += `- Average Recovery Time: ${Math.round(avgRecoveryTime)}ms\n`;
  
  return markdown;
}

/**
 * Generate a DOT graph representation of recovery paths
 */
function generateDotGraph(recoveryPaths: RecoveryPath[]): string {
  let dot = 'digraph RecoveryPaths {\n';
  dot += '  rankdir=LR;\n';
  dot += '  node [shape=box, style=filled, fillcolor=lightblue];\n';
  dot += '  edge [fontsize=10];\n\n';
  
  // Add nodes and edges
  for (const path of recoveryPaths) {
    const componentId = sanitizeId(path.component);
    const primaryId = sanitizeId(`${path.component}_primary`);
    
    // Component node
    dot += `  ${componentId} [label="${path.component}"];\n`;
    
    // Primary recovery node
    dot += `  ${primaryId} [label="${path.primary}", fillcolor=lightgreen];\n`;
    dot += `  ${componentId} -> ${primaryId} [label="${path.recoveryTime}ms"];\n`;
    
    // Secondary recovery node (if exists)
    if (path.secondary) {
      const secondaryId = sanitizeId(`${path.component}_secondary`);
      dot += `  ${secondaryId} [label="${path.secondary}", fillcolor=yellow];\n`;
      dot += `  ${primaryId} -> ${secondaryId} [style=dashed];\n`;
      
      // Fallback node (if exists)
      if (path.fallback) {
        const fallbackId = sanitizeId(`${path.component}_fallback`);
        dot += `  ${fallbackId} [label="${path.fallback}", fillcolor=orange];\n`;
        dot += `  ${secondaryId} -> ${fallbackId} [style=dotted];\n`;
      }
    } 
    // Fallback without secondary
    else if (path.fallback) {
      const fallbackId = sanitizeId(`${path.component}_fallback`);
      dot += `  ${fallbackId} [label="${path.fallback}", fillcolor=orange];\n`;
      dot += `  ${primaryId} -> ${fallbackId} [style=dotted];\n`;
    }
    
    dot += '\n';
  }
  
  dot += '}\n';
  
  return dot;
}

/**
 * Generate an HTML representation of recovery paths
 */
function generateHtmlMap(recoveryPaths: RecoveryPath[]): string {
  const totalComponents = recoveryPaths.length;
  const withSecondary = recoveryPaths.filter(p => p.secondary).length;
  const withFallback = recoveryPaths.filter(p => p.fallback).length;
  const avgRecoveryTime = recoveryPaths.reduce((sum, p) => sum + p.recoveryTime, 0) / totalComponents;
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recovery Path Map</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
    }
    .summary {
      background-color: #f8f9fa;
      border-left: 4px solid #4CAF50;
      padding: 15px;
      margin-bottom: 20px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #4CAF50;
      color: white;
    }
    tr:nth-child(even) {
      background-color: #f2f2f2;
    }
    .recovery-time {
      text-align: right;
    }
    .na {
      color: #999;
      font-style: italic;
    }
    .visualization {
      margin-top: 30px;
    }
    .component {
      margin-bottom: 20px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .component h3 {
      margin-top: 0;
      color: #2c3e50;
    }
    .recovery-path {
      display: flex;
      align-items: center;
      margin-top: 10px;
    }
    .recovery-step {
      padding: 10px;
      border-radius: 4px;
      margin-right: 10px;
      position: relative;
    }
    .recovery-step:not(:last-child)::after {
      content: "→";
      position: absolute;
      right: -10px;
      top: 50%;
      transform: translateY(-50%);
    }
    .primary {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
    }
    .secondary {
      background-color: #fff3cd;
      border: 1px solid #ffeeba;
    }
    .fallback {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
    }
  </style>
</head>
<body>
  <h1>Recovery Path Map</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Components: ${totalComponents}</p>
    <p>Components with Secondary Recovery: ${withSecondary} (${Math.round(withSecondary / totalComponents * 100)}%)</p>
    <p>Components with Fallback: ${withFallback} (${Math.round(withFallback / totalComponents * 100)}%)</p>
    <p>Average Recovery Time: ${Math.round(avgRecoveryTime)}ms</p>
  </div>
  
  <h2>Recovery Paths</h2>
  <table>
    <thead>
      <tr>
        <th>Component</th>
        <th>Primary Recovery</th>
        <th>Secondary Recovery</th>
        <th>Fallback</th>
        <th>Recovery Time (ms)</th>
      </tr>
    </thead>
    <tbody>`;
  
  for (const path of recoveryPaths) {
    html += `
      <tr>
        <td>${path.component}</td>
        <td>${path.primary}</td>
        <td>${path.secondary || '<span class="na">N/A</span>'}</td>
        <td>${path.fallback || '<span class="na">N/A</span>'}</td>
        <td class="recovery-time">${path.recoveryTime}</td>
      </tr>`;
  }
  
  html += `
    </tbody>
  </table>
  
  <div class="visualization">
    <h2>Visual Representation</h2>`;
  
  for (const path of recoveryPaths) {
    html += `
    <div class="component">
      <h3>${path.component}</h3>
      <div class="recovery-path">
        <div class="recovery-step primary">${path.primary}</div>`;
    
    if (path.secondary) {
      html += `
        <div class="recovery-step secondary">${path.secondary}</div>`;
    }
    
    if (path.fallback) {
      html += `
        <div class="recovery-step fallback">${path.fallback}</div>`;
    }
    
    html += `
      </div>
      <p>Recovery Time: ${path.recoveryTime}ms</p>
    </div>`;
  }
  
  html += `
  </div>
</body>
</html>`;
  
  return html;
}

/**
 * Sanitize a string for use as a DOT graph ID
 */
function sanitizeId(str: string): string {
  return `"${str.replace(/[^\w\s]/g, '_')}"`;
}

/**
 * Create a sample recovery path map for demonstration
 */
export function createSampleRecoveryPathMap(): RecoveryPath[] {
  return [
    {
      component: 'Voice Module',
      primary: 'Reconnect WebSpeech',
      secondary: 'Local Recognition',
      fallback: 'Text Input Mode',
      recoveryTime: 1500
    },
    {
      component: 'Network Client',
      primary: 'Retry with Exponential Backoff',
      secondary: 'Switch to Backup API',
      fallback: 'Offline Mode',
      recoveryTime: 2000
    },
    {
      component: 'State Management',
      primary: 'Rehydrate from LocalStorage',
      secondary: 'Rebuild from Server',
      recoveryTime: 800
    },
    {
      component: 'UI Rendering',
      primary: 'Error Boundary Recovery',
      fallback: 'Minimal UI Mode',
      recoveryTime: 300
    },
    {
      component: 'Authentication',
      primary: 'Token Refresh',
      secondary: 'Silent Reauthentication',
      fallback: 'Guest Mode',
      recoveryTime: 1200
    },
    {
      component: 'Database',
      primary: 'Connection Pool Reset',
      secondary: 'Replica Failover',
      fallback: 'In-Memory Cache',
      recoveryTime: 3000
    },
    {
      component: 'Intent Processing',
      primary: 'Retry Processing',
      secondary: 'Fallback Intent Matching',
      recoveryTime: 500
    }
  ];
}