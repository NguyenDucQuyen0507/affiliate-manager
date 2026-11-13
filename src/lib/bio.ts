// Public Bio page data (server-only, Prisma).
// Only exposes what the public page needs (never posts, tokens or owner data).

import "server-only";
import { getDb } from "@/lib/db";
import { BIO_CHEAP_PRICE, BIO_PAGE_SIZE, type BioFilters } from "@/lib/bio-filters";
import { discountPercent } from "@/lib/deal-caption";
import { fromDateKey, toAppDateTime, toDateKey } from "@/lib/format";
import { bioPageStatus, bioProfile } from "@/lib/sample-data/account";
import { normalizeSearch } from "@/lib/search-text";
import type { BioProfile, Deal, Marketplace } from "@/lib/types";

export type BioDeal = Pick<
  Deal,
  | "id"
  | "title"
  | "category"
  | "affiliateUrl"
  | "originalPrice"
  | "searchCode"
  | "expiresAt"
  | "note"
  | "priceCheckedAt"
> & {
  /** Always set for active deals (required by "Lên lịch đăng"). */
  marketplace: Marketplace;
  price: number;
  imageUrl: string | null;
  /** Whole percent off the original price, or null. */
  discount: number | null;
};

export type BioPageData = {
  profile: BioProfile;
  /** All deals currently on the page (before filters). */
  activeCount: number;
  /** Latest change to a visible deal, app-local "YYYY-MM-DDTHH:mm" (null when none). */
  updatedAt: string | null;
  /** Categories that have at least one visible deal, most deals first. */
  categories: string[];
  /** "Deal hôm nay": featured deals, only on the unfiltered page (no search/category). */
  featured: BioDeal[];
  /** Deals for "Tất cả deal" after filters/sort, first `filters.page` pages. */
  deals: BioDeal[];
  /** Number of deals matching the filters (excluding the featured ones shown above). */
  total: number;
  /** The filters actually applied (an unknown category falls back to all). */
  filters: BioFilters;
  /** Public Telegram channel link for the follow block, or null. */
  telegramUrl: string | null;
};

const MAX_FEATURED = 3;

type Row = BioDeal & { isFeatured: boolean; createdAt: Date; updatedAt: Date; searchText: string };

/**
 * Returns null when the Bio page is hidden. Shows only deals that are active,
 * opted in to Bio and not past their expiry date (`today` is YYYY-MM-DD).
 * The page lists at most a few dozen deals, so filtering and sorting happen here
 * after one query; categories always come from the unfiltered list.
 */
export async function getBioPage(today: string, requested: BioFilters): Promise<BioPageData | null> {
  if (bioPageStatus !== "PUBLIC") return null;

  const db = getDb();
  const [rows, telegramUrl] = await Promise.all([
    db.deal.findMany({
      where: {
        status: "ACTIVE",
        showOnBio: true,
        marketplace: { not: null },
        price: { not: null },
        OR: [{ expiresAt: null }, { expiresAt: { gte: fromDateKey(today) } }],
      },
      select: {
        id: true,
        title: true,
        category: true,
        marketplace: true,
        affiliateUrl: true,
        price: true,
        originalPrice: true,
        priceCheckedAt: true,
        searchCode: true,
        expiresAt: true,
        imageUrls: true,
        note: true,
        isFeatured: true,
        searchText: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    }),
    getTelegramUrl(),
  ]);

  const all: Row[] = rows.flatMap(({ imageUrls, expiresAt, marketplace, price, priceCheckedAt, ...deal }) =>
    // Filtered in the query; this only narrows the types.
    marketplace !== null && price !== null
      ? [
          {
            ...deal,
            marketplace,
            price,
            expiresAt: expiresAt ? toDateKey(expiresAt) : null,
            priceCheckedAt: priceCheckedAt ? toAppDateTime(priceCheckedAt) : null,
            imageUrl: imageUrls[0] ?? null,
            discount: discountPercent(price, deal.originalPrice),
          },
        ]
      : [],
  );

  const categories = categoriesByDealCount(all);
  const filters: BioFilters = {
    ...requested,
    category: categories.includes(requested.category) ? requested.category : "",
  };

  // Featured deals get their own section on the landing view; while searching or
  // browsing a category they simply appear in the results.
  const showFeatured = !filters.q && !filters.category;
  const featured = showFeatured ? all.filter((deal) => deal.isFeatured).slice(0, MAX_FEATURED) : [];
  const featuredIds = new Set(featured.map((deal) => deal.id));

  const query = normalizeSearch(filters.q);
  const matching = sortDeals(
    all.filter(
      (deal) =>
        !featuredIds.has(deal.id) &&
        (!query || deal.searchText.includes(query)) &&
        (!filters.category || deal.category === filters.category) &&
        (filters.sort !== "under200k" || deal.price < BIO_CHEAP_PRICE),
    ),
    filters.sort,
  );

  const latest = all.reduce<Date | null>((max, deal) => (!max || deal.updatedAt > max ? deal.updatedAt : max), null);
  return {
    profile: bioProfile,
    activeCount: all.length,
    updatedAt: latest ? toAppDateTime(latest) : null,
    categories,
    featured: featured.map(toBioDeal),
    deals: matching.slice(0, filters.page * BIO_PAGE_SIZE).map(toBioDeal),
    total: matching.length,
    filters,
    telegramUrl,
  };
}

/** Drops the internal fields before the data reaches the (client) components. */
function toBioDeal(row: Row): BioDeal {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    marketplace: row.marketplace,
    affiliateUrl: row.affiliateUrl,
    price: row.price,
    originalPrice: row.originalPrice,
    discount: row.discount,
    priceCheckedAt: row.priceCheckedAt,
    searchCode: row.searchCode,
    expiresAt: row.expiresAt,
    note: row.note,
    imageUrl: row.imageUrl,
  };
}

/** Rows arrive newest first; Array.prototype.sort is stable, so ties stay newest first. */
function sortDeals(deals: Row[], sort: BioFilters["sort"]) {
  switch (sort) {
    case "discount":
      return [...deals].sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
    case "expiring":
      // No expiry date = not expiring: last.
      return [...deals].sort((a, b) => (a.expiresAt ?? "9999").localeCompare(b.expiresAt ?? "9999"));
    default:
      return deals;
  }
}

/** Categories ordered by number of deals (ties keep first-appearance order). */
function categoriesByDealCount(deals: Row[]) {
  const counts = new Map<string, number>();
  for (const deal of deals) {
    if (deal.category) counts.set(deal.category, (counts.get(deal.category) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([category]) => category);
}

const TELEGRAM_USERNAME_RE = /^@([A-Za-z][A-Za-z0-9_]{4,31})$/;

/**
 * t.me link of the first active Telegram channel that has a public @username.
 * Private channels (numeric chat ids) have no public link, so the block is hidden.
 */
async function getTelegramUrl(): Promise<string | null> {
  const channels = await getDb().channel.findMany({
    where: { type: "TELEGRAM", status: "ACTIVE", externalId: { startsWith: "@" } },
    select: { externalId: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  for (const { externalId } of channels) {
    const match = externalId?.match(TELEGRAM_USERNAME_RE);
    if (match) return `https://t.me/${match[1]}`;
  }
  return null;
}
