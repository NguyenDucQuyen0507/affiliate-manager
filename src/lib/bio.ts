// Public Bio page data (server-only, Prisma).
// Only exposes what the public page needs (never posts, channels or tokens).

import "server-only";
import { getDb } from "@/lib/db";
import { fromDateKey, toDateKey } from "@/lib/format";
import { bioPageStatus, bioProfile } from "@/lib/sample-data/account";
import type { BioProfile, Deal, Marketplace } from "@/lib/types";

export type BioDeal = Pick<
  Deal,
  "id" | "title" | "category" | "affiliateUrl" | "originalPrice" | "searchCode" | "expiresAt"
> & {
  /** Always set for active deals (required by "Lên lịch đăng"). */
  marketplace: Marketplace;
  price: number;
  imageUrl: string | null;
};

export type BioPageData = {
  profile: BioProfile;
  deals: BioDeal[];
  /** Categories that have at least one visible deal, most deals first. */
  categories: string[];
};

/**
 * Returns null when the Bio page is hidden. Shows only deals that are active,
 * opted in to Bio and not past their expiry date (`today` is YYYY-MM-DD).
 */
export async function getBioPage(today: string): Promise<BioPageData | null> {
  if (bioPageStatus !== "PUBLIC") return null;

  const rows = await getDb().deal.findMany({
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
      searchCode: true,
      expiresAt: true,
      imageUrls: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });

  const deals: BioDeal[] = rows.flatMap(({ imageUrls, expiresAt, marketplace, price, ...deal }) =>
    // Filtered in the query; this only narrows the types.
    marketplace !== null && price !== null
      ? [{ ...deal, marketplace, price, expiresAt: expiresAt ? toDateKey(expiresAt) : null, imageUrl: imageUrls[0] ?? null }]
      : [],
  );

  return { profile: bioProfile, deals, categories: categoriesByDealCount(deals) };
}

/** Categories ordered by number of deals (ties keep first-appearance order). */
function categoriesByDealCount(deals: BioDeal[]) {
  const counts = new Map<string, number>();
  for (const deal of deals) {
    if (deal.category) counts.set(deal.category, (counts.get(deal.category) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([category]) => category);
}
