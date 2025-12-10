import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';

// GET user profile
export async function GET() {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // For development, return mock user data
    // In production, this would fetch from the database
    const mockUserData = {
      id: session.user.id,
      name: session.user.name || 'Test User',
      email: session.user.email,
      programStartDate: '2025-02-01',
      currentPhase: 2,
      progress: {
        phase1: 100,
        phase2: 75,
        phase3: 0,
        phase4: 0,
      }
    };

    return NextResponse.json(mockUserData);
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

// UPDATE user profile
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userData = await request.json();
    
    if (!userData) {
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 400 }
      );
    }

    // Mock updating user data
    // In production, this would update the database
    console.log('Updating user profile:', userData);

    return NextResponse.json({ 
      success: true,
      message: 'User profile updated successfully',
      user: {
        ...userData,
        id: session.user.id || '123456',
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in user update API:', error);
    return NextResponse.json(
      { error: 'Failed to update user data' },
      { status: 500 }
    );
  }
}
