#!/usr/bin/env node

/**
 * TypeSafe Check Utility
 * 
 * This script helps identify and document type safety issues:
 * - Usage of "any" type
 * - Missing return types on functions
 * - Implicit any in function parameters
 * - Type-assertion safety issues
 * 
 * Usage: node scripts/typesafe-check.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { execSync } = require('child_process');

// Configuration
const SRC_DIR = path.resolve(__dirname, '../src');
const IGNORE_PATTERNS = ['**/node_modules/**', '**/.next/**', '**/dist/**'];
const REPORT_OUTPUT = path.resolve(__dirname, '../type-safety-report.md');

// Stats to track
const stats = {
  totalFiles: 0,
  filesWithAny: 0,
  anyOccurrences: 0,
  missingReturnTypes: 0,
  implicitAnyParams: 0,
  typeAssertions: 0,
  ignoredTypeErrors: 0,
};

// Issue tracking
const issues = {
  anyUsages: [],
  missingReturns: [],
  implicitParams: [],
  typeAssertions: [],
  ignoredErrors: [],
};

console.log('🔍 Scanning for type safety issues...');

// Find all TypeScript files
const files = glob.sync(`${SRC_DIR}/**/*.{ts,tsx}`, { ignore: IGNORE_PATTERNS });
stats.totalFiles = files.length;

// Regular expressions for finding issues
const anyTypeRegex = /: any(?!\w)/g;
const functionRegex = /function\s+\w+\s*\([^)]*\)\s*(?!:)/g;
const arrowFunctionRegex = /const\s+\w+\s*=\s*(\([^)]*\)|[^=>(]*)\s*=>\s*(?!:)/g;
const explicitAnyRegex = /\s*:\s*any\s*/g;
const typeAssertionRegex = /\s+as\s+[^;,)]+/g;
const tsIgnoreRegex = /\/\/\s*@ts-ignore/g;
const tsNoCheckRegex = /\/\/\s*@ts-nocheck/g;

// Process each file
files.forEach(file => {
  const relativePath = path.relative(SRC_DIR, file);
  const content = fs.readFileSync(file, 'utf8');
  let fileHasAny = false;
  
  // Check for "any" type usage
  const anyMatches = content.match(anyTypeRegex) || [];
  if (anyMatches.length > 0) {
    fileHasAny = true;
    stats.anyOccurrences += anyMatches.length;
    
    // Find line numbers for "any" usages
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.match(anyTypeRegex)) {
        issues.anyUsages.push({
          file: relativePath,
          line: i + 1,
          content: line.trim(),
        });
      }
    });
  }
  
  // Check for missing return types in functions
  const functionMatches = content.match(functionRegex) || [];
  const arrowFunctionMatches = content.match(arrowFunctionRegex) || [];
  stats.missingReturnTypes += functionMatches.length + arrowFunctionMatches.length;
  
  // Find line numbers for functions without return types
  if (functionMatches.length > 0 || arrowFunctionMatches.length > 0) {
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.match(functionRegex) || line.match(arrowFunctionRegex)) {
        // Check if this is an export default, which might be acceptable
        if (!line.includes('export default')) {
          issues.missingReturns.push({
            file: relativePath,
            line: i + 1,
            content: line.trim(),
          });
        }
      }
    });
  }
  
  // Check for type assertions
  const typeAssertionMatches = content.match(typeAssertionRegex) || [];
  stats.typeAssertions += typeAssertionMatches.length;
  
  // Find line numbers for type assertions
  if (typeAssertionMatches.length > 0) {
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.match(typeAssertionRegex)) {
        issues.typeAssertions.push({
          file: relativePath,
          line: i + 1,
          content: line.trim(),
        });
      }
    });
  }
  
  // Check for ignored type errors
  const tsIgnoreMatches = content.match(tsIgnoreRegex) || [];
  const tsNoCheckMatches = content.match(tsNoCheckRegex) || [];
  stats.ignoredTypeErrors += tsIgnoreMatches.length + tsNoCheckMatches.length;
  
  // Find line numbers for ignored errors
  if (tsIgnoreMatches.length > 0 || tsNoCheckMatches.length > 0) {
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.match(tsIgnoreRegex) || line.match(tsNoCheckRegex)) {
        issues.ignoredErrors.push({
          file: relativePath,
          line: i + 1,
          content: line.trim(),
          nextLine: lines[i + 1]?.trim() || '',
        });
      }
    });
  }
  
  if (fileHasAny) {
    stats.filesWithAny++;
  }
});

// Generate report
let report = `# TypeScript Safety Analysis Report\n\n`;
report += `Generated on: ${new Date().toLocaleString()}\n\n`;

