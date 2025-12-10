/**
 * @jest-environment jsdom
 */

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom';
import { expect, jest, beforeEach, afterEach, afterAll } from '@jest/globals';

import React from 'react';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import { useSession } from 'next-auth/react';
import TodaysTasks from '../TodaysTasks';

// Use explicit any casting for window.trackEvent to fix TypeScript errors
(window as any).trackEvent = jest.fn();

// Mock the next-auth useSession hook
jest.mock('next-auth/react');

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: function mockMatchMedia(query: string) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  }
});

// Mock the PhaseProgressContext
const mockUpdatePhaseProgress = jest.fn();
jest.mock('../../../contexts/PhaseProgressContext', () => ({
  usePhaseProgress: () => ({
    updateProgress: mockUpdatePhaseProgress,
    progress: 0.5
  })
}));

// Mock date for consistent timestamp testing
const mockDate = new Date('2025-03-22T14:30:00Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

// Define interfaces for our test data
interface Task {
  _id: string;
  phaseNumber: number;
  title: string;
  description: string;
  estimatedTimeMinutes: number;
  timeBlock: 'morning' | 'afternoon' | 'evening';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  completedAt?: string;
  requiresMedia?: boolean;
  mediaUrl?: string;
  tutorialUrl?: string;
  externalLink?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data for tasks in different phases
const mockTasks: Task[] = [
  // Phase 1 Tasks
  {
    _id: 'task1',
    phaseNumber: 1,
    title: 'Morning Lymphatic Drainage',
    description: 'Complete 15-minute lymphatic drainage protocol before breakfast',
    estimatedTimeMinutes: 15,
    timeBlock: 'morning',
    priority: 'high',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'task2',
    phaseNumber: 1,
    title: 'Liver Detox Tea',
    description: 'Drink one cup of prescribed detox tea with breakfast',
    estimatedTimeMinutes: 5,
    timeBlock: 'morning',
    priority: 'high',
    completed: true,
    completedAt: '2025-03-22T08:15:00Z',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'task3',
    phaseNumber: 1,
    title: 'Afternoon Scalar Energy Session',
    description: 'Complete 30-minute scalar energy session',
    estimatedTimeMinutes: 30,
    timeBlock: 'afternoon',
    priority: 'medium',
    completed: false,
    requiresMedia: true,
    tutorialUrl: 'https://example.com/tutorials/scalar-energy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'task4',
    phaseNumber: 1,
    title: 'Evening Detox Bath',
    description: 'Take a 20-minute detox bath with prescribed salts',
    estimatedTimeMinutes: 20,
    timeBlock: 'evening',
    priority: 'medium',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Phase 2 Tasks
  {
    _id: 'task5',
    phaseNumber: 2,
    title: 'Morning Mitochondrial Activation',
    description: 'Complete 10-minute mitochondrial activation protocol',
    estimatedTimeMinutes: 10,
    timeBlock: 'morning',
    priority: 'high',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Phase 3 Tasks
  {
    _id: 'task6',
    phaseNumber: 3,
    title: 'Morning Regeneration Protocol',
    description: 'Complete 20-minute cellular regeneration routine',
    estimatedTimeMinutes: 20,
    timeBlock: 'morning',
    priority: 'high',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Phase 4 Tasks
  {
    _id: 'task7',
    phaseNumber: 4,
    title: 'Integration Meditation',
    description: 'Complete 15-minute guided integration meditation',
    estimatedTimeMinutes: 15,
    timeBlock: 'morning',
    priority: 'high',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Phase 5 Tasks
  {
    _id: 'task8',
    phaseNumber: 5,
    title: 'Maintenance Protocol',
    description: 'Complete 10-minute maintenance routine',
    estimatedTimeMinutes: 10,
    timeBlock: 'morning',
    priority: 'medium',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Setup MSW server for API mocking
const server = setupServer(
  // Get tasks
  http.get('/api/tasks', ({ request }) => {
    const url = new URL(request.url);
    const phaseNumber = url.searchParams.get('phaseNumber');
    
    let filteredTasks = mockTasks;
    
    if (phaseNumber) {
      filteredTasks = mockTasks.filter(task => task.phaseNumber === parseInt(phaseNumber));
    }
    
    return HttpResponse.json(filteredTasks);
  }),
  
  // Complete task
  http.post('/api/tasks/:taskId/complete', async ({ params }) => {
    const { taskId } = params;
    
    // Update task in our mock data
    const updatedTasks = mockTasks.map(task => 
      task._id === taskId 
        ? { 
            ...task, 
            completed: true,
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } 
        : task
    );
    
    // Find the updated task
    const updatedTask = updatedTasks.find(t => t._id === taskId);
    
    return HttpResponse.json({ 
      success: true, 
      data: updatedTask
    });
  }),
  
  // Uncomplete task
  http.post('/api/tasks/:taskId/uncomplete', async ({ params }) => {
    const { taskId } = params;
    
    // Update task in our mock data
    const updatedTasks = mockTasks.map(task => 
      task._id === taskId 
        ? { 
            ...task, 
            completed: false,
            completedAt: undefined,
            updatedAt: new Date().toISOString()
          } 
        : task
    );
    
    // Find the updated task
    const updatedTask = updatedTasks.find(t => t._id === taskId);
    
    return HttpResponse.json({ 
      success: true, 
      data: updatedTask
    });
  })
);

describe('Today\'s Tasks Component', () => {
  // Setup before tests
  beforeAll(() => {
    server.listen();
  });
  
  // Reset after each test
  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
    localStorage.clear();
  });
  
  // Clean up after all tests
  afterAll(() => {
    server.close();
    jest.restoreAllMocks();
  });
  
  // Mock session for a user in a specific phase
  const mockSessionForPhase = (phaseNumber: number) => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          currentPhaseNumber: phaseNumber
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      status: 'authenticated'
    });
  };

  // 1. Task Display and Interaction Tests
  describe('Task Display and Interaction Tests', () => {
    test('displays only tasks for the current phase', async () => {
      // Setup user in phase 1
      mockSessionForPhase(1);
      
      // Render component
      render(<TodaysTasks />);
      
      // Wait for tasks to load
      await waitFor(() => {
        // Phase 1 tasks should be visible
        expect(screen.getByText('Morning Lymphatic Drainage')).toBeInTheDocument();
        expect(screen.getByText('Liver Detox Tea')).toBeInTheDocument();
        expect(screen.getByText('Afternoon Scalar Energy Session')).toBeInTheDocument();
        expect(screen.getByText('Evening Detox Bath')).toBeInTheDocument();
        
        // Phase 2 tasks should not be visible
        expect(screen.queryByText('Morning Mitochondrial Activation')).not.toBeInTheDocument();
      });
    });
    
    test('groups tasks by time block', async () => {
      mockSessionForPhase(1);
      render(<TodaysTasks />);
      
      await waitFor(() => {
        // Check for time block headings
        expect(screen.getByText('Morning')).toBeInTheDocument();
        expect(screen.getByText('Afternoon')).toBeInTheDocument();
        expect(screen.getByText('Evening')).toBeInTheDocument();
      });
      
      // Check that tasks are under correct time blocks
      const morningSection = screen.getByText('Morning').closest('section');
      const afternoonSection = screen.getByText('Afternoon').closest('section');
      const eveningSection = screen.getByText('Evening').closest('section');
      
      if (morningSection) {
        expect(within(morningSection).getByText('Morning Lymphatic Drainage')).toBeInTheDocument();
        expect(within(morningSection).getByText('Liver Detox Tea')).toBeInTheDocument();
      }
      
      if (afternoonSection) {
        expect(within(afternoonSection).getByText('Afternoon Scalar Energy Session')).toBeInTheDocument();
      }
      
      if (eveningSection) {
        expect(within(eveningSection).getByText('Evening Detox Bath')).toBeInTheDocument();
      }
    });
    
    test('toggles task completion when checkbox is clicked', async () => {
      mockSessionForPhase(1);
      const user = userEvent.setup();
      
      render(<TodaysTasks />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Morning Lymphatic Drainage')).toBeInTheDocument();
      });
      
      // Find an uncompleted task
      const lymphaticDrainageTask = screen.getByText('Morning Lymphatic Drainage').closest('[data-testid="task-item"]');
      
      // Get the checkbox
      const checkbox = within(lymphaticDrainageTask as HTMLElement).getByRole('checkbox');
      
      // Initially unchecked
      expect(checkbox).not.toBeChecked();
      
      // Click the checkbox to complete the task
      await user.click(checkbox);
      
      // Optimistic UI should update immediately
      expect(checkbox).toBeChecked();
      
      // Wait for API call to complete and verify persisted state
      await waitFor(() => {
        expect(checkbox).toBeChecked();
        // Verify that text has strikethrough class
        const taskText = within(lymphaticDrainageTask as HTMLElement).getByText('Morning Lymphatic Drainage');
        expect(taskText).toHaveClass('line-through');
        // Verify that analytics event was tracked
        (expect((window as any).trackEvent) as any).toHaveBeenCalledWith(
          'task_completed',
          { taskId: 'task1' }
        );
        // Verify that phase progress was updated
        expect(mockUpdatePhaseProgress).toHaveBeenCalled();
      });
    });
  });

  // 2. Task Completion Workflow
  describe('Task Completion Workflow', () => {
    test('completes task with proper API call and persistence', async () => {
      mockSessionForPhase(1);
      const user = userEvent.setup();
      
      render(<TodaysTasks />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Morning Lymphatic Drainage')).toBeInTheDocument();
      });
      
      // Find an uncompleted task
      const lymphaticDrainageTask = screen.getByText('Morning Lymphatic Drainage').closest('[data-testid="task-item"]');
      
      // Get the checkbox
      const checkbox = within(lymphaticDrainageTask as HTMLElement).getByRole('checkbox');
      
      // Click the checkbox to complete the task
      await user.click(checkbox);
      
      // Verify API call was made correctly
      await waitFor(() => {
        expect(mockUpdatePhaseProgress).toHaveBeenCalled();
      });
      
      // Refresh the component to verify persistence
      jest.clearAllMocks();
      
      // Re-render to simulate refresh
      cleanup();
      render(<TodaysTasks />);
      
      // Check that task is still completed after refresh
      await waitFor(() => {
        const refreshedTask = screen.getByText('Morning Lymphatic Drainage').closest('[data-testid="task-item"]');
        const refreshedCheckbox = within(refreshedTask as HTMLElement).getByRole('checkbox');
        expect(refreshedCheckbox).toBeChecked();
      });
    });
    
    test('handles API errors when completing tasks', async () => {
      mockSessionForPhase(1);
      const user = userEvent.setup();
      
      // Override the default handler to simulate an error
      server.use(
        http.post('/api/tasks/:taskId/complete', async () => {
          await delay(100);
          return new HttpResponse(null, { status: 500 });
        })
      );
      
      render(<TodaysTasks />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Morning Lymphatic Drainage')).toBeInTheDocument();
      });
      
      // Find the task and checkbox
      const lymphaticDrainageTask = screen.getByText('Morning Lymphatic Drainage').closest('[data-testid="task-item"]');
      const checkbox = within(lymphaticDrainageTask as HTMLElement).getByRole('checkbox');
      
      // Click the checkbox to complete the task
      await user.click(checkbox);
      
      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/failed to update task/i)).toBeInTheDocument();
        // Check for retry button
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
      
      // Status should revert to original after error
      expect(checkbox).not.toBeChecked();
    });
  });

  // 3. Daily Reset Simulation
  describe('Daily Reset Simulation', () => {
    test('resets tasks at midnight', async () => {
      mockSessionForPhase(1);
      
      // Ensure some tasks are completed
      const completedTasks = [...mockTasks];
      completedTasks[0] = { ...completedTasks[0], completed: true, completedAt: '2025-03-22T10:15:00Z' };
      completedTasks[2] = { ...completedTasks[2], completed: true, completedAt: '2025-03-22T15:30:00Z' };
      
      server.use(
        http.get('/api/tasks', () => {
          return HttpResponse.json(completedTasks.filter(task => task.phaseNumber === 1));
        })
      );
      
      render(<TodaysTasks />);
      
      // Wait for tasks to load
      await waitFor(() => {
        const lymphaticTask = screen.getByText('Morning Lymphatic Drainage').closest('[data-testid="task-item"]');
        const lymphaticCheckbox = within(lymphaticTask as HTMLElement).getByRole('checkbox');
        expect(lymphaticCheckbox).toBeChecked();
        
        const scalarTask = screen.getByText('Afternoon Scalar Energy Session').closest('[data-testid="task-item"]');
        const scalarCheckbox = within(scalarTask as HTMLElement).getByRole('checkbox');
        expect(scalarCheckbox).toBeChecked();
      });
      
      // Simulate midnight reset (change mock date to next day)
      const nextDay = new Date(mockDate);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 1); // Just after midnight
      jest.spyOn(global, 'Date').mockImplementation(() => nextDay);
      
      // Reset tasks in the mock data
      const resetTasks = mockTasks.map(task => ({
        ...task,
        completed: false,
        completedAt: undefined
      }));
      
      server.use(
        http.get('/api/tasks', () => {
          return HttpResponse.json(resetTasks.filter(task => task.phaseNumber === 1));
        })
      );
      
      // Trigger the reset (this would normally be done by a timer or user action)
      fireEvent(window, new Event('midnight-reset'));
      
      // Check that tasks are reset
      await waitFor(() => {
        const tasks = screen.getAllByTestId('task-item');
        for (const task of tasks) {
          const checkbox = within(task).getByRole('checkbox');
          expect(checkbox).not.toBeChecked();
        }
      });
    });
  });

  // 4. Accessibility Compliance
  describe('Accessibility Compliance Tests', () => {
    test('has proper semantic structure and ARIA attributes', async () => {
      mockSessionForPhase(1);
      
      const { container } = render(<TodaysTasks />);
      
      await waitFor(() => {
        expect(screen.getByText(/Today's Tasks/i)).toBeInTheDocument();
      });
      
      // Check heading structure
      const heading = screen.getByRole('heading', { level: 2, name: /Today's Tasks/i });
      expect(heading).toBeInTheDocument();
      
      // Check that task list has proper list semantics
      const taskList = container.querySelector('ul');
      expect(taskList).toBeInTheDocument();
      
      // Check that task items are list items
      const taskItems = container.querySelectorAll('li');
      expect(taskItems.length).toBeGreaterThan(0);
      
      // Check that checkboxes have proper ARIA attributes
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAttribute('aria-checked');
      });
      
      // Check keyboard navigation (Tab order)
      const focusableElements = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      expect(focusableElements.length).toBeGreaterThan(0);
    });
  });

  // 5. Responsive Design Tests
  describe('Responsive Design Tests', () => {
    const deviceSizes = [
      ['mobile', 375],
      ['tablet', 768],
      ['desktop', 1024]
    ] as const;
    
    deviceSizes.forEach(([device, width]) => {
      test(`renders correctly on ${device} screens`, async () => {
        // Mock window.matchMedia to simulate screen width
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: function mockMatchMedia(query: string) {
            const widthMatch = query.match(/\(min-width: (\d+)px\)/);
            const widthValue = widthMatch ? parseInt(widthMatch[1]) : 0;
            
            return {
              matches: width >= widthValue,
              media: query,
              onchange: null,
              addListener: jest.fn(),
              removeListener: jest.fn(),
              addEventListener: jest.fn(),
              removeEventListener: jest.fn(),
              dispatchEvent: jest.fn(),
            };
          }
        });
        
        // Set viewport width
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        
        mockSessionForPhase(1);
        render(<TodaysTasks />);
        
        // Wait for component to load
        await waitFor(() => {
          expect(screen.getByText(/Today's Tasks/i)).toBeInTheDocument();
        });
        
        // Check for expected layout classes based on screen size
        const container = screen.getByTestId('todays-tasks-panel');
        
        if (width < 768) {
          expect(container).toHaveClass('mobile-view');
        } else if (width >= 768 && width < 1024) {
          expect(container).toHaveClass('tablet-view');
        } else {
          expect(container).toHaveClass('desktop-view');
        }
      });
    });
  });

  // 6. Edge Case Scenarios
  describe('Edge Case Scenarios', () => {
    test('displays empty state message when no tasks exist', async () => {
      mockSessionForPhase(5);
      
      // Override API to return empty arrays
      server.use(
        http.get('/api/tasks', () => {
          return HttpResponse.json([]);
        })
      );
      
      render(<TodaysTasks />);
      
      // Check for empty state message
      await waitFor(() => {
        expect(screen.getByText(/no tasks for today/i)).toBeInTheDocument();
      });
    });
    
    test('handles task tutorial videos properly', async () => {
      mockSessionForPhase(1);
      const user = userEvent.setup();
      
      render(<TodaysTasks />);
      
      // Wait for tasks to load
      await waitFor(() => {
        expect(screen.getByText('Afternoon Scalar Energy Session')).toBeInTheDocument();
      });
      
      // Find task with tutorial
      const scalarTask = screen.getByText('Afternoon Scalar Energy Session').closest('[data-testid="task-item"]');
      
      // Find and click the info/tutorial button
      const infoButton = within(scalarTask as HTMLElement).getByRole('button', { name: /tutorial/i });
      await user.click(infoButton);
      
      // Check that the tutorial modal opens
      await waitFor(() => {
        expect(screen.getByText(/tutorial/i)).toBeInTheDocument();
        const videoElement = screen.getByTestId('tutorial-video');
        expect(videoElement).toBeInTheDocument();
        (expect(videoElement) as any).toHaveAttribute('src', 'scalar-energy-tutorial.mp4');
      });
    });
  });

  // 7. Analytics and Integration Tests
  describe('Analytics and Integration Tests', () => {
    test('tracks task view and completion events', async () => {
      mockSessionForPhase(1);
      const user = userEvent.setup();
      
      render(<TodaysTasks />);
      
      await waitFor(() => {
        expect(screen.getByText('Morning Lymphatic Drainage')).toBeInTheDocument();
        
        // Check that task view analytics were fired
        (expect((window as any).trackEvent) as any).toHaveBeenCalledWith(
          'tasks_view',
          { 
            taskCount: 4,
            phaseNumber: 1
          }
        );
      });
      
      // Find and click a checkbox
      const lymphaticDrainageTask = screen.getByText('Morning Lymphatic Drainage').closest('[data-testid="task-item"]');
      const checkbox = within(lymphaticDrainageTask as HTMLElement).getByRole('checkbox');
      await user.click(checkbox);
      
      // Check that analytics event was tracked
      await waitFor(() => {
        (expect((window as any).trackEvent) as any).toHaveBeenCalledWith(
          'task_completed',
          { 
            taskId: 'task1',
            taskName: 'Morning Lymphatic Drainage',
            timeToComplete: expect(expect.any(Number)) as any
          }
        );
      });
    });
  });
});
