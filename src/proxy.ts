// Redirects signed-out visitors (and non-admins) from /dashboard/* to /login.
// This is only the first line of defence: pages and Server Actions check the
// session again with requireAdmin() (src/lib/auth-guard.ts).

import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: proxy } = NextAuth(authConfig);

export const config = {
  matcher: ["/dashboard/:path*"],
};