report += `## Summary\n\n`;
report += `- Total TypeScript files: ${stats.totalFiles}\n`;
report += `- Files with \`any\` type: ${stats.filesWithAny} (${Math.round(stats.filesWithAny / stats.totalFiles * 100)}%)\n`;
report += `- Total \`any\` occurrences: ${stats.anyOccurrences}\n`;
report += `- Functions missing return types: ${stats.missingReturnTypes}\n`;
report += `- Type assertions (\`as Type\`): ${stats.typeAssertions}\n`;
report += `- Ignored type errors (@ts-ignore/@ts-nocheck): ${stats.ignoredTypeErrors}\n\n`;

report += `## Files with \`any\` Type\n\n`;
if (issues.anyUsages.length > 0) {
  report += `| File | Line | Code |\n`;
  report += `| ---- | ---- | ---- |\n`;
  
  issues.anyUsages.forEach(issue => {
    report += `| ${issue.file} | ${issue.line} | \`${issue.content.replace(/\|/g, '\\|')}\` |\n`;
  });
} else {
  report += `No \`any\` types found! 🎉\n`;
}

report += `\n## Functions Missing Return Types\n\n`;
if (issues.missingReturns.length > 0) {
  report += `| File | Line | Code |\n`;
  report += `| ---- | ---- | ---- |\n`;
  
  issues.missingReturns.slice(0, 20).forEach(issue => {
    report += `| ${issue.file} | ${issue.line} | \`${issue.content.replace(/\|/g, '\\|')}\` |\n`;
  });
  
  if (issues.missingReturns.length > 20) {
    report += `\n... and ${issues.missingReturns.length - 20} more instances.\n`;
  }
} else {
  report += `No functions missing return types! 🎉\n`;
}

report += `\n## Type Assertions\n\n`;
if (issues.typeAssertions.length > 0) {
  report += `| File | Line | Code |\n`;
  report += `| ---- | ---- | ---- |\n`;
  
  issues.typeAssertions.slice(0, 20).forEach(issue => {
    report += `| ${issue.file} | ${issue.line} | \`${issue.content.replace(/\|/g, '\\|')}\` |\n`;
  });
  
  if (issues.typeAssertions.length > 20) {
    report += `\n... and ${issues.typeAssertions.length - 20} more instances.\n`;
  }
} else {
  report += `No type assertions found!\n`;
}

report += `\n## Ignored Type Errors\n\n`;
if (issues.ignoredErrors.length > 0) {
  report += `| File | Line | Comment | Next Line |\n`;
  report += `| ---- | ---- | ------- | --------- |\n`;
  
  issues.ignoredErrors.forEach(issue => {
    report += `| ${issue.file} | ${issue.line} | \`${issue.content.replace(/\|/g, '\\|')}\` | \`${issue.nextLine.replace(/\|/g, '\\|')}\` |\n`;
  });
} else {
  report += `No ignored type errors found! 🎉\n`;
}

report += `\n## Recommendations\n\n`;
report += `1. Replace \`any\` types with more specific types whenever possible\n`;
report += `2. Add explicit return types to all functions\n`;
report += `3. Use type guards instead of type assertions\n`;
report += `4. Address ignored type errors with proper typing\n`;
report += `5. Follow the TypeScript best practices:\n`;
report += `   - Enable strict mode in tsconfig.json\n`;
report += `   - Use interfaces for object types\n`;
report += `   - Use Record<K, V> for dictionaries\n`;
report += `   - Use Partial<T> for optional updates\n`;
report += `   - Use Pick<T, K> and Omit<T, K> for type transformations\n`;

// Write report to file
fs.writeFileSync(REPORT_OUTPUT, report);

console.log(`✅ Type safety analysis complete!`);
console.log(`Report saved to: ${REPORT_OUTPUT}`);
console.log(`Files with 'any' type: ${stats.filesWithAny}/${stats.totalFiles} (${Math.round(stats.filesWithAny / stats.totalFiles * 100)}%)`);
console.log(`Total 'any' occurrences: ${stats.anyOccurrences}`);
console.log(`Ignored type errors: ${stats.ignoredTypeErrors}`);
