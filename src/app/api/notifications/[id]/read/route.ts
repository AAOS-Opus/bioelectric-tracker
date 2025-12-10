import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { NextRequest } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    await connectDB()
    
    // Get Notification model directly
    const Notification = mongoose.model('Notification');
    
    const notification = await Notification.findOne({
      _id: id,
      userEmail: session.user.email
    })

    if (!notification) {
      return NextResponse.json(
        { message: 'Notification not found' },
        { status: 404 }
      )
    }

    notification.status = 'read'
    notification.readAt = new Date()
    await notification.save()

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { message: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
