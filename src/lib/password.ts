// Password hashing (argon2id, OWASP-recommended defaults of @node-rs/argon2).
// Server-side only. Not marked "server-only" because the seed script (plain Node)
// also uses it; never import it from a client component.

import { hash, verify } from "@node-rs/argon2";

export function hashPassword(password: string) {
  return hash(password);
}

/** Constant-time check; returns false for a malformed hash instead of throwing. */
export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
