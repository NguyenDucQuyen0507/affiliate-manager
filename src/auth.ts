// Auth.js (next-auth v5): admin sign-in with email + password, JWT sessions, no adapter.

import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { getDb } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

// Verified against when the email is unknown, so a wrong email takes as long as a
// wrong password and response times do not reveal which accounts exist.
let dummyHash: Promise<string> | undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await getDb().user.findUnique({
          where: { email },
          select: { id: true, name: true, email: true, role: true, passwordHash: true },
        });
        if (!user) {
          dummyHash ??= hashPassword("timing-equalizer-not-a-real-password");
          await verifyPassword(await dummyHash, password);
          return null;
        }
        // Only admins may use the dashboard. Same generic failure as a wrong password.
        if (!(await verifyPassword(user.passwordHash, password)) || user.role !== "ADMIN") return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
