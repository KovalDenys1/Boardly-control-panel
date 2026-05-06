import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("[auth] missing credentials");
          return null;
        }
        if (!checkRateLimit(credentials.email as string)) {
          console.error("[auth] rate limit hit for", credentials.email);
          return null;
        }

        let user;
        try {
          user = await prisma.users.findUnique({
            where: { email: credentials.email as string },
            select: { id: true, email: true, username: true, role: true, passwordHash: true },
          });
        } catch (e) {
          console.error("[auth] db error:", e);
          return null;
        }

        if (!user) { console.error("[auth] user not found:", credentials.email); return null; }
        if (user.role !== "admin") { console.error("[auth] not admin, role:", user.role); return null; }
        if (!user.passwordHash) { console.error("[auth] no passwordHash for:", credentials.email); return null; }

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) { console.error("[auth] wrong password for:", credentials.email); return null; }

        return { id: user.id, email: user.email, name: user.username, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id                              = token.id as string;
        (session.user as { role?: string }).role     = token.role as string;
      }
      return session;
    },
  },
});
