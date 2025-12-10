/**
 * @jest-environment jsdom
 */

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import DailyAffirmation from '../DailyAffirmation';
import { useSession } from 'next-auth/react';
import '@testing-library/jest-dom';

// Use explicit any casting for window.trackEvent to fix TypeScript errors
(window as any).trackEvent = jest.fn();

jest.mock('next-auth/react');

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

interface Phase {
  _id: string;
  phaseNumber: number;
  name: string;
  affirmation: string;
  createdAt: string;
  updatedAt: string;
}

const mockPhases: Phase[] = [
  {
    _id: 'phase1',
    phaseNumber: 1,
    name: 'Detoxification',
    affirmation: 'I am cleansing my body of toxins and preparing for renewal.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'phase2',
    phaseNumber: 2,
    name: 'Cellular Activation',
    affirmation: 'My cells are energized and working in perfect harmony.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'phase3',
    phaseNumber: 3,
    name: 'Regeneration',
    affirmation: 'My body is healing and regenerating with every breath I take.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'phase4',
    phaseNumber: 4,
    name: 'Integration',
    affirmation: 'I am integrating new patterns of health and vitality into my daily life.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'phase5',
    phaseNumber: 5,
    name: 'Maintenance',
    affirmation: 'I maintain optimal health through conscious choices and daily practices.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const server = setupServer(
  http.get('/api/phases', () => {
    return HttpResponse.json(mockPhases);
  }),
  http.put('/api/phases/:phaseId/affirmation', async ({ params, request }) => {
    const { phaseId } = params;
    const { affirmation } = await request.json() as { affirmation: string };
    
    const updatedPhases = mockPhases.map(phase => 
      phase._id === phaseId ? { ...phase, affirmation, updatedAt: new Date().toISOString() } : phase
    );
    
    return HttpResponse.json({ 
      success: true, 
      data: updatedPhases.find(p => p._id === phaseId) 
    });
  })
);

describe('DailyAffirmation Component', () => {
  beforeAll(() => {
    server.listen();
  });
  
  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
    localStorage.clear();
  });
  
  afterAll(() => {
    server.close();
  });
  
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

  describe('Phase-Based Affirmation Tests', () => {
    const phases = [1, 2, 3, 4, 5];
    
    phases.forEach((phaseNumber) => {
      test(`displays correct affirmation for phase ${phaseNumber}`, async () => {
        mockSessionForPhase(phaseNumber);
        
        render(<DailyAffirmation />);
        
        const expectedPhase = mockPhases.find(p => p.phaseNumber === phaseNumber);
        
        await waitFor(() => {
          // Use type assertion to fix TypeScript errors
          (expect(screen.getByText(`Phase: ${expectedPhase?.name}`)) as any).toBeInTheDocument();
          (expect(screen.getByText(`"${expectedPhase?.affirmation}"`)) as any).toBeInTheDocument();
        });
        
        (expect(screen.getByRole('region', { name: /daily affirmation/i })) as any).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Compliance Tests', () => {
    test('has proper semantic structure and ARIA attributes', async () => {
      mockSessionForPhase(1);
      
      const { container } = render(<DailyAffirmation />);
      
      await waitFor(() => {
        (expect(screen.getByText(/Daily Affirmation/)) as any).toBeInTheDocument();
      });
      
      (expect(screen.getByRole('heading', { name: /Daily Affirmation/i })) as any).toBeInTheDocument();
      
      const regionElement = container.firstChild as HTMLElement;
      (expect(regionElement) as any).toHaveAttribute('role', 'region');
      (expect(regionElement.hasAttribute('aria-labelledby')) as any).toBe(true);
    });
  });

  describe('Responsive Design Tests', () => {
    const deviceSizes = [
      ['mobile', 320],
      ['tablet', 768],
      ['desktop', 1024]
    ] as const;
    
    deviceSizes.forEach(([device, width]) => {
      test(`renders correctly on ${device} screens`, async () => {
        window.matchMedia = jest.fn().mockImplementation((query: string) => {
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
        });
        
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        
        mockSessionForPhase(1);
        
        render(<DailyAffirmation />);
        
        await waitFor(() => {
          (expect(screen.getByText(/Daily Affirmation/)) as any).toBeInTheDocument();
        });
      });
    });
  });
});
