// Channel data access. Server-only.
// Currently reads and mutates the in-memory sample data (changes last until the
// server restarts). Swap the bodies for database queries later, keeping the signatures.
// Channel tokens must only ever be read here (server side), encrypted at rest.

import "server-only";
import { bioPageStatus, channels as sampleChannels, deals as sampleDeals } from "@/lib/sample-data/dashboard";
import type { BioPageStatus, Channel } from "@/lib/types";

/** Connected channels (excludes disconnected ones). */
export async function getChannels(): Promise<Channel[]> {
  return sampleChannels.filter((c) => c.status !== "DISCONNECTED");
}

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
  const result: Record<string, string> = {};
  for (const deal of sampleDeals) {
    for (const post of deal.posts) {
      if (post.status !== "PUBLISHED") continue;
      const current = result[post.channelId];
      if (!current || post.scheduledAt > current) result[post.channelId] = post.scheduledAt;
    }
  }
  return result;
}

function findConnected(channelId: string) {
  return sampleChannels.find((c) => c.id === channelId && c.status !== "DISCONNECTED");
}

export async function renameChannel(channelId: string, name: string): Promise<boolean> {
  const channel = findConnected(channelId);
  if (!channel) return false;
  channel.name = name;
  return true;
}

/**
 * Disconnects a channel (TODO: delete its encrypted token) and cancels its pending
 * posts. The channel row is kept so published/failed history still shows its name.
 * Returns the number of cancelled posts, or null if the channel does not exist.
 */
export async function disconnectChannel(channelId: string): Promise<number | null> {
  const channel = findConnected(channelId);
  if (!channel) return null;
  channel.status = "DISCONNECTED";
  let cancelled = 0;
  for (const deal of sampleDeals) {
    const before = deal.posts.length;
    deal.posts = deal.posts.filter((p) => !(p.channelId === channelId && p.status === "PENDING"));
    cancelled += before - deal.posts.length;
  }
  return cancelled;
}
