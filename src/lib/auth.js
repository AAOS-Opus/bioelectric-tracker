import CredentialsProvider from 'next-auth/providers/credentials';

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
        // For development - accept any credentials
        if (credentials?.email && credentials?.password) {
          return {
            id: '507f1f77bcf86cd799439011',
            name: 'Test User',
            email: credentials.email,
            currentPhaseNumber: 2, // Default to Phase 2 for testing
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.currentPhaseNumber = user.currentPhaseNumber;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.currentPhaseNumber = token.currentPhaseNumber;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-development-secret',
  debug: process.env.NODE_ENV === 'development',
};
