import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import mongoose from 'mongoose'
import { connectDB } from './db'
import crypto from 'crypto'

/**
 * NextAuth.js Authentication Configuration
 *
 * Provides secure JWT-based authentication with comprehensive error logging,
 * session enrichment, and security validations for the Bioelectric Regeneration Tracker.
 *
 * Security Features:
 * - bcryptjs password hashing with 12 salt rounds
 * - JWT session strategy with secure token signing
 * - Comprehensive error logging with anonymized metadata
 * - Runtime environment validation
 * - Session payload enrichment with user metadata
 */

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development'
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET
const SALT_ROUNDS = 12 // Secure default for bcryptjs hashing

/**
 * Authentication error logging interface
 */
interface AuthErrorLog {
  timestamp: string
  event: 'login_attempt' | 'login_success' | 'login_failure'
  email?: string
  emailHash?: string
  error?: string
  errorType?: 'user_not_found' | 'incorrect_password' | 'database_error' | 'validation_error'
  userAgent?: string
  ipHash?: string
  sessionId?: string
  requestId?: string
}

/**
 * Security validation: Ensure NEXTAUTH_SECRET is configured
 * This prevents authentication vulnerabilities in production
 */
if (NODE_ENV === 'production' && !NEXTAUTH_SECRET) {
  throw new Error(
    '🚨 SECURITY ERROR: NEXTAUTH_SECRET is required in production environment. ' +
    'This secret is used for signing and verifying JWT tokens. ' +
    'Generate a secure secret: openssl rand -base64 32'
  )
}

if (!NEXTAUTH_SECRET && NODE_ENV !== 'test') {
  console.warn(
    '⚠️  WARNING: NEXTAUTH_SECRET is not set. Using fallback for development. ' +
    'Set NEXTAUTH_SECRET environment variable for production deployment.'
  )
}

/**
 * Hash sensitive data for logging (email addresses, IP addresses)
 * @param data - Sensitive data to hash
 * @returns SHA-256 hash of the data
 */
function hashSensitiveData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)
}

/**
 * Log authentication events with structured format and security considerations
 * @param logEntry - Authentication event to log
 */
function logAuthenticationEvent(logEntry: AuthErrorLog): void {
  // Ensure no sensitive data is logged
  const sanitizedLog: AuthErrorLog = {
    ...logEntry,
    // Hash email for privacy while maintaining uniqueness for debugging
    emailHash: logEntry.email ? hashSensitiveData(logEntry.email) : undefined,
    email: undefined, // Remove original email from logs
    // Truncate user agent to prevent log injection
    userAgent: logEntry.userAgent?.substring(0, 200),
    timestamp: new Date().toISOString()
  }

  if (NODE_ENV === 'development') {
    console.log('🔐 Auth Event:', JSON.stringify(sanitizedLog, null, 2))
  } else {
    // Production logging - structured JSON for log aggregation
    console.log(JSON.stringify(sanitizedLog))
  }
}

/**
 * Extract and anonymize request metadata for logging
 * @param req - Request object (if available)
 * @returns Anonymized request metadata
 */
function extractRequestMetadata(req?: any): Partial<AuthErrorLog> {
  if (!req) return {}

  return {
    userAgent: req.headers?.['user-agent'],
    ipHash: req.headers?.['x-forwarded-for']
      ? hashSensitiveData(req.headers['x-forwarded-for'])
      : req.connection?.remoteAddress
        ? hashSensitiveData(req.connection.remoteAddress)
        : undefined,
    requestId: req.headers?.['x-request-id'] || crypto.randomUUID()
  }
}

