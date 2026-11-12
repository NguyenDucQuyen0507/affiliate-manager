// Public Bio page data. Server-only.
// Only exposes what the public page needs (never posts, channels or tokens).

import "server-only";
import { bioPageStatus, bioProfile, deals as sampleDeals } from "@/lib/sample-data/dashboard";
import type { BioProfile, Deal } from "@/lib/types";

export type BioDeal = Pick<
  Deal,
  | "id"
  | "title"
  | "category"
  | "marketplace"
  | "affiliateUrl"
  | "price"
  | "originalPrice"
  | "searchCode"
  | "expiresAt"
  | "thumbnailColor"
> & { imageUrl: string | null };

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

  const deals: BioDeal[] = sampleDeals
    .filter(
      (deal) =>
        deal.status === "ACTIVE" &&
        deal.showOnBio &&
        (deal.expiresAt === null || deal.expiresAt >= today),
    )
    .map((deal) => ({
      id: deal.id,
      title: deal.title,
      category: deal.category,
      marketplace: deal.marketplace,
      affiliateUrl: deal.affiliateUrl,
      price: deal.price,
      originalPrice: deal.originalPrice,
      searchCode: deal.searchCode,
      expiresAt: deal.expiresAt,
      thumbnailColor: deal.thumbnailColor,
      imageUrl: deal.imageUrls[0] ?? null,
    }));

  return {
    profile: bioProfile,
    deals,
    categories: categoriesByDealCount(deals),
  };
}

/** Categories ordered by number of deals (ties keep first-appearance order). */
function categoriesByDealCount(deals: BioDeal[]) {
  const counts = new Map<string, number>();
  for (const deal of deals) counts.set(deal.category, (counts.get(deal.category) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([category]) => category);
}
