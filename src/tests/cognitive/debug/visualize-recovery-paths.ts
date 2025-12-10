/**
 * Visualize Recovery Paths
 * 
 * This script generates graph visualizations of recovery paths and failure cascades
 * using GraphViz DOT format.
 */

import * as fs from 'fs';
import * as path from 'path';

// Define paths
const ROOT_DIR = path.resolve(__dirname, '../../../../');
const LOGS_DIR = path.join(ROOT_DIR, 'logs/chaos');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const RECOVERY_PATHS_PATH = path.join(DOCS_DIR, 'recovery-paths.json');
const CASCADE_MAP_PATH = path.join(LOGS_DIR, 'cascade-map.json');
const RECOVERY_DOT_PATH = path.join(LOGS_DIR, 'recovery-paths.dot');
const CASCADE_DOT_PATH = path.join(LOGS_DIR, 'cascade-map.dot');

// Define interfaces
interface RecoveryPath {
  component: string;
  primary: string;
  secondary?: string;
  fallback?: string;
  recoveryTime: number;
}

interface FailureCascade {
  root: string;
  effects: string[];
  timestamp: number;
  duration: number;
  resilientComponents: string[];
}

/**
 * Load recovery paths from file
 * 
 * @returns Array of recovery paths or empty array if file doesn't exist
 */
function loadRecoveryPaths(): RecoveryPath[] {
  try {
    if (!fs.existsSync(RECOVERY_PATHS_PATH)) {
      console.warn(`Recovery paths file not found: ${RECOVERY_PATHS_PATH}`);
      return [];
    }
    
    const data = fs.readFileSync(RECOVERY_PATHS_PATH, 'utf8');
    return JSON.parse(data) as RecoveryPath[];
  } catch (error) {
    console.error(`Error loading recovery paths from ${RECOVERY_PATHS_PATH}:`, error);
    return [];
  }
}

/**
 * Load failure cascades from file
 * 
 * @returns Array of failure cascades or empty array if file doesn't exist
 */
function loadFailureCascades(): FailureCascade[] {
  try {
    if (!fs.existsSync(CASCADE_MAP_PATH)) {
      console.warn(`Cascade map file not found: ${CASCADE_MAP_PATH}`);
      return [];
    }
    
    const data = fs.readFileSync(CASCADE_MAP_PATH, 'utf8');
    return JSON.parse(data) as FailureCascade[];
  } catch (error) {
    console.error(`Error loading failure cascades from ${CASCADE_MAP_PATH}:`, error);
    return [];
  }
}

/**
 * Sanitize ID for GraphViz
 * 
 * @param id ID to sanitize
 * @returns Sanitized ID
 */
