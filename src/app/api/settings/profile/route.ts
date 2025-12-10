import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/schema';
import { isTestMode } from '@/lib/test-mode';

/**
 * GET /api/settings/profile - Get user profile
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // TEST_MODE handling
    if (isTestMode()) {
      return NextResponse.json({
        success: true,
        profile: {
          name: session.user.name || 'Test User',
          email: session.user.email,
          currentPhaseNumber: session.user.currentPhaseNumber || 1,
          programStartDate: new Date().toISOString(),
          onboardingComplete: true
        }
      });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email.toLowerCase() });

    if (!user) {
      return NextResponse.json({
        success: true,
        profile: {
          name: session.user.name || '',
          email: session.user.email,
          currentPhaseNumber: session.user.currentPhaseNumber || 1,
          programStartDate: null,
          onboardingComplete: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      profile: {
        name: user.name,
        email: user.email,
        currentPhaseNumber: user.currentPhaseNumber,
        programStartDate: user.programStartDate,
        onboardingComplete: (user as any).onboardingComplete ?? true,
        complianceStreak: user.complianceStreak
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/profile - Update user profile
 * FM-SESS-004 Hardening: Returns updated user data for session refresh
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { name } = await request.json();

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 1) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // TEST_MODE handling
    if (isTestMode()) {
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully (TEST_MODE)',
        profile: {
          name: trimmedName,
          email: session.user.email,
          updatedAt: new Date().toISOString()
        }
      });
    }

    await connectDB();

    const user = await User.findOneAndUpdate(
      { email: session.user.email.toLowerCase() },
      { $set: { name: trimmedName } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`Profile updated for user: ${session.user.email}`);

    // Return updated profile for session refresh (FM-SESS-004)
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        name: user.name,
        email: user.email,
        currentPhaseNumber: user.currentPhaseNumber,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
