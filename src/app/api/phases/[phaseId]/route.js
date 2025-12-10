import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';

// Mock phase data for development
const mockPhases = [
  {
    _id: '1',
    phaseNumber: 1,
    name: "Preparation",
    description: "Build the foundation for your bioelectric regeneration journey.",
    startDate: "2025-02-01",
    endDate: "2025-02-28",
    affirmation: "I am preparing my mind and body for complete regeneration.",
    isCompleted: true
  },
  {
    _id: '2',
    phaseNumber: 2,
    name: "Detoxification",
    description: "Focus on removing environmental toxins and supporting liver function.",
    startDate: "2025-03-01",
    endDate: "2025-03-30",
    affirmation: "Every day my body releases toxins and grows healthier through bioelectric regeneration.",
    isCompleted: false
  },
  {
    _id: '3',
    phaseNumber: 3,
    name: "Regeneration",
    description: "Activate cellular regeneration pathways through bioelectric treatments.",
    startDate: "2025-04-01",
    endDate: "2025-04-30",
    affirmation: "My cells are regenerating and restoring optimal function with each passing day.",
    isCompleted: false
  },
  {
    _id: '4',
    phaseNumber: 4,
    name: "Integration",
    description: "Integrate new cellular patterns and maintain regenerative state.",
    startDate: "2025-05-01",
    endDate: "2025-05-30",
    affirmation: "I am fully integrating my regenerated state into all aspects of my life.",
    isCompleted: false
  }
];

// GET a specific phase
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { phaseId } = params;
    const phase = mockPhases.find(p => p._id === phaseId);

    if (!phase) {
      return NextResponse.json(
        { error: 'Phase not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(phase);
  } catch (error) {
    console.error('Error in phases/[phaseId] GET API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch phase data' },
      { status: 500 }
    );
  }
}

// UPDATE a specific phase
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { phaseId } = params;
    const updateData = await request.json();
    
    // Find the phase to update
    const phaseIndex = mockPhases.findIndex(p => p._id === phaseId);
    
    if (phaseIndex === -1) {
      return NextResponse.json(
        { error: 'Phase not found' },
        { status: 404 }
      );
    }

    // In a real application, this would update the database
    // For this mock implementation, we'll just log the update
    console.log(`Updating phase ${phaseId} with data:`, updateData);

    // Return the updated phase data
    const updatedPhase = {
      ...mockPhases[phaseIndex],
      ...updateData
    };

    return NextResponse.json(updatedPhase);
  } catch (error) {
    console.error('Error in phases/[phaseId] PUT API:', error);
    return NextResponse.json(
      { error: 'Failed to update phase data' },
      { status: 500 }
    );
  }
}
