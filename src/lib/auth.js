import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from './db';
import { User } from '../models/schema';
import { isTestMode } from './test-mode';

// Authentication options for NextAuth
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // TEST_MODE: Accept any credentials for development
        if (isTestMode()) {
          console.log('TEST_MODE: Bypassing authentication');
          return {
            id: 'test-user-id',
            name: 'Test User',
            email: credentials.email,
            currentPhaseNumber: 2,
            onboardingComplete: true,
          };
        }

        try {
          // Connect to database
          await connectDB();

          // Find user by email
          const user = await User.findOne({ email: credentials.email.toLowerCase() });

          if (!user) {
            // User not found - they need to complete onboarding first
            // Return a temporary user object to allow them to proceed to onboarding
            return {
              id: 'new-user',
              name: '',
              email: credentials.email.toLowerCase(),
              currentPhaseNumber: 1,
              onboardingComplete: false,
            };
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);

          if (!isValidPassword) {
            console.log('Invalid password for user:', credentials.email);
            return null;
          }

          // Return user data
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            currentPhaseNumber: user.currentPhaseNumber || 1,
            onboardingComplete: user.onboardingComplete ?? true,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          // Fallback for database errors - allow login for development
          if (process.env.NODE_ENV === 'development') {
            return {
              id: 'fallback-user',
              name: 'Development User',
              email: credentials.email,
              currentPhaseNumber: 1,
              onboardingComplete: false,
            };
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.currentPhaseNumber = user.currentPhaseNumber;
        token.onboardingComplete = user.onboardingComplete;
      }

      // Handle session updates (e.g., after onboarding completion)
      if (trigger === 'update' && session) {
        if (session.user?.name) token.name = session.user.name;
        if (session.user?.currentPhaseNumber) token.currentPhaseNumber = session.user.currentPhaseNumber;
        if (session.user?.onboardingComplete !== undefined) token.onboardingComplete = session.user.onboardingComplete;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.currentPhaseNumber = token.currentPhaseNumber;
        session.user.onboardingComplete = token.onboardingComplete;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    newUser: '/onboarding', // Redirect new users to onboarding
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-development-secret',
  debug: process.env.NODE_ENV === 'development',
};
