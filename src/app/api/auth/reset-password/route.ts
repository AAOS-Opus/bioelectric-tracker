import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/schema';
import { hash } from 'bcryptjs';
import { verify } from 'jsonwebtoken';
import type { NextRequest } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify token
    let decoded: any
    try {
      decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find user
    const user = await User.findById(decoded.id)
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await hash(password, 12)

    // Update user password
    user.password = hashedPassword
    await user.save()

    return NextResponse.json({ message: 'Password reset successful' })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { message: 'Error resetting password' },
      { status: 500 }
    )
  }
}