export const authOptions: NextAuthOptions = {
  /**
   * JWT Strategy Configuration
   * Uses JWT tokens for stateless authentication with secure signing
   */
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // 24 hours - refresh session daily
  },

  /**
   * Authentication Providers Configuration
   */
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'user@example.com'
        },
        password: {
          label: 'Password',
          type: 'password',
          placeholder: 'Enter your password'
        }
      },
      /**
       * Credentials authorization with comprehensive error handling and logging
       */
      async authorize(credentials, req) {
        const requestMetadata = extractRequestMetadata(req)
        const sessionId = crypto.randomUUID()

        try {
          // Input validation
          if (!credentials?.email || !credentials?.password) {
            logAuthenticationEvent({
              ...requestMetadata,
              event: 'login_failure',
              email: credentials?.email,
              errorType: 'validation_error',
              error: 'Missing email or password',
              sessionId
            })
            throw new Error('Invalid credentials - email and password are required')
          }

          // Email format validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(credentials.email)) {
            logAuthenticationEvent({
              ...requestMetadata,
              event: 'login_failure',
              email: credentials.email,
              errorType: 'validation_error',
              error: 'Invalid email format',
              sessionId
            })
            throw new Error('Invalid email format')
          }

          // Log login attempt
          logAuthenticationEvent({
            ...requestMetadata,
            event: 'login_attempt',
            email: credentials.email,
            sessionId
          })

          // Connect to database
          await connectDB()

          // Get User model with error handling
          const User = mongoose.models.User
          if (!User) {
            logAuthenticationEvent({
              ...requestMetadata,
              event: 'login_failure',
              email: credentials.email,
              errorType: 'database_error',
              error: 'User model not found',
              sessionId
            })
            throw new Error('Authentication system error')
          }

          // Find user by email
          const user = await User.findOne({
            email: credentials.email.toLowerCase().trim()
          })

          if (!user) {
            logAuthenticationEvent({
              ...requestMetadata,
              event: 'login_failure',
              email: credentials.email,
              errorType: 'user_not_found',
              error: 'User not found',
              sessionId
            })
            throw new Error('Invalid email or password')
          }

          // Verify password using bcrypt
          const isValid = await compare(credentials.password, user.password)
          if (!isValid) {
            logAuthenticationEvent({
              ...requestMetadata,
              event: 'login_failure',
              email: credentials.email,
              errorType: 'incorrect_password',
              error: 'Incorrect password',
              sessionId
            })
            throw new Error('Invalid email or password')
          }

          // Log successful authentication
          logAuthenticationEvent({
            ...requestMetadata,
            event: 'login_success',
            email: credentials.email,
            sessionId
          })

          // Return user data for session (exclude sensitive fields)
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            currentPhaseNumber: user.currentPhaseNumber,
            programStartDate: user.programStartDate,
            createdAt: user.createdAt
          }

        } catch (error) {
          // Handle unexpected errors
          if (!error.message.includes('Invalid email or password')) {
            logAuthenticationEvent({
              ...requestMetadata,
              event: 'login_failure',
              email: credentials?.email,
              errorType: 'database_error',
              error: error.message,
              sessionId
            })
          }
          throw error
        }
      }
    })
  ],

  /**
   * Callback Configuration for JWT and Session Management
   */
  callbacks: {
    /**
     * JWT Callback - Enriches JWT token with user metadata
     * Runs on every token access and refresh
     */
    async jwt({ token, user, account, profile, trigger }) {
      // On sign in, add user data to token
      if (user) {
        token.id = user.id
        token.currentPhaseNumber = user.currentPhaseNumber
        token.programStartDate = user.programStartDate
        token.createdAt = user.createdAt
        token.sessionCreated = Date.now()
      }

      // On token refresh, update timestamp
      if (trigger === 'update') {
        token.lastRefresh = Date.now()
      }

      return token
    },

    /**
     * Session Callback - Enriches session object with user metadata
     * Runs on every session access (client and server)
     */
    async session({ session, token, user }) {
      if (token) {
        // Add user metadata to session (available on client and server)
        session.user.id = token.id as string
        session.user.currentPhaseNumber = token.currentPhaseNumber as number
        session.user.programStartDate = token.programStartDate as Date
        session.user.createdAt = token.createdAt as Date

        // Add session metadata for debugging
        session.sessionCreated = token.sessionCreated as number
        session.lastRefresh = token.lastRefresh as number
      }

      return session
    },

    /**
     * Redirect Callback - Controls redirect behavior after authentication
     */
    async redirect({ url, baseUrl }) {
      // Allow same-origin redirects
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allow same-origin URLs
      if (new URL(url).origin === baseUrl) return url
      // Default redirect
      return baseUrl
    }
  },

  /**
   * Custom Pages Configuration
   */
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/register',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    signOut: '/auth/signout'
  },

  /**
   * Events Configuration for Additional Logging
   */
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      logAuthenticationEvent({
        event: 'login_success',
        email: user.email || undefined,
        sessionId: crypto.randomUUID()
      })
    },
    async signOut({ session, token }) {
      if (session?.user?.email) {
        logAuthenticationEvent({
          event: 'login_failure', // Using as logout event
          email: session.user.email,
          error: 'User signed out',
          sessionId: crypto.randomUUID()
        })
      }
    }
  },

  /**
   * Security Configuration
   */
  secret: NEXTAUTH_SECRET,

  /**
   * Development Configuration
   */
  debug: NODE_ENV === 'development',

  /**
   * Logger Configuration for NextAuth internal events
   */
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', { code, metadata })
    },
    warn(code) {
      if (NODE_ENV === 'development') {
        console.warn('NextAuth Warning:', code)
      }
    },
    debug(code, metadata) {
      if (NODE_ENV === 'development') {
        console.debug('NextAuth Debug:', { code, metadata })
      }
    }
  }
}
