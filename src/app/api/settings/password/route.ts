import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/schema';
import { isTestMode } from '@/lib/test-mode';
import * as bcrypt from 'bcryptjs';

/**
 * POST /api/settings/password - Change user password
 * FM-SEC-001 Hardening: Requires current password verification
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'All password fields are required' },
        { status: 400 }
      );
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'New passwords do not match' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // TEST_MODE handling
    if (isTestMode()) {
      console.log('TEST_MODE: Simulating password change');
      return NextResponse.json({
        success: true,
        message: 'Password changed successfully (TEST_MODE)'
      });
    }

    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findOne({ email: session.user.email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // FM-SEC-001: Verify current password before allowing change
    const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidCurrentPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 403 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    console.log(`Password changed for user: ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
