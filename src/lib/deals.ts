// Deal data access (server-only, Prisma).
// Every function takes the signed-in admin's id (from requireAdmin(), never from the
// client) and only reads or writes that user's deals.

import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { DEALS_PAGE_SIZE, type DealFilters, type DealStatusFilter } from "@/lib/deal-filters";
import type { DealFormValues } from "@/lib/deal-schema";
import { addDays, fromAppDateTime, fromDateKey, toAppDateTime, toDateKey, todayKey } from "@/lib/format";
import { BIO_LABEL, channelTypeLabel, detectMarketplace } from "@/lib/labels";
import { toUiPostStatus } from "@/lib/posts";
import { buildDealSearchText } from "@/lib/search-text";
import type { ChannelType, Deal, DealStatus } from "@/lib/types";

const dealWithPosts = {
  posts: { orderBy: { scheduledAt: "asc" } },
} satisfies Prisma.DealInclude;

type DealRow = Prisma.DealGetPayload<{ include: typeof dealWithPosts }>;

/** Today in Vietnam as a value comparable with the Deal.expiresAt DATE column. */
function appToday() {
  return fromDateKey(todayKey());
}

/**
 * Status shown in the UI. "Hết hạn" follows the expiry date, not only the stored
 * status: an active deal whose expiresAt is before today (Vietnam time) is expired.
 * Drafts stay drafts until they are scheduled.
 */
function effectiveStatus(status: DealStatus, expiresAt: Date | null, today: Date): DealStatus {
  return status === "ACTIVE" && expiresAt !== null && expiresAt < today ? "EXPIRED" : status;
}

/** Same rule as effectiveStatus(), as a database filter. */
function statusWhere(status: DealStatus, today: Date): Prisma.DealWhereInput {
  switch (status) {
    case "ACTIVE":
      return { status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gte: today } }] };
    case "EXPIRED":
      return { OR: [{ status: "EXPIRED" }, { status: "ACTIVE", expiresAt: { lt: today } }] };
    case "DRAFT":
      return { status: "DRAFT" };
  }
}

/** Prisma row → UI domain type. */
function toDeal(row: DealRow, today: Date): Deal {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    marketplace: row.marketplace,
    affiliateUrl: row.affiliateUrl,
    imageUrls: row.imageUrls,
    price: row.price,
    originalPrice: row.originalPrice,
    priceCheckedAt: row.priceCheckedAt ? toAppDateTime(row.priceCheckedAt) : null,
    searchCode: row.searchCode,
    expiresAt: row.expiresAt ? toDateKey(row.expiresAt) : null,
    caption: row.caption,
    showOnBio: row.showOnBio,
    note: row.note,
    isFeatured: row.isFeatured,
    status: effectiveStatus(row.status, row.expiresAt, today),
    posts: row.posts.map((post) => ({
      id: post.id,
      channelId: post.channelId,
      scheduledAt: toAppDateTime(post.scheduledAt),
      status: toUiPostStatus(post.status),
      errorMessage: post.errorMessage,
    })),
  };
}

/** A deal row for the list page, with its channel names already resolved. */
export type DealListItem = Deal & { channelLabels: string[] };

export type DealQueryResult = {
  deals: DealListItem[];
  /** Count per status tab, after applying search and marketplace filters. */
  counts: Record<DealStatusFilter, number>;
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
};

const CHANNEL_ORDER: ChannelType[] = ["FACEBOOK", "TELEGRAM"];

/** "Facebook, Telegram, Bio" style labels: one per channel type, plus Bio. */
function channelLabels(types: ChannelType[], showOnBio: boolean) {
  const labels = CHANNEL_ORDER.filter((type) => types.includes(type)).map(
    (type) => channelTypeLabel[type],
  );
  if (showOnBio) labels.push(BIO_LABEL);
  return labels;
}

const STATUSES: DealStatus[] = ["ACTIVE", "DRAFT", "EXPIRED"];

