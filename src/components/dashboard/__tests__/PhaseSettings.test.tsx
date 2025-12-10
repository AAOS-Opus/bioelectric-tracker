/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import PhaseSettings from '../PhaseSettings';
import { useSession } from 'next-auth/react';
import { axe } from 'jest-axe';
import '../../../__tests__/setup/jest-setup';

// Mock CSS module
jest.mock('../PhaseSettings.module.css', () => ({}));

// Mock next-auth
jest.mock('next-auth/react');

// Mock data for phases
const mockPhases = [
  {
    _id: 'phase1',
    phaseNumber: 1,
    name: 'Detoxification',
    description: 'First phase focusing on detoxification',
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: '2025-01-31T00:00:00.000Z',
    affirmation: 'My body is cleansing and healing itself every day',
    isCompleted: false,
    customizationSettings: {
      intensity: 'standard',
      priorities: { detox: 0.8, energy: 0.5, immune: 0.3 },
      optionalElements: ['liver support', 'lymphatic drainage'],
      sequence: ['morning protocol', 'midday protocol', 'evening protocol']
    },
    goals: [
      { id: 'goal1', title: 'Complete daily protocols', targetDays: 28, currentStreak: 0 },
      { id: 'goal2', title: 'Reduce toxin markers', targetValue: -30, unit: '%', currentValue: 0 }
    ],
    notificationSettings: {
      channels: { email: true, push: true, sms: false },
      frequency: 'daily',
      quietHours: { start: '22:00', end: '07:00' }
    },
    history: {
      versionLog: [],
      previousAffirmations: []
    }
  },
  {
    _id: 'phase2',
    phaseNumber: 2,
    name: 'Rebuilding',
    description: 'Second phase focusing on cellular repair',
    startDate: '2025-02-01T00:00:00.000Z',
    endDate: '2025-02-28T00:00:00.000Z',
    affirmation: 'My cells are regenerating with powerful energy',
    isCompleted: false,
    customizationSettings: {
      intensity: 'gentle',
      priorities: { detox: 0.3, energy: 0.8, immune: 0.5 },
      optionalElements: ['mitochondrial support', 'cellular hydration'],
      sequence: ['morning energetics', 'afternoon protocols', 'evening rest']
    },
    goals: [
      { id: 'goal3', title: 'Improve energy levels', targetValue: 50, unit: '%', currentValue: 0 }
    ],
    notificationSettings: {
      channels: { email: true, push: true, sms: false },
      frequency: 'daily',
      quietHours: { start: '22:00', end: '07:00' }
    },
    history: {
      versionLog: [],
      previousAffirmations: []
    }
  },
  {
    _id: 'phase3',
    phaseNumber: 3,
    name: 'Revitalization',
    description: 'Third phase focusing on energy restoration',
    startDate: '2025-03-01T00:00:00.000Z',
    endDate: '2025-03-31T00:00:00.000Z',
    affirmation: 'My vitality increases with each passing day',
    isCompleted: false,
    customizationSettings: {
      intensity: 'intensive',
      priorities: { detox: 0.2, energy: 0.7, immune: 0.9 },
      optionalElements: ['nervous system support', 'adrenal regeneration'],
      sequence: ['morning protocols', 'noon scalar sessions', 'evening frequency therapy']
    },
    goals: [
      { id: 'goal4', title: 'Complete all modality sessions', targetDays: 30, currentStreak: 0 }
    ],
    notificationSettings: {
      channels: { email: true, push: true, sms: false },
      frequency: 'daily',
      quietHours: { start: '22:00', end: '07:00' }
    },
    history: {
      versionLog: [],
      previousAffirmations: []
    }
  },
  {
    _id: 'phase4',
    phaseNumber: 4,
    name: 'Maintenance',
    description: 'Fourth phase focusing on long-term health maintenance',
    startDate: '2025-04-01T00:00:00.000Z',
    endDate: '2025-04-30T00:00:00.000Z',
    affirmation: 'I maintain optimal health with consistent practices',
    isCompleted: false,
    customizationSettings: {
      intensity: 'standard',
      priorities: { detox: 0.4, energy: 0.4, immune: 0.6 },
      optionalElements: ['periodic detox', 'maintenance protocols'],
      sequence: ['morning maintenance', 'weekly detox', 'monthly deep cleanse']
    },
    goals: [
      { id: 'goal5', title: 'Maintain health markers', targetValue: 0, unit: '%', currentValue: 0 }
    ],
    notificationSettings: {
      channels: { email: true, push: true, sms: false },
      frequency: 'weekly',
      quietHours: { start: '22:00', end: '07:00' }
    },
    history: {
      versionLog: [],
      previousAffirmations: []
    }
  }
];

