import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';

export async function PUT(request) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse the request body
    const phaseData = await request.json();
    
    if (!phaseData || !phaseData.id) {
      return NextResponse.json(
        { error: 'Invalid phase data' },
        { status: 400 }
      );
    }

    // For development, log the update request and return success
    // In production, this would update the database
    console.log('Updating phase:', phaseData);

    return NextResponse.json({ 
      success: true,
      message: 'Phase updated successfully',
      phase: phaseData
    });
  } catch (error) {
    console.error('Error in phases/update API:', error);
    return NextResponse.json(
      { error: 'Failed to update phase data' },
      { status: 500 }
    );
  }
}
