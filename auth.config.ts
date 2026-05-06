import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      if (isLoggedIn && pathname === "/login") {
        return Response.redirect(new URL("/dashboard", request.url));
      }
      return isLoggedIn || pathname === "/login";
    },
  },
} satisfies NextAuthConfig;