function sanitizeId(id: string): string {
  // Replace non-alphanumeric characters with underscore
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Generate recovery paths DOT file
 * 
 * @param recoveryPaths Array of recovery paths
 * @returns DOT file content
 */
function generateRecoveryPathsDot(recoveryPaths: RecoveryPath[]): string {
  let dot = 'digraph RecoveryPaths {\n';
  dot += '  rankdir=LR;\n';
  dot += '  node [shape=box, style=filled, fontname="Arial"];\n';
  dot += '  edge [fontname="Arial"];\n\n';
  
  // Add legend
  dot += '  subgraph cluster_legend {\n';
  dot += '    label="Legend";\n';
  dot += '    style=filled;\n';
  dot += '    color=lightgrey;\n';
  dot += '    node [style=filled];\n';
  dot += '    Component [fillcolor="#A0D0FF"];\n';
  dot += '    Primary [fillcolor="#90EE90"];\n';
  dot += '    Secondary [fillcolor="#FFFF99"];\n';
  dot += '    Fallback [fillcolor="#FFB6C1"];\n';
  dot += '  }\n\n';
  
  // Group components by recovery time
  const componentsByRecoveryTime: Record<number, string[]> = {};
  
  for (const path of recoveryPaths) {
    const recoveryTime = path.recoveryTime;
    if (!componentsByRecoveryTime[recoveryTime]) {
      componentsByRecoveryTime[recoveryTime] = [];
    }
    componentsByRecoveryTime[recoveryTime].push(path.component);
  }
  
  // Add recovery time clusters
  for (const [recoveryTime, components] of Object.entries(componentsByRecoveryTime)) {
    dot += `  subgraph cluster_recovery_${recoveryTime} {\n`;
    dot += `    label="Recovery Time: ${recoveryTime}ms";\n`;
    dot += '    style=filled;\n';
    dot += '    color=lightgrey;\n';
    
    for (const component of components) {
      const componentId = sanitizeId(component);
      dot += `    ${componentId} [label="${component}", fillcolor="#A0D0FF"];\n`;
    }
    
    dot += '  }\n\n';
  }
  
  // Add recovery paths
  for (const path of recoveryPaths) {
    const componentId = sanitizeId(path.component);
    const primaryId = sanitizeId(`${path.component}_primary`);
    
    // Add primary recovery strategy
    dot += `  ${primaryId} [label="${path.primary}", fillcolor="#90EE90"];\n`;
    dot += `  ${componentId} -> ${primaryId} [label="Primary"];\n`;
    
    // Add secondary recovery strategy if exists
    if (path.secondary) {
      const secondaryId = sanitizeId(`${path.component}_secondary`);
      dot += `  ${secondaryId} [label="${path.secondary}", fillcolor="#FFFF99"];\n`;
      dot += `  ${componentId} -> ${secondaryId} [label="Secondary"];\n`;
    }
    
    // Add fallback recovery strategy if exists
    if (path.fallback) {
      const fallbackId = sanitizeId(`${path.component}_fallback`);
      dot += `  ${fallbackId} [label="${path.fallback}", fillcolor="#FFB6C1"];\n`;
      dot += `  ${componentId} -> ${fallbackId} [label="Fallback"];\n`;
    }
  }
  
  dot += '}\n';
  return dot;
}

/**
 * Generate failure cascade DOT file
 * 
 * @param cascades Array of failure cascades
 * @returns DOT file content
 */
function generateFailureCascadeDot(cascades: FailureCascade[]): string {
  let dot = 'digraph FailureCascades {\n';
  dot += '  rankdir=TB;\n';
  dot += '  node [shape=box, style=filled, fontname="Arial"];\n';
  dot += '  edge [fontname="Arial"];\n\n';
  
  // Add legend
  dot += '  subgraph cluster_legend {\n';
  dot += '    label="Legend";\n';
  dot += '    style=filled;\n';
  dot += '    color=lightgrey;\n';
  dot += '    node [style=filled];\n';
  dot += '    Root_Failure [label="Root Failure", fillcolor="#FF6666"];\n';
  dot += '    Affected_Component [label="Affected Component", fillcolor="#FFCC66"];\n';
  dot += '    Resilient_Component [label="Resilient Component", fillcolor="#66CC66"];\n';
  dot += '  }\n\n';
  
  // Track all components
  const allComponents = new Set<string>();
  
  // Add cascades
  for (let i = 0; i < cascades.length; i++) {
    const cascade = cascades[i];
    const rootId = sanitizeId(cascade.root);
    
    // Add root component
    dot += `  ${rootId} [label="${cascade.root}", fillcolor="#FF6666"];\n`;
    allComponents.add(cascade.root);
    
    // Add affected components
    for (const effect of cascade.effects) {
      const effectId = sanitizeId(effect);
      dot += `  ${effectId} [label="${effect}", fillcolor="#FFCC66"];\n`;
      dot += `  ${rootId} -> ${effectId} [label="affects"];\n`;
      allComponents.add(effect);
    }
    
    // Add resilient components
    for (const resilient of cascade.resilientComponents) {
      const resilientId = sanitizeId(resilient);
      dot += `  ${resilientId} [label="${resilient}", fillcolor="#66CC66"];\n`;
      dot += `  ${rootId} -> ${resilientId} [label="no effect", style="dashed"];\n`;
      allComponents.add(resilient);
    }
    
    // Add cascade info
    dot += `  cascade_info_${i} [shape=note, label="Duration: ${cascade.duration}ms\\nTimestamp: ${new Date(cascade.timestamp).toLocaleString()}", fillcolor="#FFFFFF"];\n`;
    dot += `  ${rootId} -> cascade_info_${i} [style="dotted"];\n`;
  }
  
  dot += '}\n';
  return dot;
}

/**
 * Generate combined visualization DOT file
 * 
 * @param recoveryPaths Array of recovery paths
 * @param cascades Array of failure cascades
 * @returns DOT file content
 */
function generateCombinedVisualizationDot(
  recoveryPaths: RecoveryPath[],
  cascades: FailureCascade[]
): string {
  let dot = 'digraph SystemResilience {\n';
  dot += '  rankdir=TB;\n';
  dot += '  node [shape=box, style=filled, fontname="Arial"];\n';
  dot += '  edge [fontname="Arial"];\n\n';
  
  // Add legend
  dot += '  subgraph cluster_legend {\n';
  dot += '    label="Legend";\n';
  dot += '    style=filled;\n';
  dot += '    color=lightgrey;\n';
  dot += '    node [style=filled];\n';
  dot += '    Component [fillcolor="#A0D0FF"];\n';
  dot += '    Root_Failure [label="Root Failure", fillcolor="#FF6666"];\n';
  dot += '    Affected_Component [label="Affected Component", fillcolor="#FFCC66"];\n';
  dot += '    Resilient_Component [label="Resilient Component", fillcolor="#66CC66"];\n';
  dot += '    Recovery_Strategy [label="Recovery Strategy", fillcolor="#90EE90"];\n';
  dot += '  }\n\n';
  
  // Track all components
  const allComponents = new Set<string>();
  
  // Add components from recovery paths
  for (const path of recoveryPaths) {
    allComponents.add(path.component);
  }
  
  // Add components from cascades
  for (const cascade of cascades) {
    allComponents.add(cascade.root);
    for (const effect of cascade.effects) {
      allComponents.add(effect);
    }
    for (const resilient of cascade.resilientComponents) {
      allComponents.add(resilient);
    }
  }
  
  // Add all components
  for (const component of Array.from(allComponents)) {
    const componentId = sanitizeId(component);
    
    // Find recovery path for this component
    const recoveryPath = recoveryPaths.find(path => path.component === component);
    
    // Find cascade where this component is the root
    const cascade = cascades.find(cascade => cascade.root === component);
    
    // Determine color based on role
    let fillColor = '#A0D0FF'; // Default component color
    
    if (cascade) {
      fillColor = '#FF6666'; // Root failure
    } else if (cascades.some(c => c.effects.includes(component))) {
      fillColor = '#FFCC66'; // Affected component
    } else if (cascades.some(c => c.resilientComponents.includes(component))) {
      fillColor = '#66CC66'; // Resilient component
    }
    
    dot += `  ${componentId} [label="${component}", fillcolor="${fillColor}"];\n`;
    
    // Add recovery strategies if available
    if (recoveryPath) {
      const primaryId = sanitizeId(`${component}_primary`);
      dot += `  ${primaryId} [label="${recoveryPath.primary}", fillcolor="#90EE90", shape=ellipse];\n`;
      dot += `  ${componentId} -> ${primaryId} [label="recovers via"];\n`;
    }
  }
  
  // Add cascade relationships
  for (const cascade of cascades) {
    const rootId = sanitizeId(cascade.root);
    
    for (const effect of cascade.effects) {
      const effectId = sanitizeId(effect);
      dot += `  ${rootId} -> ${effectId} [label="affects", color="#FF0000"];\n`;
    }
  }
  
  dot += '}\n';
  return dot;
}

/**
 * Save DOT file
 * 
 * @param filePath Path to save DOT file
 * @param content DOT file content
 */
function saveDotFile(filePath: string, content: string): void {
  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`DOT file saved to: ${filePath}`);
  } catch (error) {
    console.error(`Error saving DOT file to ${filePath}:`, error);
  }
}

