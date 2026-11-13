// Deal data access (server-only, Prisma).
// TODO: scope every query to the signed-in user's deals once auth exists.

import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { DEALS_PAGE_SIZE, type DealFilters, type DealStatusFilter } from "@/lib/deal-filters";
import type { DealFormValues } from "@/lib/deal-schema";
import { addDays, fromAppDateTime, fromDateKey, toAppDateTime, toDateKey } from "@/lib/format";
import { BIO_LABEL, channelTypeLabel, detectMarketplace } from "@/lib/labels";
import { toUiPostStatus } from "@/lib/posts";
import { buildDealSearchText, normalizeSearch } from "@/lib/search-text";
import type { ChannelType, Deal } from "@/lib/types";

const dealWithPosts = {
  posts: { orderBy: { scheduledAt: "asc" } },
} satisfies Prisma.DealInclude;

type DealRow = Prisma.DealGetPayload<{ include: typeof dealWithPosts }>;

/** Prisma row → UI domain type. */
function toDeal(row: DealRow): Deal {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    marketplace: row.marketplace,
    affiliateUrl: row.affiliateUrl,
    imageUrls: row.imageUrls,
    price: row.price,
    originalPrice: row.originalPrice,
    searchCode: row.searchCode,
    expiresAt: row.expiresAt ? toDateKey(row.expiresAt) : null,
    caption: row.caption,
    showOnBio: row.showOnBio,
    status: row.status,
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

export async function queryDeals(filters: DealFilters): Promise<DealQueryResult> {
  const db = getDb();
  const q = normalizeSearch(filters.q);

  // Search + marketplace apply to every tab; the status tab narrows the list.
  const base: Prisma.DealWhereInput = {
    ...(filters.marketplace !== "ALL" && { marketplace: filters.marketplace }),
    ...(q && { searchText: { contains: q } }),
  };
  const where: Prisma.DealWhereInput =
    filters.status === "ALL" ? base : { ...base, status: filters.status };

  const [grouped, total] = await Promise.all([
    db.deal.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
    db.deal.count({ where }),
  ]);

  const counts: Record<DealStatusFilter, number> = { ALL: 0, ACTIVE: 0, DRAFT: 0, EXPIRED: 0 };
  for (const group of grouped) {
    counts[group.status] = group._count._all;
    counts.ALL += group._count._all;
  }

  const pageCount = Math.max(1, Math.ceil(total / DEALS_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);

  const rows = await db.deal.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * DEALS_PAGE_SIZE,
    take: DEALS_PAGE_SIZE,
    include: { posts: { orderBy: { scheduledAt: "asc" }, include: { channel: { select: { type: true } } } } },
  });

  return {
    deals: rows.map((row) => ({
      ...toDeal(row),
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

export async function getDealById(id: string): Promise<Deal | null> {
  const row = await getDb().deal.findUnique({ where: { id }, include: dealWithPosts });
  return row ? toDeal(row) : null;
}

/** Active deal count, and how many of them expire between today and Sunday. */
export async function getDealStats(today: string) {
  const [y, m, d] = today.split("-").map(Number);
  const daysToSunday = (7 - new Date(Date.UTC(y, m - 1, d)).getUTCDay()) % 7;
  const db = getDb();

  const [active, expiringThisWeek] = await Promise.all([
    db.deal.count({ where: { status: "ACTIVE" } }),
    db.deal.count({
      where: {
        status: "ACTIVE",
        expiresAt: { gte: fromDateKey(today), lte: fromDateKey(addDays(today, daysToSunday)) },
      },
    }),
  ]);
  return { active, expiringThisWeek };
}

/** Categories already used by deals, for the editor's suggestions. */
export async function getDealCategories(): Promise<string[]> {
  const rows = await getDb().deal.findMany({
    where: { category: { not: "" } },
    distinct: ["category"],
    select: { category: true },
  });
  return rows.map((row) => row.category).sort((a, b) => a.localeCompare(b, "vi"));
}

export type SaveDealOutcome =
  | { ok: true; dealId: string }
  | { ok: false; reason: "DEAL_NOT_FOUND" | "CHANNEL_UNAVAILABLE" };

type Tx = Prisma.TransactionClient;

/** Posts in these states have not gone out yet, so the editor may move or remove them. */
const OPEN_POST_STATUSES = ["PENDING", "FAILED"] as const;

/**
 * Creates (dealId = null) or updates a deal from validated editor values.
 * "draft" keeps the deal off every channel: its unsent posts are removed.
 * "schedule" activates it and makes the unsent posts match the chosen channels/times.
 * Posts already published or being published are never touched.
 */
export async function saveDealRecord(
  dealId: string | null,
  values: DealFormValues,
  imageUrls: string[],
): Promise<SaveDealOutcome> {
  const schedule = values.intent === "schedule";
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
    status: schedule ? "ACTIVE" : "DRAFT",
    searchText: buildDealSearchText(values.title, searchCode),
  } satisfies Prisma.DealUncheckedUpdateInput;

  // channelId → new time. An enabled target without a time is a locked (already
  // published) row: leave that channel as it is.
  const wanted = new Map<string, Date>();
  const untouched = new Set<string>();
  if (schedule) {
    for (const target of values.targets) {
      if (!target.enabled) continue;
      if (target.scheduledAt) wanted.set(target.channelId, fromAppDateTime(target.scheduledAt));
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
      const { count } = await tx.deal.updateMany({ where: { id: dealId }, data });
      if (count === 0) return { ok: false, reason: "DEAL_NOT_FOUND" };
      id = dealId;
    } else {
      const created = await tx.deal.create({
        data: { ...data, ownerId: await placeholderOwnerId(tx) },
        select: { id: true },
      });
      id = created.id;
    }

    await syncPosts(tx, id, wanted, untouched);
    return { ok: true, dealId: id };
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

/** TODO: use the signed-in user once auth exists. Until then deals belong to the first admin. */
async function placeholderOwnerId(tx: Tx) {
  const admin = await tx.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!admin) throw new Error("No admin user found; run `npm run db:seed` first.");
  return admin.id;
}
