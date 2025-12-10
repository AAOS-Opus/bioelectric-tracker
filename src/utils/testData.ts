// Test data for edge cases
export const edgeCaseStrings = {
  // Very long strings
  longString: 'a'.repeat(10000),
  longWithEmoji: '🚀'.repeat(1000),
  
  // Special characters and potential XSS
  scriptTag: '<script>alert("xss")</script>',
  sqlInjection: "'; DROP TABLE users; --",
  htmlTags: '<div onclick="alert(1)">click me</div>',
  
  // Unicode edge cases
  rtlText: 'Hello مرحبا שָׁלוֹם',
  zeroWidth: 'Hidden\u200bZero\u200bWidth\u200bSpaces',
  combiningChars: 'n\u0303\u0303\u0303', // Multiple combining tildes
  
  // Whitespace cases
  multipleLines: 'Line 1\n\n\nLine 4\n\n\nLine 7',
  tabsAndSpaces: '\t   \t   spaces   \t   \t',
  zeroWidthSpaces: '\u200b\u200b\u200b',
  
  // Empty and boundary cases
  empty: '',
  singleChar: 'x',
  singleSpace: ' ',
  nullChar: '\0',
  
  // Numbers and dates
  extremeNumbers: [
    Number.MAX_SAFE_INTEGER.toString(),
    Number.MIN_SAFE_INTEGER.toString(),
    '1e+308',
    '-1e+308',
    '0.0000000000000001',
    '-0.0000000000000001'
  ],
  extremeDates: [
    '1800-01-01',
    '2100-12-31',
    '2024-02-29', // Leap year
    '2100-02-29', // Not a leap year
    '2024-03-10T02:00:00', // DST transition
    '0000-01-01',
    '9999-12-31'
  ]
};

// Test data for network conditions
export const networkConditions = {
  offline: { online: false, latency: 0 },
  slow2G: { online: true, latency: 2000 },
  regular3G: { online: true, latency: 500 },
  fast4G: { online: true, latency: 50 },
  flaky: { online: true, latency: [100, 500, 1000, 2000] }
};

// Test data for viewport sizes
export const viewportSizes = {
  smartwatch: { width: 280, height: 280 },
  mobileSmall: { width: 320, height: 568 },
  mobileMedium: { width: 375, height: 667 },
  mobileLarge: { width: 414, height: 896 },
  tablet: { width: 768, height: 1024 },
  laptop: { width: 1366, height: 768 },
  desktop: { width: 1920, height: 1080 },
  ultrawide: { width: 3440, height: 1440 }
};

// Test data for input validation
export const validationCases = {
  email: [
    'test@example.com', // Valid
    'test.name+filter@sub.example.co.uk', // Valid complex
    'not-an-email', // Invalid format
    'a'.repeat(256) + '@example.com', // Too long local part
    '@example.com', // Missing local part
    'test@', // Missing domain
    'test@example', // Missing TLD
    'test@.com', // Missing domain part
    'test..test@example.com', // Double dots
    'test@example..com', // Double dots in domain
    'test@[123.123.123.123]', // IP address format
    'test@localhost', // Local domain
    'test@example.photography' // Long TLD
  ],
  dates: [
    '2024-03-24', // Valid
    '2024-02-29', // Valid leap year
    '2023-02-29', // Invalid - not a leap year
    '2024-13-01', // Invalid month
    '2024-00-01', // Invalid month
    '2024-01-32', // Invalid day
    '2024-01-00', // Invalid day
    '10000-01-01', // Year out of range
    '-0001-01-01', // Negative year
    '2024-3-1', // Missing leading zeros
    '24-03-24', // Two digit year
    '2024/03/24', // Wrong separator
    '2024-03-24T00:00:00Z' // ISO format with time
  ]
};

// Helper function to sanitize strings for display
export function sanitizeForDisplay(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\u200b/g, '␀') // Make zero-width spaces visible
    .replace(/\n/g, '↵\n'); // Make newlines visible
}