/**
 * Print GraphViz instructions
 */
function printGraphVizInstructions(): void {
  console.log('\n=== GraphViz Instructions ===');
  console.log('To generate SVG files from DOT files, run:');
  console.log(`  dot -Tsvg -o ${LOGS_DIR}/recovery-paths.svg ${RECOVERY_DOT_PATH}`);
  console.log(`  dot -Tsvg -o ${LOGS_DIR}/cascade-map.svg ${CASCADE_DOT_PATH}`);
  console.log('\nTo generate PNG files from DOT files, run:');
  console.log(`  dot -Tpng -o ${LOGS_DIR}/recovery-paths.png ${RECOVERY_DOT_PATH}`);
  console.log(`  dot -Tpng -o ${LOGS_DIR}/cascade-map.png ${CASCADE_DOT_PATH}`);
  console.log('\nTo view the DOT files interactively, you can use online tools like:');
  console.log('  - https://dreampuf.github.io/GraphvizOnline/');
  console.log('  - https://edotor.net/');
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('=== Generating Recovery Path Visualizations ===');
  
  try {
    // Load recovery paths
    const recoveryPaths = loadRecoveryPaths();
    console.log(`Loaded ${recoveryPaths.length} recovery paths`);
    
    // Load failure cascades
    const cascades = loadFailureCascades();
    console.log(`Loaded ${cascades.length} failure cascades`);
    
    // Generate recovery paths DOT file
    if (recoveryPaths.length > 0) {
      const recoveryPathsDot = generateRecoveryPathsDot(recoveryPaths);
      saveDotFile(RECOVERY_DOT_PATH, recoveryPathsDot);
    } else {
      console.warn('No recovery paths found, skipping recovery paths visualization');
    }
    
    // Generate failure cascade DOT file
    if (cascades.length > 0) {
      const cascadeDot = generateFailureCascadeDot(cascades);
      saveDotFile(CASCADE_DOT_PATH, cascadeDot);
      
      // Generate combined visualization
      const combinedDot = generateCombinedVisualizationDot(recoveryPaths, cascades);
      saveDotFile(path.join(LOGS_DIR, 'system-resilience.dot'), combinedDot);
    } else {
      console.warn('No failure cascades found, skipping cascade visualization');
    }
    
    // Print GraphViz instructions
    printGraphVizInstructions();
    
    console.log('\n✅ Visualization generation complete!');
  } catch (error) {
    console.error('Error generating visualizations:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error during visualization generation:', error);
  process.exit(1);
});