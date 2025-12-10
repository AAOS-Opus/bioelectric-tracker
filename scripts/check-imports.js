#!/usr/bin/env node

/**
 * Import Path Checker
 * 
 * This script analyzes import statements across the codebase to identify:
 * - Excessive relative path nesting (../../)
 * - Inconsistent import patterns
 * - Missing path aliases
 * - Potential circular dependencies
 * 
 * Usage: node scripts/check-imports.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const SRC_DIR = path.resolve(__dirname, '../src');
const IGNORE_PATTERNS = ['**/node_modules/**', '**/.next/**', '**/dist/**'];
const MAX_RELATIVE_DEPTH = 2; // Maximum number of ../ considered acceptable

// Track import patterns for analysis
const importStats = {
  totalFiles: 0,
  filesWithImports: 0,
  totalImports: 0,
  relativeImports: 0,
  deepRelativeImports: 0, // imports with more than MAX_RELATIVE_DEPTH levels
  aliasImports: 0,
  potentialCircularDependencies: [],
  inconsistentPatterns: [],
};

// Map to track import relationships for circular dependency detection
const importGraph = new Map();

// Find all TypeScript and JavaScript files
const files = glob.sync(`${SRC_DIR}/**/*.{ts,tsx,js,jsx}`, { ignore: IGNORE_PATTERNS });
importStats.totalFiles = files.length;

// Regular expressions for import detection
const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+[^,;]+|[^,;{]*)\s+from\s+['"]([^'"]+)['"]/g;
const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;

files.forEach(file => {
  const relativePath = path.relative(SRC_DIR, file);
  const content = fs.readFileSync(file, 'utf8');
  
  // Extract all imports
  const imports = [];
  let match;
  
  // Static imports
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // Dynamic imports
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  if (imports.length > 0) {
    importStats.filesWithImports++;
    importStats.totalImports += imports.length;
    
    // Track file's imports for circular dependency detection
    importGraph.set(relativePath, []);
    
    imports.forEach(importPath => {
      if (importPath.startsWith('@/')) {
        importStats.aliasImports++;
      } else if (importPath.startsWith('.')) {
        importStats.relativeImports++;
        
        // Count relative depth
        const depth = (importPath.match(/\.\.\//g) || []).length;
        if (depth > MAX_RELATIVE_DEPTH) {
          importStats.deepRelativeImports++;
          console.log(`Deep relative import (${depth} levels): ${relativePath} -> ${importPath}`);
        }
        
        // Resolve the absolute path of the import to check for circular dependencies
        let resolvedImport = path.resolve(path.dirname(file), importPath);
        
        // Handle directory imports that might resolve to index files
        if (!resolvedImport.match(/\.(js|jsx|ts|tsx)$/)) {
          const potentialExtensions = ['.ts', '.tsx', '.js', '.jsx'];
          for (const ext of potentialExtensions) {
            if (fs.existsSync(`${resolvedImport}${ext}`)) {
              resolvedImport = `${resolvedImport}${ext}`;
              break;
            } else if (fs.existsSync(`${resolvedImport}/index${ext}`)) {
              resolvedImport = `${resolvedImport}/index${ext}`;
              break;
            }
          }
        }
        
        // Convert back to relative path for consistent tracking
        const importRelativePath = path.relative(SRC_DIR, resolvedImport);
        importGraph.get(relativePath).push(importRelativePath);
      }
    });
  }
});

// Detect circular dependencies using DFS
function detectCircularDependencies() {
  const visited = new Set();
  const recursionStack = new Set();
  
  function dfs(node, path = []) {
    if (recursionStack.has(node)) {
      // Found a cycle
      const cycle = [...path.slice(path.indexOf(node)), node];
      importStats.potentialCircularDependencies.push(cycle);
      return;
    }
    
    if (visited.has(node) || !importGraph.has(node)) {
      return;
    }
    
    visited.add(node);
    recursionStack.add(node);
    path.push(node);
    
    const neighbors = importGraph.get(node) || [];
    for (const neighbor of neighbors) {
      dfs(neighbor, [...path]);
    }
    
    recursionStack.delete(node);
  }
  
  for (const node of importGraph.keys()) {
    dfs(node);
  }
}

detectCircularDependencies();

// Print results
console.log('\n========== IMPORT ANALYSIS REPORT ==========');
console.log(`Total Files: ${importStats.totalFiles}`);
console.log(`Files with imports: ${importStats.filesWithImports}`);
console.log(`Total imports: ${importStats.totalImports}`);
console.log(`Alias imports (@/): ${importStats.aliasImports} (${(importStats.aliasImports / importStats.totalImports * 100).toFixed(2)}%)`);
console.log(`Relative imports (./): ${importStats.relativeImports} (${(importStats.relativeImports / importStats.totalImports * 100).toFixed(2)}%)`);
console.log(`Deep relative imports (>${MAX_RELATIVE_DEPTH} levels): ${importStats.deepRelativeImports}`);

console.log('\n---------- POTENTIAL CIRCULAR DEPENDENCIES ----------');
if (importStats.potentialCircularDependencies.length === 0) {
  console.log('No circular dependencies detected.');
} else {
  importStats.potentialCircularDependencies.forEach((cycle, index) => {
    console.log(`Cycle #${index + 1}: ${cycle.join(' -> ')} -> ${cycle[0]}`);
  });
}

console.log('\n---------- RECOMMENDATIONS ----------');
console.log('1. Replace deep relative imports (../../) with path aliases (@/)');
console.log('2. Break circular dependencies by moving shared code to utility modules');
console.log('3. Create index.ts barrel files for cleaner imports from large directories');
console.log('\nAnalysis completed successfully!');
