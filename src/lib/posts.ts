// Post queue data access. Server-only.
// Currently reads and mutates the in-memory sample data (changes last until the
// server restarts). Swap the bodies for database queries later, keeping the signatures.

import "server-only";
import { nowInAppTimeZone } from "@/lib/format";
import { channels as sampleChannels, deals as sampleDeals } from "@/lib/sample-data/dashboard";
import type { Channel, Post, PostStatus } from "@/lib/types";

/** A post joined with the deal and channel it belongs to. */
export type QueuePost = Post & {
  dealId: string;
  dealTitle: string;
  thumbnailColor: string;
  channel: Channel;
};

function allPosts(): QueuePost[] {
  const channelById = new Map(sampleChannels.map((c) => [c.id, c]));
  return sampleDeals.flatMap((deal) =>
    deal.posts.flatMap((post) => {
      const channel = channelById.get(post.channelId);
      if (!channel) return [];
      return [{ ...post, dealId: deal.id, dealTitle: deal.title, thumbnailColor: deal.thumbnailColor, channel }];
    }),
  );
}

const byTimeAsc = (a: QueuePost, b: QueuePost) => a.scheduledAt.localeCompare(b.scheduledAt);
const byTimeDesc = (a: QueuePost, b: QueuePost) => b.scheduledAt.localeCompare(a.scheduledAt);

/** Pending posts oldest-first (queue order); published/failed newest-first. */
export async function getPostsByStatus(status: PostStatus): Promise<QueuePost[]> {
  return allPosts()
    .filter((post) => post.status === status)
    .sort(status === "PENDING" ? byTimeAsc : byTimeDesc);
}

export async function getPostCounts(): Promise<Record<PostStatus, number>> {
  const counts: Record<PostStatus, number> = { PENDING: 0, PUBLISHED: 0, FAILED: 0 };
  for (const post of allPosts()) counts[post.status] += 1;
  return counts;
}

/** All posts scheduled on a date (YYYY-MM-DD), in time order. */
export async function getPostsOnDate(date: string): Promise<QueuePost[]> {
  return allPosts()
    .filter((post) => post.scheduledAt.startsWith(date))
    .sort(byTimeAsc);
}

function findPost(postId: string) {
  for (const deal of sampleDeals) {
    const post = deal.posts.find((p) => p.id === postId);
    if (post) return { deal, post };
  }
  return null;
}

/**
 * Puts failed posts back in the queue to be sent on the next queue check.
 * Returns how many posts were re-queued.
 */
export async function requeueFailedPosts(postIds: string[] | "ALL"): Promise<number> {
  const now = nowInAppTimeZone().dateTime;
  const disconnected = new Set(
    sampleChannels.filter((c) => c.status === "DISCONNECTED").map((c) => c.id),
  );
  let count = 0;
  for (const deal of sampleDeals) {
    for (const post of deal.posts) {
      if (post.status !== "FAILED" || disconnected.has(post.channelId)) continue;
      if (postIds !== "ALL" && !postIds.includes(post.id)) continue;
      post.status = "PENDING";
      post.scheduledAt = now;
      post.errorReason = null;
      count += 1;
    }
  }
  return count;
}

/** Moves a pending post to the front of the queue. Returns false if it is not pending. */
export async function queuePostNow(postId: string): Promise<boolean> {
  const found = findPost(postId);
  if (!found || found.post.status !== "PENDING") return false;
  found.post.scheduledAt = nowInAppTimeZone().dateTime;
  return true;
}

/** Removes a pending post from the queue. Returns false if it is not pending. */
export async function cancelPendingPost(postId: string): Promise<boolean> {
  const found = findPost(postId);
  if (!found || found.post.status !== "PENDING") return false;
  found.deal.posts = found.deal.posts.filter((p) => p.id !== postId);
  return true;
}
