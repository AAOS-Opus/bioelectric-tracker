import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { NextRequest } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    await connectDB()
    
    // Get NotificationSettings model directly
    const NotificationSettings = mongoose.model('NotificationSettings');
    
    let settings = await NotificationSettings.findOne({
      userEmail: session.user.email
    })

    // Create default settings if none exist
    if (!settings) {
      settings = await NotificationSettings.create({
        userEmail: session.user.email,
        dailyReminders: true,
        modalityAlerts: true,
        weeklyReports: true,
        channels: {
          email: true,
          sms: false,
          inApp: true
        },
        preferredTime: '09:00',
        timezone: 'America/New_York'
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { message: 'Failed to fetch notification settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const data = await request.json()
    await connectDB()
    
    // Get NotificationSettings model directly
    const NotificationSettings = mongoose.model('NotificationSettings');

    const settings = await NotificationSettings.findOneAndUpdate(
      { userEmail: session.user.email },
      { ...data },
      { new: true, upsert: true }
    )

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json(
      { message: 'Failed to update notification settings' },
      { status: 500 }
    )
  }
}
