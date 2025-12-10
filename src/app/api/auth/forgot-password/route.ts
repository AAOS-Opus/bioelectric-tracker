import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/schema';
import { sign } from 'jsonwebtoken';
import { sendPasswordResetEmail } from '@/lib/email';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const RESET_TOKEN_EXPIRES = 3600; // 1 hour in seconds

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    await connectDB()
    const user = await User.findOne({ email })

    if (!user) {
      // Return success even if user not found to prevent user enumeration attacks
      return NextResponse.json({ 
        success: true,
        message: 'If your email is registered, you will receive a password reset link' 
      })
    }

    const resetToken = sign(
      { id: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: RESET_TOKEN_EXPIRES }
    )

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`
    
    // Send email with reset URL
    await sendPasswordResetEmail(email, resetUrl)

    return NextResponse.json({ 
      success: true,
      message: 'If your email is registered, you will receive a password reset link' 
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { message: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
