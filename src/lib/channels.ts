// Channel data access (server-only, Prisma).
// Channel tokens are omitted from every query by default (see src/lib/db.ts) and
// must only ever be decrypted here, on the server.
// TODO: scope every query to the signed-in user's channels once auth exists.

import "server-only";
import { getDb } from "@/lib/db";
import { toAppDateTime } from "@/lib/format";
import { bioPageStatus } from "@/lib/sample-data/account";
import type { BioPageStatus, Channel } from "@/lib/types";

const channelSelect = { id: true, type: true, name: true, status: true, botUsername: true } as const;

/** Connected channels (excludes disconnected ones), oldest first. */
export async function getChannels(): Promise<Channel[]> {
  return getDb().channel.findMany({
    where: { status: { not: "DISCONNECTED" } },
    select: channelSelect,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
}

// TODO: move to a Bio settings table once Bio page settings are implemented.
export async function getBioPageStatus(): Promise<BioPageStatus> {
  return bioPageStatus;
}

/** Public Bio page address without protocol, e.g. "deals.example.com/bio". */
export function getBioUrl(): { label: string; href: string } {
  const site = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (!site) return { label: "[tên-miền]/bio", href: "/bio" };
  return { label: `${site.replace(/^https?:\/\//, "")}/bio`, href: `${site}/bio` };
}

/** Latest published post time ("YYYY-MM-DDTHH:mm") per channel id. */
export async function getLastPublishedAtByChannel(): Promise<Record<string, string>> {
  const grouped = await getDb().post.groupBy({
    by: ["channelId"],
    where: { status: "PUBLISHED" },
    _max: { scheduledAt: true },
  });
  const result: Record<string, string> = {};
  for (const group of grouped) {
    if (group._max.scheduledAt) result[group.channelId] = toAppDateTime(group._max.scheduledAt);
  }
  return result;
}

export async function renameChannel(channelId: string, name: string): Promise<boolean> {
  const { count } = await getDb().channel.updateMany({
    where: { id: channelId, status: { not: "DISCONNECTED" } },
    data: { name },
  });
  return count > 0;
}

/**
 * Disconnects a channel: deletes its stored token and cancels its pending posts.
 * The channel row is kept so published/failed history still shows its name.
 * Returns the number of cancelled posts, or null if the channel does not exist.
 */
export async function disconnectChannel(channelId: string): Promise<number | null> {
  return getDb().$transaction(async (tx) => {
    const { count } = await tx.channel.updateMany({
      where: { id: channelId, status: { not: "DISCONNECTED" } },
      data: { status: "DISCONNECTED", accessTokenEncrypted: null },
    });
    if (count === 0) return null;
    const cancelled = await tx.post.deleteMany({ where: { channelId, status: "PENDING" } });
    return cancelled.count;
  });
}
