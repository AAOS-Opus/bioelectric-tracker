import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { connectDB } from '@/lib/db'
import { User, Phase } from '@/models/schema'
import type { NextRequest } from 'next/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()
    const cleanEmail = email.toLowerCase().trim()


    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail })
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await User.create({
      name,
      email: cleanEmail,
      password: hashedPassword,
      programStartDate: new Date(),
      currentPhaseNumber: 1
    })

    // Initialize the 4 phases for the user
    const phases = [
      {
        phaseNumber: 1,
        name: 'Initial Detox',
        description: 'Focus on removing toxins and preparing the body',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        affirmationText: 'I am cleansing and preparing my body for healing',
        isCompleted: false
      },
      {
        phaseNumber: 2,
        name: 'Cellular Regeneration',
        description: 'Support mitochondrial function and cellular repair',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        affirmationText: 'My cells are regenerating and becoming stronger',
        isCompleted: false
      },
      {
        phaseNumber: 3,
        name: 'Energy Enhancement',
        description: 'Focus on increasing energy and vitality',
        startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        affirmationText: 'My energy is increasing day by day',
        isCompleted: false
      },
      {
        phaseNumber: 4,
        name: 'Maintenance',
        description: 'Maintain gains and continue optimization',
        startDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        affirmationText: 'I am maintaining optimal health and vitality',
        isCompleted: false
      }
    ]

    await Phase.insertMany(phases.map(phase => ({ ...phase, userId: user._id })))

    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Error creating user' },
      { status: 500 }
    )
  }
}
