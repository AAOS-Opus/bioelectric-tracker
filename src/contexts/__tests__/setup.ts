// Import for jest-dom assertions
import '@testing-library/jest-dom'

// Set up globals for tests
global.jest = jest

// Mock session data that includes currentPhaseNumber (required by our auth system)
export const mockSession = {
  user: { 
    id: '123', 
    name: 'Test User', 
    email: 'test@example.com',
    currentPhaseNumber: 1 
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Expires in 1 day
}
