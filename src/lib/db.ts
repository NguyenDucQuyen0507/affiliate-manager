// Shared Prisma client (server-only). Prisma 7 connects through a driver adapter.

import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set (see .env.example)");
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    // Channel tokens must never reach the UI: leave them out of every query unless a
    // caller explicitly opts in with `omit: { accessTokenEncrypted: false }`.
    omit: { channel: { accessTokenEncrypted: true } },
  });
}

type Db = ReturnType<typeof createClient>;

// Reuse one client across hot reloads in development (each reload would otherwise
// open a new connection pool). After `prisma generate` the PrismaClient class
// changes, so the cached client is replaced instead of running with a stale schema.
const globalForDb = globalThis as unknown as { __prismaDb?: { client: Db; ctor: unknown } };

/** Lazily created so builds without DATABASE_URL don't fail at import time. */
export function getDb(): Db {
  const cached = globalForDb.__prismaDb;
  if (cached?.ctor === PrismaClient) return cached.client;
  if (cached) void cached.client.$disconnect();
  const client = createClient();
  globalForDb.__prismaDb = { client, ctor: PrismaClient };
  return client;
}
