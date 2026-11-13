// Auth.js settings shared by the full config (src/auth.ts) and the proxy (src/proxy.ts).
// Keep this file free of database and password-hashing imports: the proxy only
// needs to read the session cookie (a signed, encrypted JWT).

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  providers: [], // Added in src/auth.ts.
  callbacks: {
    /** Proxy check for /dashboard/*: only admins get through (others go to /login). */
    authorized({ auth }) {
      return auth?.user?.role === "ADMIN";
    },
    jwt({ token, user }) {
      // `user` is only present right after sign-in.
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
