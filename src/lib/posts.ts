// Post queue data access (server-only, Prisma).
// Read queries take the signed-in admin's id and only see posts of that user's deals.
// TODO: scope the queue mutations below the same way.

import "server-only";
import type { Prisma, PostStatus as DbPostStatus } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { appDayRange, toAppDateTime } from "@/lib/format";
import type { Channel, Post, PostStatus } from "@/lib/types";

/** A post joined with the deal and channel it belongs to. */
export type QueuePost = Post & {
  dealId: string;
  dealTitle: string;
  imageUrl: string | null;
  channel: Channel;
};

const queueInclude = {
  deal: { select: { id: true, title: true, imageUrls: true } },
  channel: { select: { id: true, type: true, name: true, status: true, botUsername: true } },
} satisfies Prisma.PostInclude;

type QueueRow = Prisma.PostGetPayload<{ include: typeof queueInclude }>;

/**
 * The design has no "publishing" state: a post claimed by the worker is still shown
 * as waiting (it cannot be cancelled or re-queued meanwhile, see the actions below).
 */
export function toUiPostStatus(status: DbPostStatus): PostStatus {
  return status === "PUBLISHING" ? "PENDING" : status;
}

/** DB statuses shown under a UI status tab. */
function dbStatusesFor(status: PostStatus): DbPostStatus[] {
  return status === "PENDING" ? ["PENDING", "PUBLISHING"] : [status];
}

function toQueuePost(row: QueueRow): QueuePost {
  return {
    id: row.id,
    channelId: row.channelId,
    scheduledAt: toAppDateTime(row.scheduledAt),
    status: toUiPostStatus(row.status),
    errorMessage: row.errorMessage,
    dealId: row.deal.id,
    dealTitle: row.deal.title,
    imageUrl: row.deal.imageUrls[0] ?? null,
    channel: row.channel,
  };
}

/** Pending posts oldest-first (queue order); published/failed newest-first. */
export async function getPostsByStatus(ownerId: string, status: PostStatus): Promise<QueuePost[]> {
  const rows = await getDb().post.findMany({
    where: { deal: { ownerId }, status: { in: dbStatusesFor(status) } },
    include: queueInclude,
    orderBy: [{ scheduledAt: status === "PENDING" ? "asc" : "desc" }, { id: "asc" }],
  });
  return rows.map(toQueuePost);
}

export async function getPostCounts(ownerId: string): Promise<Record<PostStatus, number>> {
  const grouped = await getDb().post.groupBy({
    by: ["status"],
    where: { deal: { ownerId } },
    _count: { _all: true },
  });
  const counts: Record<PostStatus, number> = { PENDING: 0, PUBLISHED: 0, FAILED: 0 };
  for (const group of grouped) counts[toUiPostStatus(group.status)] += group._count._all;
  return counts;
}

/** All posts scheduled on an app-local date (YYYY-MM-DD), in time order. */
export async function getPostsOnDate(ownerId: string, date: string): Promise<QueuePost[]> {
  const { start, end } = appDayRange(date);
  const rows = await getDb().post.findMany({
    where: { deal: { ownerId }, scheduledAt: { gte: start, lt: end } },
    include: queueInclude,
    orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
  });
  return rows.map(toQueuePost);
}

/**
 * Puts failed posts back in the queue to be sent on the next queue check
 * (skips channels that were disconnected). Returns how many were re-queued.
 */
export async function requeueFailedPosts(postIds: string[] | "ALL"): Promise<number> {
  const { count } = await getDb().post.updateMany({
    where: {
      status: "FAILED",
      channel: { status: { not: "DISCONNECTED" } },
      ...(postIds !== "ALL" && { id: { in: postIds } }),
    },
    data: { status: "PENDING", scheduledAt: new Date(), errorMessage: null },
  });
  return count;
}

/** Moves a pending post to the front of the queue. Returns false if it is not pending. */
export async function queuePostNow(postId: string): Promise<boolean> {
  const { count } = await getDb().post.updateMany({
    where: { id: postId, status: "PENDING" },
    data: { scheduledAt: new Date() },
  });
  return count > 0;
}

/** Removes a pending post from the queue. Returns false if it is not pending. */
export async function cancelPendingPost(postId: string): Promise<boolean> {
  const { count } = await getDb().post.deleteMany({ where: { id: postId, status: "PENDING" } });
  return count > 0;
}
