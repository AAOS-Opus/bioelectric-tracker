const http = require('http');

console.log('🔐 Security Verification Script\n');
console.log('Testing security headers and configurations...\n');

const LOCALHOST_URL = 'http://localhost:3000';

async function checkSecurityHeaders() {
  return new Promise((resolve, reject) => {
    http.get(LOCALHOST_URL, (res) => {
      const headers = res.headers;

      console.log('📋 Response Headers:');
      console.log('─'.repeat(50));

      const securityHeaders = {
        'x-frame-options': { expected: 'DENY', critical: true },
        'x-content-type-options': { expected: 'nosniff', critical: true },
        'referrer-policy': { expected: 'strict-origin-when-cross-origin', critical: false },
        'x-xss-protection': { expected: '1; mode=block', critical: false },
        'strict-transport-security': { expected: /max-age/, critical: true },
        'permissions-policy': { expected: /camera/, critical: false },
        'content-security-policy': { expected: /default-src/, critical: true },
        'x-api-version': { expected: /.+/, critical: false },
      };

      const results = {
        passed: 0,
        failed: 0,
        warnings: 0,
      };

      Object.entries(securityHeaders).forEach(([header, config]) => {
        const value = headers[header];
        const expectedValue = config.expected;

        if (!value) {
          if (config.critical) {
            console.log(`❌ ${header}: MISSING (CRITICAL)`);
            results.failed++;
          } else {
            console.log(`⚠️  ${header}: MISSING`);
            results.warnings++;
          }
        } else {
          const matches = expectedValue instanceof RegExp
            ? expectedValue.test(value)
            : value.toLowerCase() === expectedValue.toLowerCase();

          if (matches) {
            console.log(`✅ ${header}: ${value}`);
            results.passed++;
          } else {
            console.log(`❌ ${header}: ${value} (expected: ${expectedValue})`);
            results.failed++;
          }
        }
      });

      // Check that X-Powered-By is removed
      if (headers['x-powered-by']) {
        console.log(`❌ x-powered-by: ${headers['x-powered-by']} (should be removed)`);
        results.failed++;
      } else {
        console.log('✅ x-powered-by: REMOVED');
        results.passed++;
      }

      console.log('\n' + '─'.repeat(50));
      console.log('📊 Security Headers Summary:');
      console.log(`   ✅ Passed: ${results.passed}`);
      console.log(`   ❌ Failed: ${results.failed}`);
      console.log(`   ⚠️  Warnings: ${results.warnings}`);

      if (results.failed > 0) {
        console.log('\n❌ Security check FAILED');
        console.log('   Fix the failed headers before deploying to production\n');
        resolve(false);
      } else {
        console.log('\n✅ Security check PASSED');
        console.log('   All critical security headers are configured correctly\n');
        resolve(true);
      }
    }).on('error', (err) => {
      console.error('\n❌ Failed to connect to server');
      console.error('   Make sure the development server is running:');
      console.error('   npm run dev\n');
      reject(err);
    });
  });
}

async function checkHealthEndpoint() {
  return new Promise((resolve, reject) => {
    http.get(`${LOCALHOST_URL}/api/health`, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('🏥 Health Check Endpoint:');
        console.log('─'.repeat(50));

        try {
          const healthData = JSON.parse(data);

          if (res.statusCode === 200 || res.statusCode === 503) {
            console.log(`✅ Status: ${res.statusCode}`);
            console.log(`✅ Environment: ${healthData.environment || 'unknown'}`);
            console.log(`✅ Uptime: ${Math.floor((healthData.uptime || 0) / 60)} minutes`);

            if (healthData.mongoStatus) {
              console.log(`✅ Database: ${healthData.mongoStatus}`);
            }

            if (healthData.version) {
              console.log(`✅ Version: ${healthData.version}`);
            }

            if (healthData.memory) {
              console.log(`✅ Memory: ${healthData.memory.heapUsed} used of ${healthData.memory.heapTotal}`);
            }

            console.log('\n✅ Health endpoint is working correctly\n');
            resolve(true);
          } else {
            console.log(`❌ Unexpected status code: ${res.statusCode}`);
            resolve(false);
          }
        } catch (err) {
          console.log(`❌ Invalid JSON response: ${err.message}`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.error(`❌ Health endpoint error: ${err.message}\n`);
      reject(err);
    });
  });
}

async function checkEnvironment() {
  console.log('🌍 Environment Configuration:');
  console.log('─'.repeat(50));

  const testMode = process.env.NEXT_PUBLIC_TEST_MODE;
  const nodeEnv = process.env.NODE_ENV || 'development';

  console.log(`Environment: ${nodeEnv}`);
  console.log(`TEST_MODE: ${testMode || 'not set'}`);

  if (nodeEnv === 'production' && testMode === 'true') {
    console.log('❌ TEST_MODE is enabled in production!');
    console.log('   This is a critical security issue\n');
    return false;
  } else {
    console.log('✅ Environment configuration is correct\n');
    return true;
  }
}

async function runAllChecks() {
  try {
    console.log('Starting security verification...\n');

    const envCheck = await checkEnvironment();
    const securityCheck = await checkSecurityHeaders();
    const healthCheck = await checkHealthEndpoint();

    console.log('═'.repeat(50));
    console.log('FINAL RESULTS:');
    console.log('═'.repeat(50));

    if (envCheck && securityCheck && healthCheck) {
      console.log('✅ ALL SECURITY CHECKS PASSED');
      console.log('   Your application is ready for deployment\n');
      process.exit(0);
    } else {
      console.log('❌ SECURITY CHECKS FAILED');
      console.log('   Fix the issues above before deploying\n');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Security verification failed:', err.message);
    process.exit(1);
  }
}

// Run checks
runAllChecks();