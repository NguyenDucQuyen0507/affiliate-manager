// Deal & channel data access. Server-only: currently reads sample data;
// swap the bodies for database queries later while keeping the same signatures.

import "server-only";
import {
  DEALS_PAGE_SIZE,
  type DealFilters,
  type DealStatusFilter,
} from "@/lib/deal-filters";
import { addDays } from "@/lib/format";
import { BIO_LABEL, channelTypeLabel } from "@/lib/labels";
import { channels as sampleChannels, deals as sampleDeals } from "@/lib/sample-data/dashboard";
import type { Channel, ChannelType, Deal } from "@/lib/types";

/** Lowercases and strips Vietnamese diacritics so "binh sua" matches "Bình sữa". */
function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
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

/** "Facebook, Telegram, Bio" style labels: one per channel type, plus Bio. */
function dealChannelLabels(deal: Deal, channelById: Map<string, Channel>) {
  const types = new Set<ChannelType>();
  for (const post of deal.posts) {
    const channel = channelById.get(post.channelId);
    if (channel) types.add(channel.type);
  }
  const labels = (["FACEBOOK", "TELEGRAM"] as const)
    .filter((type) => types.has(type))
    .map((type) => channelTypeLabel[type]);
  if (deal.showOnBio) labels.push(BIO_LABEL);
  return labels;
}

export async function queryDeals(filters: DealFilters): Promise<DealQueryResult> {
  const q = normalize(filters.q);

  const matching = sampleDeals.filter((deal) => {
    if (filters.marketplace !== "ALL" && deal.marketplace !== filters.marketplace) return false;
    if (!q) return true;
    return (
      normalize(deal.title).includes(q) ||
      (deal.searchCode !== null && normalize(deal.searchCode).includes(q))
    );
  });

  const counts: Record<DealStatusFilter, number> = {
    ALL: matching.length,
    ACTIVE: 0,
    DRAFT: 0,
    EXPIRED: 0,
  };
  for (const deal of matching) counts[deal.status] += 1;

  const filtered =
    filters.status === "ALL"
      ? matching
      : matching.filter((deal) => deal.status === filters.status);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / DEALS_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const start = (page - 1) * DEALS_PAGE_SIZE;
  const channelById = new Map(sampleChannels.map((c) => [c.id, c]));

  return {
    deals: filtered.slice(start, start + DEALS_PAGE_SIZE).map((deal) => ({
      ...deal,
      channelLabels: dealChannelLabels(deal, channelById),
    })),
    counts,
    total,
    page,
    pageCount,
    pageSize: DEALS_PAGE_SIZE,
  };
}

export async function getDealById(id: string): Promise<Deal | null> {
  return sampleDeals.find((deal) => deal.id === id) ?? null;
}

/** Active deal count, and how many of them expire between today and Sunday. */
export async function getDealStats(today: string) {
  const [y, m, d] = today.split("-").map(Number);
  const daysToSunday = (7 - new Date(Date.UTC(y, m - 1, d)).getUTCDay()) % 7;
  const endOfWeek = addDays(today, daysToSunday);
  const active = sampleDeals.filter((deal) => deal.status === "ACTIVE");
  return {
    active: active.length,
    expiringThisWeek: active.filter(
      (deal) => deal.expiresAt !== null && deal.expiresAt >= today && deal.expiresAt <= endOfWeek,
    ).length,
  };
}