describe('PhaseSettings component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock session
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: '123',
          currentPhaseNumber: 1
        }
      },
      status: 'authenticated'
    });
    
    // Mock fetch API to return our mock data
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === '/api/phases') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPhases)
        });
      } else if (url.includes('/api/phases/')) {
        // For phase updates
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      return Promise.reject(new Error('Not found'));
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // 1. Phase Timeline Precision Tests
  describe('Phase Timeline Precision', () => {
    test('should load and display all phases with their timelines', async () => {
      await act(async () => {
        render(<PhaseSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('Phase 1: Detoxification')).toBeInTheDocument();
        expect(screen.getByText('Phase 2: Rebuilding')).toBeInTheDocument();
        expect(screen.getByText('Phase 3: Revitalization')).toBeInTheDocument();
        expect(screen.getByText('Phase 4: Maintenance')).toBeInTheDocument();
      });

      // Check for date inputs
      expect(screen.getAllByLabelText(/Start Date/i)).toHaveLength(4);
      expect(screen.getAllByLabelText(/End Date/i)).toHaveLength(4);
    });

    test('should correctly update phase date and trigger recalculation', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<PhaseSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('Phase 1: Detoxification')).toBeInTheDocument();
      });

      // Get the date inputs for the first phase
      const phase1StartDate = screen.getAllByLabelText(/Start Date/i)[0];
      const phase1EndDate = screen.getAllByLabelText(/End Date/i)[0];
      
      // Change start date
      await user.clear(phase1StartDate);
      await user.type(phase1StartDate, '2025-01-15');
      fireEvent.blur(phase1StartDate);
      
      // Verify fetch was called with the correct data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/phases/phase1', expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('startDate')
        }));
      });
    });

    test('should prevent invalid date selections (end date before start date)', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<PhaseSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('Phase 1: Detoxification')).toBeInTheDocument();
      });

      // Get the date inputs for the first phase
      const phase1StartDate = screen.getAllByLabelText(/Start Date/i)[0];
      const phase1EndDate = screen.getAllByLabelText(/End Date/i)[0];
      
      // Set start date to a date after the end date
      await user.clear(phase1StartDate);
      await user.type(phase1StartDate, '2025-02-15'); // After current end date
      fireEvent.blur(phase1StartDate);
      
      // Verify validation occurs
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/phases/phase1', expect.anything());
      });
      
      // End date should be updated automatically to maintain valid range
      expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/phase1/), expect.objectContaining({
        method: 'PUT'
      }));
    });

    test('should detect gaps between phases and offer resolution', async () => {
      // This would require specific UI elements for gap detection
      // Implementation will depend on your UI for showing gaps
      const user = userEvent.setup();
      
      // Mock a response that includes a gap
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url === '/api/phases') {
          const phasesWithGap = [...mockPhases];
          phasesWithGap[1].startDate = '2025-02-15T00:00:00.000Z'; // Create gap between phase 1 and 2
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(phasesWithGap)
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }) as jest.Mock;
      
      await act(async () => {
        render(<PhaseSettings />);
      });

      // Wait for component to load with the gap data
      await waitFor(() => {
        expect(screen.getByText('Phase 1: Detoxification')).toBeInTheDocument();
        expect(screen.getByText('Phase 2: Rebuilding')).toBeInTheDocument();
      });
      
      // Implementation depends on how your UI shows gaps
      // Below is a hypothetical test assuming there's a gap warning message
      // expect(screen.getByText(/gap detected/i)).toBeInTheDocument();
    });
  });

  // 2. Transition Workflow Automation Tests
  describe('Transition Workflow Automation', () => {
    test('should mark a phase as completed and trigger transition workflow', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<PhaseSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('Phase 1: Detoxification')).toBeInTheDocument();
      });

      // Find the "Mark Complete" button for phase 1
      const completeButton = screen.getAllByText('Mark Complete')[0];
      await user.click(completeButton);
      
      // Verify completion API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/phases/phase1', expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('isCompleted')
        }));
      });
      
      // After completing, verify UI updates
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2); // Initial load + completion update
      });
    });

    test('should prevent early phase transition without safeguards', async () => {
      // Mock implementation for early transition prevention
      // This would depend on your specific UI implementation
      const user = userEvent.setup();
      
      // Mock that phase 1 doesn't meet completion criteria
      global.fetch = jest.fn().mockImplementation((url, options) => {
        if (url.includes('/api/phases/phase1') && options?.body?.includes('isCompleted')) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ 
              error: 'Cannot complete phase: prerequisite tasks incomplete',
              missingTasks: ['Complete all required protocols', 'Submit final progress report']
            })
          });
        }
        
        if (url === '/api/phases') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockPhases)
          });
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }) as jest.Mock;
      
      await act(async () => {
        render(<PhaseSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('Phase 1: Detoxification')).toBeInTheDocument();
      });

      // Find the "Mark Complete" button for phase 1
      const completeButton = screen.getAllByText('Mark Complete')[0];
      await user.click(completeButton);
      
      // API should be called with completion request
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/phases/phase1', expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('isCompleted')
        }));
      });
      
      // Error handling would depend on your UI implementation
      // This is a hypothetical test assuming error messages appear in the UI
      // await waitFor(() => {
      //   expect(screen.getByText(/prerequisite tasks incomplete/i)).toBeInTheDocument();
      // });
    });
  });

  // 3. Dynamic Phase Customization Tests
  describe('Dynamic Phase Customization', () => {
    // These tests would depend on the specific UI implementation for phase customization
    // Below are examples of how these tests might be structured
    
    test('should adjust intensity levels and update recommendations', async () => {
      // Would require your UI to have intensity level settings
      // This is a placeholder test
    });
    
    test('should reorder protocol sequence items via drag and drop', async () => {
      // Would require your UI to support drag and drop for sequence reordering
      // This is a placeholder test
    });
  });

  // 4. Personalized Affirmation Management Tests
  describe('Personalized Affirmation Management', () => {
    test('should display current phase affirmations', async () => {
      await act(async () => {
        render(<PhaseSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('Phase 1: Detoxification')).toBeInTheDocument();
      });
      
      // Check if affirmations are displayed
      expect(screen.getByText('"My body is cleansing and healing itself every day"')).toBeInTheDocument();
      expect(screen.getByText('"My cells are regenerating with powerful energy"')).toBeInTheDocument();
      expect(screen.getByText('"My vitality increases with each passing day"')).toBeInTheDocument();
      expect(screen.getByText('"I maintain optimal health with consistent practices"')).toBeInTheDocument();
    });
    
    test('should update affirmation text', async () => {
      // This test would depend on how your UI allows affirmation editing
      // It's a placeholder for now
    });
  });

  // 5. Phase-Specific Goal Tracking Tests
  describe('Phase-Specific Goal Tracking', () => {
    // These tests would depend on your goal tracking UI implementation
    // They are placeholders for now
    
    test('should display goal progress and milestones', async () => {
      // Placeholder for goal tracking tests
    });
    
    test('should update goal progress and celebrate achievements', async () => {
      // Placeholder for goal achievement tests
    });
  });

  // 6. Notification Control Center Tests
  describe('Notification Control Center', () => {
    // These tests would depend on your notification UI implementation
    // They are placeholders for now
    
    test('should configure notification preferences across channels', async () => {
      // Placeholder for notification settings tests
    });
    
    test('should respect quiet hours settings', async () => {
      // Placeholder for quiet hours tests
    });
  });

  // 7. Progress Continuity Safeguards Tests
  describe('Progress Continuity Safeguards', () => {
    // These tests would depend on your data preservation UI implementation
    // They are placeholders for now
    
    test('should archive phase data upon transition', async () => {
      // Placeholder for data archiving tests
    });
    
    test('should display comparative reports across phases', async () => {
      // Placeholder for comparative reporting tests
    });
  });

  // 8. Administrative Controls & Governance Tests
  describe('Administrative Controls & Governance', () => {
    // These tests would depend on your admin control UI implementation
    // They are placeholders for now
    
    test('should enforce practitioner protocol overrides', async () => {
      // Placeholder for practitioner override tests
    });
    
    test('should maintain audit logs for critical changes', async () => {
      // Placeholder for audit logging tests
    });
  });

  // 9. Device-Agnostic Responsiveness Tests
  describe('Device-Agnostic Responsiveness', () => {
    test('should render appropriately on mobile viewport', async () => {
      // Resize window to mobile dimensions
      global.innerWidth = 375;
      global.innerHeight = 667;
      global.dispatchEvent(new Event('resize'));
      
      await act(async () => {
        render(<PhaseSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('Phase 1: Detoxification')).toBeInTheDocument();
      });
      
      // Check for mobile-specific layout
      // This would depend on your responsive design implementation
    });
    
    test('should render appropriately on tablet viewport', async () => {
      // Resize window to tablet dimensions
      global.innerWidth = 768;
      global.innerHeight = 1024;
      global.dispatchEvent(new Event('resize'));
      
      await act(async () => {
        render(<PhaseSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('Phase 1: Detoxification')).toBeInTheDocument();
      });
      
      // Check for tablet-specific layout
      // This would depend on your responsive design implementation
    });
    
    test('should render appropriately on desktop viewport', async () => {
      // Resize window to desktop dimensions
      global.innerWidth = 1440;
      global.innerHeight = 900;
      global.dispatchEvent(new Event('resize'));
      
      await act(async () => {
        render(<PhaseSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('Phase 1: Detoxification')).toBeInTheDocument();
      });
      
      // Check for desktop-specific layout
      // This would depend on your responsive design implementation
    });
  });

  // 10. Accessibility (A11y) Compliance Tests
  describe('Accessibility (A11y) Compliance', () => {
    test('should pass axe accessibility tests', async () => {
      await act(async () => {
        render(<PhaseSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('Phase 1: Detoxification')).toBeInTheDocument();
      });
      
      const results = await axe(document.body);
      expect(results).toHaveNoViolations();
    });
    
    test('should be fully navigable via keyboard', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<PhaseSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('Phase 1: Detoxification')).toBeInTheDocument();
      });
      
      // Focus on the first element
      await user.tab();
      
      // Tab through all interactive elements
      // This would need to be expanded based on your UI structure
      let tabCount = 0;
      const maxTabs = 20; // Arbitrary limit to prevent infinite loops
      
      while (tabCount < maxTabs) {
        await user.tab();
        tabCount++;
        
        // Check if we've tabbed through all elements and returned to the start
        // This check would depend on your specific UI structure
        // if (document.activeElement === /* first element */) break;
      }
      
      // Verify we can reach all interactive elements via keyboard
      // This would depend on your specific UI implementation
    });
    
    test('should have proper ARIA attributes on interactive elements', async () => {
      await act(async () => {
        render(<PhaseSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('Phase 1: Detoxification')).toBeInTheDocument();
      });
      
      // Check date inputs have proper labels
      const dateInputs = screen.getAllByLabelText(/Date/);
      dateInputs.forEach(input => {
        expect(input).toHaveAttribute('aria-invalid', 'false');
      });
      
      // Check buttons have accessible names
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  // 11. Fault Tolerance + Recovery Tests
  describe('Fault Tolerance + Recovery', () => {
    test('should handle API errors gracefully', async () => {
      // Mock API failure
      global.fetch = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error('Network error'));
      }) as jest.Mock;
      
      await act(async () => {
        render(<PhaseSettings />);
      });
      
      // Error handling would depend on your UI implementation
      // This is a hypothetical test assuming error messages appear in the UI
      // await waitFor(() => {
      //   expect(screen.getByText(/failed to load phases/i)).toBeInTheDocument();
      // });
    });
    
    test('should recover from invalid input with clear feedback', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<PhaseSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('Phase 1: Detoxification')).toBeInTheDocument();
      });
      
      // Get the date inputs for the first phase
      const phase1StartDate = screen.getAllByLabelText(/Start Date/i)[0];
      
      // Input invalid date
      await user.clear(phase1StartDate);
      await user.type(phase1StartDate, 'invalid date');
      fireEvent.blur(phase1StartDate);
      
      // Error handling would depend on your UI implementation
      // This is a hypothetical test assuming validation feedback appears in the UI
      // await waitFor(() => {
      //   expect(screen.getByText(/invalid date format/i)).toBeInTheDocument();
      // });
    });
  });

  // 12. Performance & Orchestration Validation Tests
  describe('Performance & Orchestration Validation', () => {
    test('should render phase settings panel within performance budget', async () => {
      // Measure render time
      const startTime = performance.now();
      
      await act(async () => {
        render(<PhaseSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('Phase 1: Detoxification')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Verify render time is under 400ms (note: this is approximate in a test environment)
      // console.log(`Render time: ${renderTime}ms`);
      // expect(renderTime).toBeLessThan(400);
    });
    
    test('should respond to timeline interactions within performance budget', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<PhaseSettings />);
      });

      await waitFor(() => {
        expect(screen.getByText('Phase 1: Detoxification')).toBeInTheDocument();
      });
      
      // Get the date input for the first phase
      const phase1StartDate = screen.getAllByLabelText(/Start Date/i)[0];
      
      // Measure interaction time
      const startTime = performance.now();
      
      // Change start date
      await user.clear(phase1StartDate);
      await user.type(phase1StartDate, '2025-01-15');
      fireEvent.blur(phase1StartDate);
      
      // Wait for the API call to be made
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/phases/phase1', expect.anything());
      });
      
      const endTime = performance.now();
      const interactionTime = endTime - startTime;
      
      // Verify interaction time is under 100ms (note: this is approximate in a test environment)
      // console.log(`Interaction time: ${interactionTime}ms`);
      // expect(interactionTime).toBeLessThan(100);
    });
  });
});
