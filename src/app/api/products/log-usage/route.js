import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { connectDB } from '../../../../lib/db';
import { User, Product, ProductUsage, Notification } from '../../../../models/schema';
import mongoose from 'mongoose';

/**
 * Production-grade product usage logging endpoint
 * Logs user's completion of a product and manages compliance streaks
 */
export async function POST(request) {
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
    const currentPhaseNumber = session.user.currentPhaseNumber;

    console.log(`Logging product usage for user: ${userId}`);

    // 2. Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { productId, completedAt } = requestBody;

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    // 3. Database Connection
    dbConnection = await connectDB();

    // 4. Validate productId exists and is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: 'Invalid productId format' },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // 5. Confirm product is assigned to user's current phase
    if (!product.phaseNumbers.includes(currentPhaseNumber)) {
      return NextResponse.json(
        { error: 'Product is not assigned to your current phase' },
        { status: 403 }
      );
    }

    // 6. Setup timestamp - use provided completedAt or current time (UTC normalized)
    const timestamp = completedAt ? new Date(completedAt) : new Date();
    if (isNaN(timestamp.getTime())) {
      return NextResponse.json(
        { error: 'Invalid completedAt timestamp format' },
        { status: 400 }
      );
    }

    // 7. Get today's date for duplicate detection (use UTC midnight)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    // 8. Duplicate usage detection - check if already logged today
    const existingUsage = await ProductUsage.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
      date: {
        $gte: today,
        $lt: tomorrow
      },
      status: 'completed'
    });

    if (existingUsage) {
      return NextResponse.json(
        { error: 'Product usage already logged for today' },
        { status: 409 } // Conflict
      );
    }

    // 9. Create ProductUsage record
    const newUsage = new ProductUsage({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
      date: today, // Store as UTC date for consistent querying
      timestamp: timestamp,
      status: 'completed',
      isCompleted: true
    });

    const savedUsage = await newUsage.save();
    console.log(`Product usage logged: ${productId} for user ${userId}`);

    // 10. Calculate compliance streak
    const { streakCount, streakCelebrationTriggered } = await updateComplianceStreak(
      userId,
      currentPhaseNumber,
      today
    );

    // 11. Format response with clean data (no internal IDs)
    const responseData = {
      usage: {
        _id: savedUsage._id.toString(),
        timestamp: savedUsage.timestamp.toISOString(),
        status: savedUsage.status
      },
      streakCount,
      streakCelebrationTriggered
    };

    console.log(`Product usage logged successfully for user ${userId}:`, {
      productId,
      streakCount,
      celebration: streakCelebrationTriggered
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error in products/log-usage API:', {
      error: error.message,
      stack: error.stack,
      userId: session?.user?.id
    });

    return NextResponse.json(
      { error: 'Failed to log product usage. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * Updates user's compliance streak based on product completion
 * Calculates consecutive days with all assigned products completed
 */
async function updateComplianceStreak(userId, currentPhaseNumber, targetDate) {
  try {
    // Get all products assigned to current phase
    const assignedProducts = await Product.find({
      phaseNumbers: currentPhaseNumber
    }).select('_id');

    const assignedProductIds = assignedProducts.map(p => p._id);

    if (assignedProductIds.length === 0) {
      return { streakCount: 0, streakCelebrationTriggered: false };
    }

    // Check if all products for today are now completed
    const todayStart = new Date(targetDate);
    const todayEnd = new Date(targetDate);
    todayEnd.setUTCDate(todayStart.getUTCDate() + 1);

    const completedTodayCount = await ProductUsage.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      productId: { $in: assignedProductIds },
      date: {
        $gte: todayStart,
        $lt: todayEnd
      },
      status: 'completed'
    });

    const allProductsCompletedToday = completedTodayCount === assignedProductIds.length;
    let streakCelebrationTriggered = false;

    if (allProductsCompletedToday) {
      // Calculate consecutive streak by checking backwards from today
      let streakDays = 0;
      let checkDate = new Date(targetDate);

      // Count consecutive days with all products completed
      while (true) {
        const dayStart = new Date(checkDate);
        const dayEnd = new Date(checkDate);
        dayEnd.setUTCDate(dayStart.getUTCDate() + 1);

        const completedThisDayCount = await ProductUsage.countDocuments({
          userId: new mongoose.Types.ObjectId(userId),
          productId: { $in: assignedProductIds },
          date: {
            $gte: dayStart,
            $lt: dayEnd
          },
          status: 'completed'
        });

        if (completedThisDayCount === assignedProductIds.length) {
          streakDays++;
          // Move to previous day
          checkDate.setUTCDate(checkDate.getUTCDate() - 1);
        } else {
          break; // Streak broken
        }

        // Prevent infinite loop - limit to reasonable timeframe
        if (streakDays > 365) break;
      }

      // Update user's compliance streak
      await User.findByIdAndUpdate(userId, {
        complianceStreak: streakDays
      });

      // Trigger celebration notification if just completed today's set
      if (streakDays > 0) {
        await createCelebrationNotification(userId, streakDays);
        streakCelebrationTriggered = true;
      }

      return { streakCount: streakDays, streakCelebrationTriggered };
    } else {
      // Not all products completed today - return current streak from DB
      const user = await User.findById(userId).select('complianceStreak');
      return {
        streakCount: user?.complianceStreak || 0,
        streakCelebrationTriggered: false
      };
    }

  } catch (error) {
    console.error('Error updating compliance streak:', error);
    return { streakCount: 0, streakCelebrationTriggered: false };
  }
}

/**
 * Creates a celebration notification when user completes daily product set
 */
async function createCelebrationNotification(userId, streakCount) {
  try {
    // Get user email for notification
    const user = await User.findById(userId).select('email');
    if (!user) return;

    const notification = new Notification({
      userEmail: user.email,
      type: 'streak-celebration',
      title: '🎉 Daily Products Completed!',
      message: `You've completed all your products for today! Current streak: ${streakCount} ${streakCount === 1 ? 'day' : 'days'}`,
      status: 'pending',
      priority: 'medium',
      category: 'progress',
      scheduledFor: new Date(),
      metadata: {
        achievementType: 'streak',
        streakCount: streakCount
      },
      style: {
        icon: '🎉',
        color: '#10B981' // Success green
      }
    });

    await notification.save();
    console.log(`Celebration notification created for user ${userId}, streak: ${streakCount}`);

  } catch (error) {
    console.error('Error creating celebration notification:', error);
    // Don't throw - notification failure shouldn't break the main flow
  }
}
