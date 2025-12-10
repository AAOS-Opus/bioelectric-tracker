/**
 * @chaos:basic
 * @resource-profile { "memory": "256MB", "time": "5s" }
 * @targets ["UX", "API"]
 */
describe('Basic Chaos Test', () => {
  test('Simple test', () => {
    console.log('Running simple chaos test');
    expect(true).toBe(true);
  });
});