#!/usr/bin/env node

/**
 * Import Sorter
 * 
 * This script automatically sorts and groups import statements in TypeScript/JavaScript files
 * according to best practices. It places imports in the following order:
 * 
 * 1. React and Next.js imports
 * 2. External library imports (alphabetically sorted)
 * 3. Absolute imports from the project (using @/ path alias)
 * 4. Relative imports (sorted by path depth)
 * 5. CSS/SASS imports
 * 
 * Usage: node scripts/sort-imports.js [files...]
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// If specific files are provided as arguments, use those
// Otherwise, find all TypeScript and JavaScript files in src/
let filesToProcess = process.argv.slice(2);
if (filesToProcess.length === 0) {
  const SRC_DIR = path.resolve(__dirname, '../src');
  filesToProcess = glob.sync(`${SRC_DIR}/**/*.{ts,tsx,js,jsx}`, {
    ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**']
  });
}

// Counter for processed files
let filesProcessed = 0;
let filesModified = 0;

// Regular expression to match import statements
const importRegex = /^import(?:["'\s]*([\w*{}\n\r\t, ]+)from\s*)?["'\s]*([^"']+)["'\s]*;?$/gm;

filesToProcess.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  filesProcessed++;
  
  // Extract all imports
  const imports = [];
  let match;
  const importStartRegex = /import\s+/g;
  let firstImportIndex = -1;
  
  while ((match = importStartRegex.exec(content)) !== null) {
    if (firstImportIndex === -1) {
      firstImportIndex = match.index;
    }
  }
  
  // Reset importRegex
  importRegex.lastIndex = 0;
  
  while ((match = importRegex.exec(content)) !== null) {
    const [fullImport, imported, source] = match;
    if (source) {
      imports.push({
        fullImport,
        imported: imported ? imported.trim() : '',
        source: source.trim(),
        index: match.index
      });
    }
  }
  
  if (imports.length === 0) {
    return; // No imports to sort
  }
  
  // Find all import statements as a block
  const importEnd = Math.max(...imports.map(imp => imp.index + imp.fullImport.length));
  const importsBlock = content.substring(firstImportIndex, importEnd);
  
  // Sort imports into categories
  const reactImports = [];
  const nextImports = [];
  const externalImports = [];
  const absoluteImports = [];
  const relativeImports = [];
  const styleImports = [];
  
  imports.forEach(({ fullImport, source }) => {
    // React imports
    if (source === 'react' || source.startsWith('react/') || source.startsWith('react-dom')) {
      reactImports.push(fullImport);
    }
    // Next.js imports
    else if (source === 'next' || source.startsWith('next/')) {
      nextImports.push(fullImport);
    }
    // Style imports
    else if (/\.(css|scss|sass|less|styl)$/.test(source)) {
      styleImports.push(fullImport);
    }
    // Absolute imports (@/*)
    else if (source.startsWith('@/')) {
      absoluteImports.push(fullImport);
    }
    // Relative imports (./ or ../)
    else if (source.startsWith('.')) {
      relativeImports.push(fullImport);
    }
    // External library imports
    else {
      externalImports.push(fullImport);
    }
  });
  
  // Sort each category
  reactImports.sort();
  nextImports.sort();
  externalImports.sort();
  absoluteImports.sort();
  
  // Sort relative imports by path depth (closer paths first)
  relativeImports.sort((a, b) => {
    const depthA = (a.match(/\.\.\//g) || []).length;
    const depthB = (b.match(/\.\.\//g) || []).length;
    return depthA - depthB || a.localeCompare(b);
  });
  
  styleImports.sort();
  
  // Build new imports block with appropriate spacing
  const newImportsBlock = [
    ...reactImports,
    reactImports.length > 0 && (nextImports.length > 0 || externalImports.length > 0) ? '' : '',
    ...nextImports,
    nextImports.length > 0 && externalImports.length > 0 ? '' : '',
    ...externalImports,
    externalImports.length > 0 && absoluteImports.length > 0 ? '' : '',
    ...absoluteImports,
    absoluteImports.length > 0 && relativeImports.length > 0 ? '' : '',
    ...relativeImports,
    relativeImports.length > 0 && styleImports.length > 0 ? '' : '',
    ...styleImports
  ].filter(Boolean).join('\n');
  
  // Replace the original imports block with the sorted one
  if (importsBlock !== newImportsBlock) {
    const newContent = content.substring(0, firstImportIndex) + newImportsBlock + content.substring(importEnd);
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesModified++;
    console.log(`✅ Sorted imports in: ${path.basename(filePath)}`);
  }
});

console.log(`\nProcessed ${filesProcessed} files, modified ${filesModified} files`);
console.log('Import sorting complete!');
