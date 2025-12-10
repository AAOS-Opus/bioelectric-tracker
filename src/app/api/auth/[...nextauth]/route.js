import NextAuth from 'next-auth';
import { authOptions } from '../../../../lib/auth';

// Log configuration on initialization
console.log('Initializing NextAuth handler with shared config');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
