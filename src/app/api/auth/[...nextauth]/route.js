// app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { findUserByEmail, verifyPassword } from '@/lib/userService';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        try {
          const user = await findUserByEmail(credentials.email);

          if (!user) {
            throw new Error('No user found with this email.');
          }

          const isValid = await verifyPassword(credentials.password, user.password);
          if (!isValid) {
            throw new Error('Invalid password.');
          }

          // Crucial check: if the user is a student, ensure they are approved.
          if (user.role === 'student' && !user.isApproved) {
            throw new Error('Your account is pending admin approval.');
          }

          // Check for educator approval as well
          if (user.role === 'educator' && !user.isApproved) {
            throw new Error('Your educator account is pending admin approval.');
          }

          return {
            id: user.id,
            name: user.firstName,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          throw new Error(error.message);
        }
      },
    }),
  ],
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.uid = user.id; // Map id to uid for Firestore compatibility
        token.sub = user.id; // Standard JWT subject claim
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.uid = token.uid; // Add uid property for Firestore rules
      session.user.role = token.role;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
