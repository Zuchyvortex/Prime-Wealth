import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const cleanEmail = credentials.email.trim().toLowerCase();

          // Resilient user query with automatic single-retry for cold database connections
          let user = null;
          try {
            user = await prisma.user.findUnique({
              where: { email: cleanEmail },
            });
          } catch (dbErr) {
            console.warn("[Auth] DB lookup retry attempt due to initial connection pause:", dbErr);
            user = await prisma.user.findUnique({
              where: { email: cleanEmail },
            });
          }

          if (!user || !user.password) {
            console.warn(`[Auth] Authentication failed: User not found for email '${cleanEmail}'`);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.warn(`[Auth] Authentication failed: Password mismatch for email '${cleanEmail}'`);
            return null;
          }

          if (user.status === "suspended") {
            throw new Error("AccountSuspended");
          }

          console.log(`[Auth] Successful login for user: ${user.email} (Role: ${user.role})`);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            tier: user.tier,
            avatar: user.avatar as string,
          };
        } catch (error: unknown) {
          if (error instanceof Error && error.message === "AccountSuspended") {
            throw error;
          }
          console.error("[Auth] Exception during authorize():", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.tier = user.tier;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
        session.user.tier = token.tier as string;
        session.user.avatar = token.avatar as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "a9f3e2c817b6d04158f2a7e390c4b51d6e8f072394a1c5b8d2e07f316a9b4c85",
};
