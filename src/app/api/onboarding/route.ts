import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/schema';
import { isTestMode } from '@/lib/test-mode';
import * as bcrypt from 'bcryptjs';

// Valid phase numbers for validation (FM-004 hardening)
const VALID_PHASES = [1, 2, 3, 4] as const;
type ValidPhase = typeof VALID_PHASES[number];

// Phase information for the wizard
const PHASE_INFO = {
  1: {
    name: 'Phase 1: Foundation',
    description: 'Building the foundation for your wellness journey. Focus on basic detoxification and preparing your body.',
    duration: '30 days',
    affirmation: 'I am preparing my body for complete bioelectric regeneration.'
  },
  2: {
    name: 'Phase 2: Bioelectric Regeneration',
    description: 'Advanced cellular repair and bioelectric regeneration. Deep detox and energy optimization.',
    duration: '30 days',
    affirmation: 'Every day my body releases toxins and grows healthier through bioelectric regeneration.'
  },
  3: {
    name: 'Phase 3: Cellular Optimization',
    description: 'Optimizing cellular function and energy production. Enhanced mitochondrial support.',
    duration: '30 days',
    affirmation: 'My cells are filled with energy and vitality, powering my complete regeneration.'
  },
  4: {
    name: 'Phase 4: Complete Regeneration',
    description: 'Achieving complete liver and colon regeneration. Final phase of the protocol.',
    duration: '30 days',
    affirmation: 'My liver and colon are completely regenerating and returning to optimal health.'
  }
} as const;

interface OnboardingData {
  name: string;
  email: string;
  password?: string;
  currentPhaseNumber: ValidPhase;
  preferences?: {
    notifications?: {
      email: boolean;
      inApp: boolean;
      sms: boolean;
    };
    theme?: string;
  };
}

/**
 * GET /api/onboarding - Get phase information for wizard
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      phases: PHASE_INFO
    });
  } catch (error) {
    console.error('Error in onboarding GET:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch phase information' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/onboarding - Complete onboarding and create/update user
 * Implements atomic operation pattern (FM-002 hardening)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const data: OnboardingData = await request.json();

    // Validate required fields
    if (!data.name || !data.email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate phase selection (FM-004 hardening - reject non-member values)
    if (!data.currentPhaseNumber || !VALID_PHASES.includes(data.currentPhaseNumber)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid phase: ${data.currentPhaseNumber}. Must be one of: ${VALID_PHASES.join(', ')}`
        },
        { status: 400 }
      );
    }

    // TEST_MODE handling
    if (isTestMode()) {
      console.log('TEST_MODE enabled - returning mock onboarding success');
      return NextResponse.json({
        success: true,
        user: {
          id: 'mock-user-id',
          name: data.name,
          email: data.email,
          currentPhaseNumber: data.currentPhaseNumber,
          onboardingComplete: true,
          programStartDate: new Date().toISOString()
        },
        message: 'Onboarding completed successfully (TEST_MODE)'
      });
    }

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });

    if (existingUser) {
      // Update existing user with onboarding data
      existingUser.name = data.name;
      existingUser.currentPhaseNumber = data.currentPhaseNumber;
      existingUser.programStartDate = existingUser.programStartDate || new Date();
      (existingUser as any).onboardingComplete = true;

      if (data.preferences) {
        (existingUser as any).preferences = data.preferences;
      }

      await existingUser.save();

      return NextResponse.json({
        success: true,
        user: {
          id: existingUser._id.toString(),
          name: existingUser.name,
          email: existingUser.email,
          currentPhaseNumber: existingUser.currentPhaseNumber,
          onboardingComplete: true,
          programStartDate: existingUser.programStartDate
        },
        message: 'Onboarding updated successfully'
      });
    }

    // Create new user
    // Hash password if provided, otherwise use a placeholder (will be set on first login)
    const hashedPassword = data.password
      ? await bcrypt.hash(data.password, 12)
      : await bcrypt.hash('placeholder-will-be-reset', 12);

    const newUser = new User({
      email: data.email.toLowerCase(),
      password: hashedPassword,
      name: data.name,
      programStartDate: new Date(),
      currentPhaseNumber: data.currentPhaseNumber,
      complianceStreak: 0,
      onboardingComplete: true,
      preferences: data.preferences || {
        notifications: { email: true, inApp: true, sms: false },
        theme: 'system'
      }
    });

    await newUser.save();

    console.log(`New user created via onboarding: ${newUser.email}, Phase: ${data.currentPhaseNumber}`);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        currentPhaseNumber: newUser.currentPhaseNumber,
        onboardingComplete: true,
        programStartDate: newUser.programStartDate
      },
      message: 'Onboarding completed successfully'
    });

  } catch (error) {
    console.error('Error in onboarding POST:', error);

    // Handle duplicate key error
    if ((error as any).code === 11000) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/onboarding - Update wizard progress (FM-005/006 hardening)
 * Stores wizard state in MongoDB as single source of truth
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { step, data } = await request.json();

    // Validate step
    const validSteps = ['welcome', 'phase', 'preferences', 'complete'];
    if (!validSteps.includes(step)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wizard step' },
        { status: 400 }
      );
    }

    if (isTestMode()) {
      return NextResponse.json({
        success: true,
        wizardState: { step, data, updatedAt: new Date().toISOString() }
      });
    }

    // If authenticated, update wizard state in user document
    if (session?.user?.email) {
      await connectDB();

      await User.updateOne(
        { email: session.user.email },
        {
          $set: {
            'wizardState.step': step,
            'wizardState.data': data,
            'wizardState.updatedAt': new Date()
          }
        },
        { upsert: false }
      );
    }

    return NextResponse.json({
      success: true,
      wizardState: { step, data, updatedAt: new Date().toISOString() }
    });

  } catch (error) {
    console.error('Error updating wizard state:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update wizard state' },
      { status: 500 }
    );
  }
}
