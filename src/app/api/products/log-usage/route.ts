import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ProductUsage } from '@/models/schema';
import { isTestMode } from '@/lib/test-mode';

interface ProductUsageRequest {
  productId: string;
  date?: string;
  notes?: string;
  dosage?: string;
}

/**
 * POST /api/products/log-usage - Log product usage
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body: ProductUsageRequest = await request.json();

    if (!body.productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const usageDate = body.date ? new Date(body.date) : new Date();
    usageDate.setHours(0, 0, 0, 0);

    // TEST_MODE handling
    if (isTestMode()) {
      console.log('TEST_MODE: Logging product usage', body);

      // Simulate streak calculation
      const mockStreakDays = Math.floor(Math.random() * 7) + 1;
      const isMilestone = mockStreakDays % 7 === 0;

      return NextResponse.json({
        success: true,
        usage: {
          date: usageDate.toISOString().split('T')[0],
          productId: body.productId,
          status: 'completed'
        },
        streakDays: mockStreakDays,
        celebration: isMilestone ? {
          type: 'milestone',
          message: `Amazing! You've completed ${mockStreakDays} days in a row!`,
          value: mockStreakDays
        } : undefined
      });
    }

    // Connect to database
    await connectDB();

    // Check if usage already exists for today
    const existingUsage = await ProductUsage.findOne({
      userId: session.user.id,
      productId: body.productId,
      date: usageDate
    });

    if (existingUsage) {
      // Update existing record
      existingUsage.isCompleted = true;
      existingUsage.status = 'completed';
      await existingUsage.save();
    } else {
      // Create new usage record
      await ProductUsage.create({
        userId: session.user.id,
        productId: body.productId,
        date: usageDate,
        timestamp: new Date(),
        status: 'completed',
        isCompleted: true
      });
    }

    // Calculate streak
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsage = await ProductUsage.find({
      userId: session.user.id,
      productId: body.productId,
      date: { $gte: thirtyDaysAgo },
      isCompleted: true
    }).sort({ date: -1 }).lean();

    // Calculate streak days
    let streakDays = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const usage of recentUsage) {
      const usageRecordDate = new Date(usage.date);
      usageRecordDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((currentDate.getTime() - usageRecordDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        streakDays++;
        currentDate = usageRecordDate;
      } else {
        break;
      }
    }

    // Check for celebration milestones
    let celebration;
    if (streakDays === 7) {
      celebration = {
        type: 'streak' as const,
        message: 'One week streak! Keep up the great work!',
        value: 7
      };
    } else if (streakDays === 30) {
      celebration = {
        type: 'milestone' as const,
        message: 'Incredible! One month of consistent usage!',
        value: 30
      };
    } else if (streakDays === 100) {
      celebration = {
        type: 'milestone' as const,
        message: 'Legendary! 100 days of dedication!',
        value: 100
      };
    }

    console.log(`Product usage logged for user ${session.user.email}: ${body.productId}, streak: ${streakDays}`);

    return NextResponse.json({
      success: true,
      usage: {
        date: usageDate.toISOString().split('T')[0],
        productId: body.productId,
        status: 'completed'
      },
      streakDays,
      celebration
    });

  } catch (error) {
    console.error('Error logging product usage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log product usage' },
      { status: 500 }
    );
  }
}
