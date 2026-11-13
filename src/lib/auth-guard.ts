// Session checks for Server Components and Server Actions.
// Call requireAdmin() at the top of EVERY Server Action: actions are public POST
// endpoints, so the proxy redirect alone is not enough.

import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

export type AdminUser = { id: string; name: string; email: string };

/** Returns the signed-in admin, or the admin from the session if it is still valid; null otherwise. */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  // Reading the session may refresh the cookie (random values): request time only.
  await connection();
  const session = await auth();
  const id = session?.user?.id;
  if (!id || session.user.role !== "ADMIN") return null;

  // The JWT stays valid until it expires, so re-check the account: a deleted or
  // demoted user must lose access right away.
  const user = await getDb().user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user || user.role !== "ADMIN") return null;
  return { id: user.id, name: user.name, email: user.email };
});

/** The signed-in admin; redirects to /login when there is none. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  return admin;
}

/** Keeps only an in-app /dashboard path from a callbackUrl (blocks open redirects). */
export function safeCallbackPath(callbackUrl: unknown): string {
  if (typeof callbackUrl !== "string") return "/dashboard";
  try {
    const url = new URL(callbackUrl, "http://localhost");
    const path = `${url.pathname}${url.search}`;
    return url.pathname === "/dashboard" || url.pathname.startsWith("/dashboard/") ? path : "/dashboard";
  } catch {
    return "/dashboard";
  }
}
