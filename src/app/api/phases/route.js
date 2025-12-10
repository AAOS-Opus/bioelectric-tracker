import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { connectDB } from '../../../lib/db';
import { User, ProductUsage, ModalitySession } from '../../../models/schema';
import mongoose from 'mongoose';

/**
 * Production-grade phases endpoint with full database integration
 * Returns authenticated user's four phases with computed progress metrics
 */
export async function GET() {
  let dbConnection = null;

  try {
    // 1. Authentication - Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(`Fetching phases for user: ${userId}`);

    // 2. Database Connection
    dbConnection = await connectDB();

    // 3. Get user data to access programStartDate
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 4. Check for existing user phases (stored in user collection or separate Phase collection)
    let phases = await getUserPhases(userId);

    // 5. Auto-generate default phases if none exist
    if (!phases || phases.length === 0) {
      console.log(`No phases found for user ${userId}, auto-generating default phases`);
      phases = await generateDefaultPhases(userId, user.programStartDate || new Date());
    }

    // 6. Compute progress metrics for each phase
    const phasesWithMetrics = await Promise.all(
      phases.map(async (phase) => {
        // Calculate completion percentage based on current date
        const completionPercentage = calculateCompletionPercentage(
          phase.startDate,
          phase.endDate
        );

        // Count completed product usage logs for this phase
        const completedProductsCount = await ProductUsage.countDocuments({
          userId: new mongoose.Types.ObjectId(userId),
          date: {
            $gte: phase.startDate,
            $lte: phase.endDate
          },
          isCompleted: true
        });

        // Count completed modality sessions within this phase's date range
        const completedModalitiesCount = await ModalitySession.countDocuments({
          userEmail: user.email, // ModalitySession uses email instead of userId
          date: {
            $gte: phase.startDate,
            $lte: phase.endDate
          },
          completed: true
        });

        // Return phase data formatted for frontend consumption
        return {
          phaseNumber: phase.phaseNumber,
          startDate: phase.startDate.toISOString().split('T')[0], // YYYY-MM-DD format
          endDate: phase.endDate.toISOString().split('T')[0],
          completionPercentage,
          completedProductsCount,
          completedModalitiesCount
        };
      })
    );

    // 7. Sort by phase number ascending (1 to 4)
    phasesWithMetrics.sort((a, b) => a.phaseNumber - b.phaseNumber);

    console.log(`Successfully fetched ${phasesWithMetrics.length} phases for user ${userId}`);
    return NextResponse.json(phasesWithMetrics);

  } catch (error) {
    console.error('Error in phases API:', {
      error: error.message,
      stack: error.stack,
      userId: session?.user?.id
    });

    return NextResponse.json(
      { error: 'Failed to fetch phases. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * Retrieves user phases from database
 * Since the current Phase schema doesn't include userId, we'll use user.programStartDate
 * to generate phases dynamically until the schema is updated
 */
async function getUserPhases(userId) {
  // For now, we'll return null to trigger auto-generation
  // This can be updated when Phase schema includes userId relationship
  return null;
}

/**
 * Generates 4 default phases for new users
 * Each phase spans 30 days, evenly distributed across 4 months
 */
async function generateDefaultPhases(userId, startDate) {
  const phases = [];
  const baseDate = new Date(startDate);

  const phaseDefinitions = [
    {
      phaseNumber: 1,
      name: "Preparation",
      description: "Initial preparation and baseline establishment.",
      affirmation: "I am preparing my body for complete bioelectric regeneration."
    },
    {
      phaseNumber: 2,
      name: "Detoxification",
      description: "Focus on removing environmental toxins and supporting liver function.",
      affirmation: "Every day my body releases toxins and grows healthier through bioelectric regeneration."
    },
    {
      phaseNumber: 3,
      name: "Mitochondrial Support",
      description: "Enhancing cellular energy production and mitochondrial health.",
      affirmation: "My cells are filled with energy and vitality, powering my complete regeneration."
    },
    {
      phaseNumber: 4,
      name: "Regeneration",
      description: "Focused regeneration using all modalities in combination.",
      affirmation: "My liver and colon are completely regenerating and returning to optimal health."
    }
  ];

  // Generate phases with 30-day intervals
  for (let i = 0; i < 4; i++) {
    const phaseStartDate = new Date(baseDate);
    phaseStartDate.setDate(baseDate.getDate() + (i * 30));

    const phaseEndDate = new Date(phaseStartDate);
    phaseEndDate.setDate(phaseStartDate.getDate() + 29); // 30-day phases

    phases.push({
      phaseNumber: phaseDefinitions[i].phaseNumber,
      name: phaseDefinitions[i].name,
      description: phaseDefinitions[i].description,
      startDate: phaseStartDate,
      endDate: phaseEndDate,
      affirmationText: phaseDefinitions[i].affirmation,
      isCompleted: false
    });
  }

  console.log(`Generated ${phases.length} default phases for user ${userId}`);
  return phases;
}

/**
 * Calculates completion percentage based on current date between start and end dates
 * Returns 0-100 percentage of phase completion
 */
function calculateCompletionPercentage(startDate, endDate) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  // If current date is before phase start, return 0%
  if (now < start) {
    return 0;
  }

  // If current date is after phase end, return 100%
  if (now > end) {
    return 100;
  }

  // Calculate percentage based on current position between start and end
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();

  return Math.round((elapsed / totalDuration) * 100);
}