export async function queryDeals(ownerId: string, filters: DealFilters): Promise<DealQueryResult> {
  const db = getDb();
  const today = appToday();
  // Same normalisation as the stored Deal.searchText (no diacritics, lowercase).
  const q = buildDealSearchText(filters.q, null);

  // Owner + search + marketplace apply to every tab; the status tab narrows the list.
  const base: Prisma.DealWhereInput = {
    ownerId,
    ...(filters.marketplace !== "ALL" && { marketplace: filters.marketplace }),
    ...(q && { searchText: { contains: q } }),
  };

  // The three statuses split the deals with no overlap, so "Tất cả" is their sum.
  const statusCounts = await Promise.all(
    STATUSES.map((status) => db.deal.count({ where: { AND: [base, statusWhere(status, today)] } })),
  );
  const counts: Record<DealStatusFilter, number> = { ALL: 0, ACTIVE: 0, DRAFT: 0, EXPIRED: 0 };
  STATUSES.forEach((status, index) => {
    counts[status] = statusCounts[index];
    counts.ALL += statusCounts[index];
  });

  const total = counts[filters.status];
  const pageCount = Math.max(1, Math.ceil(total / DEALS_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);

  const rows = await db.deal.findMany({
    where: filters.status === "ALL" ? base : { AND: [base, statusWhere(filters.status, today)] },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * DEALS_PAGE_SIZE,
    take: DEALS_PAGE_SIZE,
    include: { posts: { orderBy: { scheduledAt: "asc" }, include: { channel: { select: { type: true } } } } },
  });

  return {
    deals: rows.map((row) => ({
      ...toDeal(row, today),
      channelLabels: channelLabels(
        row.posts.map((post) => post.channel.type),
        row.showOnBio,
      ),
    })),
    counts,
    total,
    page,
    pageCount,
    pageSize: DEALS_PAGE_SIZE,
  };
}

/** The deal if it exists and belongs to `ownerId`; null otherwise (show a 404). */
export async function getDealById(ownerId: string, id: string): Promise<Deal | null> {
  const row = await getDb().deal.findFirst({ where: { id, ownerId }, include: dealWithPosts });
  return row ? toDeal(row, appToday()) : null;
}

/** Active (not expired) deal count, and how many of them expire between today and Sunday. */
export async function getDealStats(ownerId: string, today: string) {
  const [y, m, d] = today.split("-").map(Number);
  const daysToSunday = (7 - new Date(Date.UTC(y, m - 1, d)).getUTCDay()) % 7;
  const db = getDb();

  const [active, expiringThisWeek] = await Promise.all([
    db.deal.count({ where: { ownerId, ...statusWhere("ACTIVE", fromDateKey(today)) } }),
    db.deal.count({
      where: {
        ownerId,
        status: "ACTIVE",
        expiresAt: { gte: fromDateKey(today), lte: fromDateKey(addDays(today, daysToSunday)) },
      },
    }),
  ]);
  return { active, expiringThisWeek };
}

/** Categories already used by the owner's deals, for the editor's suggestions. */
export async function getDealCategories(ownerId: string): Promise<string[]> {
  const rows = await getDb().deal.findMany({
    where: { ownerId, category: { not: "" } },
    distinct: ["category"],
    select: { category: true },
  });
  return rows.map((row) => row.category).sort((a, b) => a.localeCompare(b, "vi"));
}

export type SaveDealOutcome =
  | { ok: true; dealId: string; /** Posts queued to go out now ("publish" only). */ publishedNow: number }
  | { ok: false; reason: "DEAL_NOT_FOUND" | "CHANNEL_UNAVAILABLE" };

type Tx = Prisma.TransactionClient;

/** Posts in these states have not gone out yet, so the editor may move or remove them. */
const OPEN_POST_STATUSES = ["PENDING", "FAILED"] as const;

export function createDealRecord(ownerId: string, values: DealFormValues, imageUrls: string[]) {
  return writeDeal(ownerId, null, values, imageUrls);
}

/** Updates a deal owned by `ownerId` (DEAL_NOT_FOUND otherwise). Recomputes searchText. */
export function updateDealRecord(
  ownerId: string,
  dealId: string,
  values: DealFormValues,
  imageUrls: string[],
) {
  return writeDeal(ownerId, dealId, values, imageUrls);
}

/**
 * Writes a deal from validated editor values. Callers must have checked the session
 * (requireAdmin) and pass the admin's id; new deals belong to that admin.
 * "draft" keeps the deal off every channel: its unsent posts are removed.
 * "schedule" activates it and makes the unsent posts match the chosen channels/times.
 * "publish" is "schedule" with every chosen channel set to now, so the queue sends
 * them first (same as "Đăng ngay" on the schedule page).
 * Posts already published or being published are never touched.
 * priceCheckedAt is set whenever the price or original price changes.
 */
async function writeDeal(
  ownerId: string,
  dealId: string | null,
  values: DealFormValues,
  imageUrls: string[],
): Promise<SaveDealOutcome> {
  const schedule = values.intent !== "draft";
  const publishNow = values.intent === "publish";
  const now = new Date();
  const searchCode = values.searchCode || null;
  const data = {
    title: values.title,
    category: values.category,
    marketplace: detectMarketplace(values.affiliateUrl),
    affiliateUrl: values.affiliateUrl,
    imageUrls,
    price: values.price,
    originalPrice: values.originalPrice,
    searchCode,
    expiresAt: values.expiresAt ? fromDateKey(values.expiresAt) : null,
    caption: values.caption,
    showOnBio: values.showOnBio,
    note: values.note,
    // "Deal hôm nay" is a section of the Bio page, so it needs the deal on Bio.
    isFeatured: values.showOnBio && values.isFeatured,
    status: schedule ? "ACTIVE" : "DRAFT",
    searchText: buildDealSearchText(values.title, searchCode),
  } satisfies Prisma.DealUncheckedUpdateInput;

  // channelId → new time.
  const wanted = new Map<string, Date>();
  const untouched = new Set<string>();
  if (schedule) {
    for (const target of values.targets) {
      if (!target.enabled) continue;
      // A locked target was already published: leave that channel as it is.
      if (target.locked) untouched.add(target.channelId);
      else if (publishNow) wanted.set(target.channelId, now);
      else if (target.scheduledAt) wanted.set(target.channelId, fromAppDateTime(target.scheduledAt));
      else untouched.add(target.channelId);
    }
  }

  return getDb().$transaction(async (tx) => {
    if (wanted.size > 0) {
      const usable = await tx.channel.count({
        where: { id: { in: [...wanted.keys()] }, status: { not: "DISCONNECTED" } },
      });
      if (usable !== wanted.size) return { ok: false, reason: "CHANNEL_UNAVAILABLE" };
    }

    let id: string;
    if (dealId) {
      const current = await tx.deal.findFirst({
        where: { id: dealId, ownerId },
        select: { price: true, originalPrice: true },
      });
      if (!current) return { ok: false, reason: "DEAL_NOT_FOUND" };
      const priceChanged =
        current.price !== data.price || current.originalPrice !== data.originalPrice;
      await tx.deal.update({
        where: { id: dealId },
        data: { ...data, ...(priceChanged && { priceCheckedAt: now }) },
      });
      id = dealId;
    } else {
      const hasPrice = data.price !== null || data.originalPrice !== null;
      const created = await tx.deal.create({
        data: { ...data, ownerId, priceCheckedAt: hasPrice ? now : null },
        select: { id: true },
      });
      id = created.id;
    }

    await syncPosts(tx, id, wanted, untouched);
    return { ok: true, dealId: id, publishedNow: publishNow ? wanted.size : 0 };
  });
}

async function syncPosts(tx: Tx, dealId: string, wanted: Map<string, Date>, untouched: Set<string>) {
  const posts = await tx.post.findMany({
    where: { dealId },
    select: { id: true, channelId: true, status: true },
    orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
  });
  const isOpen = (status: string) => (OPEN_POST_STATUSES as readonly string[]).includes(status);

  const toDelete: string[] = [];
  const channelIds = new Set([...posts.map((post) => post.channelId), ...wanted.keys()]);
  for (const channelId of channelIds) {
    if (untouched.has(channelId)) continue;
    const channelPosts = posts.filter((post) => post.channelId === channelId);
    const open = channelPosts.filter((post) => isOpen(post.status));
    const scheduledAt = wanted.get(channelId);

    if (!scheduledAt) {
      toDelete.push(...open.map((post) => post.id));
    } else if (open.length > 0) {
      // Reschedule the first unsent post (a failed one goes back to the queue).
      await tx.post.updateMany({
        where: { id: open[0].id, status: { in: [...OPEN_POST_STATUSES] } },
        data: { status: "PENDING", scheduledAt, errorMessage: null, attempts: 0, lockedAt: null },
      });
      toDelete.push(...open.slice(1).map((post) => post.id));
    } else if (channelPosts.length === 0) {
      await tx.post.create({ data: { dealId, channelId, scheduledAt } });
    }
    // Otherwise the post was already published or is being published: keep it.
  }

  if (toDelete.length > 0) {
    // The status guard skips posts a worker claimed in the meantime.
    await tx.post.deleteMany({ where: { id: { in: toDelete }, status: { in: [...OPEN_POST_STATUSES] } } });
  }
}

export type DeleteDealOutcome = { ok: true } | { ok: false; reason: "DEAL_NOT_FOUND" | "POST_PUBLISHING" };

/**
 * Deletes a deal owned by `ownerId` together with all its posts (queued ones are
 * thereby cancelled). Refused while one of its posts is being published.
 */
export async function deleteDealRecord(ownerId: string, dealId: string): Promise<DeleteDealOutcome> {
  const db = getDb();
  // One statement, so a worker cannot claim a post between the check and the delete.
  const { count } = await db.deal.deleteMany({
    where: { id: dealId, ownerId, posts: { none: { status: "PUBLISHING" } } },
  });
  if (count > 0) return { ok: true };

  const exists = await db.deal.count({ where: { id: dealId, ownerId } });
  return { ok: false, reason: exists > 0 ? "POST_PUBLISHING" : "DEAL_NOT_FOUND" };
}
