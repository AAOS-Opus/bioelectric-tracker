/**
 * Update Architecture Documentation
 * 
 * This script automatically updates architecture documentation based on
 * chaos testing results, including recovery paths and failure cascades.
 */

import * as fs from 'fs';
import * as path from 'path';

// Define paths
const ROOT_DIR = path.resolve(__dirname, '../../../../');
const LOGS_DIR = path.join(ROOT_DIR, 'logs/chaos');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const RECOVERY_PATHS_PATH = path.join(DOCS_DIR, 'recovery-paths.json');
const CASCADE_MAP_PATH = path.join(LOGS_DIR, 'cascade-map.json');
const COMPONENT_RESILIENCE_PATH = path.join(DOCS_DIR, 'component-resilience.md');

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

interface ComponentCascades {
  triggers: string[];
  affects: string[];
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
 * Get unique components from recovery paths
 * 
 * @param recoveryPaths Array of recovery paths
 * @returns Array of unique component names
 */
function getUniqueComponents(recoveryPaths: RecoveryPath[]): string[] {
  const components = new Set<string>();
  
  for (const path of recoveryPaths) {
    components.add(path.component);
  }
  
  return Array.from(components);
}

/**
 * Get cascade information for a component
 * 
 * @param component Component name
 * @param cascades Array of failure cascades
 * @returns Component cascade information
 */
function getCascadesForComponent(
  component: string,
  cascades: FailureCascade[]
): ComponentCascades {
  const result: ComponentCascades = {
    triggers: [],
    affects: []
  };
  
  for (const cascade of cascades) {
    // Check if this component is affected by other components
    if (cascade.effects.includes(component)) {
      result.triggers.push(cascade.root);
    }
    
    // Check if this component affects other components
    if (cascade.root === component) {
      result.affects.push(...cascade.effects);
    }
  }
  
  // Remove duplicates
  result.triggers = Array.from(new Set(result.triggers));
  result.affects = Array.from(new Set(result.affects));
  
  return result;
}

/**
 * Update architecture documentation
 */
export function updateArchitectureDocumentation(): void {
  console.log('Updating architecture documentation...');
  
  try {
    // Load recovery paths and failure cascades
    const recoveryPaths = loadRecoveryPaths();
    const failureCascades = loadFailureCascades();
    
    // Generate component resilience markdown
    let componentDocs = '# Component Resilience Documentation\n\n';
    componentDocs += '> Automatically generated from chaos testing results\n\n';
    
    // Generate component-by-component documentation
    for (const component of getUniqueComponents(recoveryPaths)) {
      componentDocs += `## ${component}\n\n`;
      
      // Add recovery paths
      const paths = recoveryPaths.filter(p => p.component === component);
      if (paths.length > 0) {
        componentDocs += '### Recovery Strategies\n\n';
        for (const path of paths) {
          componentDocs += `- **Primary**: ${path.primary}\n`;
          if (path.secondary) componentDocs += `- **Secondary**: ${path.secondary}\n`;
          if (path.fallback) componentDocs += `- **Fallback**: ${path.fallback}\n`;
          componentDocs += `- **Expected Recovery Time**: ${path.recoveryTime}ms\n`;
        }
        componentDocs += '\n';
      }
      
      // Add cascade information
      const cascades = getCascadesForComponent(component, failureCascades);
      if (cascades.triggers.length > 0) {
        componentDocs += '### Failure Triggers\n\n';
        componentDocs += 'This component may fail when these components fail:\n\n';
        for (const trigger of cascades.triggers) {
          componentDocs += `- ${trigger}\n`;
        }
        componentDocs += '\n';
      }
      
      if (cascades.affects.length > 0) {
        componentDocs += '### Cascade Effects\n\n';
        componentDocs += 'When this component fails, these components may be affected:\n\n';
        for (const affected of cascades.affects) {
          componentDocs += `- ${affected}\n`;
        }
        componentDocs += '\n';
      }
    }
    
    // Add system-wide resilience information
    componentDocs += '## System-Wide Resilience\n\n';
    
    // Count total recovery paths
    componentDocs += `### Recovery Paths: ${recoveryPaths.length}\n\n`;
    
    // Count components with fallbacks
    const componentsWithFallbacks = recoveryPaths.filter(p => p.fallback).length;
    componentDocs += `### Components with Fallbacks: ${componentsWithFallbacks}\n\n`;
    
    // Count cascade relationships
    let totalCascadeEffects = 0;
    for (const cascade of failureCascades) {
      totalCascadeEffects += cascade.effects.length;
    }
    
    componentDocs += `### Cascade Relationships: ${totalCascadeEffects}\n\n`;
    
    // Create docs directory if it doesn't exist
    if (!fs.existsSync(DOCS_DIR)) {
      fs.mkdirSync(DOCS_DIR, { recursive: true });
    }
    
    // Write to architecture documentation
    fs.writeFileSync(COMPONENT_RESILIENCE_PATH, componentDocs, 'utf8');
    
    console.log(`✅ Updated architecture documentation with resilience data: ${COMPONENT_RESILIENCE_PATH}`);
  } catch (error) {
    console.error('Error updating architecture documentation:', error);
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('=== Updating Architecture Documentation ===');
  
  try {
    updateArchitectureDocumentation();
    console.log('\n✅ Architecture documentation update complete!');
  } catch (error) {
    console.error('Error updating architecture documentation:', error);
    process.exit(1);
  }
}

// Run the main function if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error during architecture documentation update:', error);
    process.exit(1);
  });
}