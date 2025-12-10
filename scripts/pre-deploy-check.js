const fs = require('fs');
const path = require('path');

console.log('🔍 Running Pre-Deployment Checks...\n');

let hasErrors = false;

// 1. Ensure NODE_ENV is production
if (process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  Not in production mode. Skipping production checks.');
  process.exit(0);
}

console.log('✓ NODE_ENV is set to production');

// 2. Prevent accidental TEST_MODE in production
if (process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
  console.error('❌ TEST_MODE is enabled in production!');
  console.error('   Set NEXT_PUBLIC_TEST_MODE=false in .env.production.local');
  hasErrors = true;
} else {
  console.log('✓ TEST_MODE is disabled');
}

// 3. Check for required environment variables
const requiredEnvVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    hasErrors = true;
  } else {
    console.log(`✓ ${envVar} is set`);
  }
});

// 4. Check for console.log in production code
const filesWithConsoleLogs = [];
const excludeDirs = ['node_modules', '.next', '__tests__', 'scripts', 'dist'];

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Look for console.log, console.debug, console.info (but allow console.error and console.warn)
    const consoleRegex = /console\.(log|debug|info)\(/g;

    if (consoleRegex.test(content)) {
      filesWithConsoleLogs.push(filePath);
    }
  } catch (err) {
    // Skip files that can't be read
  }
}

function walk(dir) {
  try {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const fullPath = path.join(dir, file);

      // Skip excluded directories
      if (excludeDirs.some(excluded => fullPath.includes(excluded))) {
        return;
      }

      try {
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
          scanFile(fullPath);
        }
      } catch (err) {
        // Skip files that can't be accessed
      }
    });
  } catch (err) {
    // Skip directories that can't be read
  }
}

console.log('\n🔎 Scanning for console.log statements...');

// Scan main directories
['components', 'src', 'pages', 'app', 'lib', 'hooks'].forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    walk(dirPath);
  }
});

if (filesWithConsoleLogs.length > 0) {
  console.warn('\n⚠️  Found console.log/debug/info statements in:');
  filesWithConsoleLogs.slice(0, 10).forEach(f => {
    console.warn(`   - ${f.replace(process.cwd(), '.')}`);
  });

  if (filesWithConsoleLogs.length > 10) {
    console.warn(`   ... and ${filesWithConsoleLogs.length - 10} more files`);
  }

  console.warn('\n   Note: These will be automatically removed in production build');
  console.warn('   (configured via compiler.removeConsole in next.config.js)\n');
} else {
  console.log('✓ No console.log statements found');
}

// 5. Check for .env.production.local file
const prodEnvPath = path.join(process.cwd(), '.env.production.local');
if (!fs.existsSync(prodEnvPath)) {
  console.error('\n❌ Missing .env.production.local file');
  console.error('   Create this file with production environment variables');
  hasErrors = true;
} else {
  console.log('✓ .env.production.local exists');
}

// 6. Check that sensitive files are in .gitignore
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');

  const requiredIgnores = ['.env*.local', '.env.production.local'];
  const missingIgnores = requiredIgnores.filter(pattern => !gitignoreContent.includes(pattern));

  if (missingIgnores.length > 0) {
    console.error('\n❌ .gitignore missing patterns:');
    missingIgnores.forEach(pattern => console.error(`   - ${pattern}`));
    hasErrors = true;
  } else {
    console.log('✓ .gitignore configured correctly');
  }
} else {
  console.error('\n❌ .gitignore file not found');
  hasErrors = true;
}

// Final result
console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.error('❌ Pre-deployment checks FAILED');
  console.error('   Fix the errors above before deploying to production\n');
  process.exit(1);
} else {
  console.log('✅ All pre-deployment checks PASSED');
  console.log('   Safe to deploy to production\n');
  process.exit(0);
}