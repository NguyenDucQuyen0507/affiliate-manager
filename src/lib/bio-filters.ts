// Public Bio page filter state <-> URL search params (pure; safe for client components).
// ?q=<search>&cat=<category>&sort=discount|under200k|expiring&page=<n>  ("newest" is the default)

export const BIO_PAGE_SIZE = 12;
/** "Dưới 200k": price strictly below this many VND. */
export const BIO_CHEAP_PRICE = 200_000;

export const bioSorts = [
  { value: "discount", label: "Giảm nhiều nhất" },
  { value: "under200k", label: "Dưới 200k" },
  { value: "expiring", label: "Sắp hết hạn" },
  { value: "newest", label: "Mới đăng" },
] as const;

export type BioSort = (typeof bioSorts)[number]["value"];

export type BioFilters = {
  q: string;
  /** "" = all categories. */
  category: string;
  sort: BioSort;
  /** How many pages of deals are shown ("Xem thêm deal" adds one). */
  page: number;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseBioFilters(params: RawSearchParams): BioFilters {
  const sort = first(params.sort);
  const page = Number.parseInt(first(params.page) ?? "1", 10);
  return {
    q: (first(params.q) ?? "").trim().slice(0, 100),
    category: (first(params.cat) ?? "").trim().slice(0, 50),
    sort: bioSorts.some((item) => item.value === sort) ? (sort as BioSort) : "newest",
    // Capped: each page adds BIO_PAGE_SIZE more cards to one long list.
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 50) : 1,
  };
}

/** Query string for a filter state ("" or "?…"), omitting defaults. */
export function bioFiltersToSearch(filters: BioFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("cat", filters.category);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  const search = params.toString();
  return search ? `?${search}` : "";
}

/** Link to /bio with some filters changed; any change other than page goes back to page 1. */
export function bioHref(filters: BioFilters, patch: Partial<BioFilters>) {
  return `/bio${bioFiltersToSearch({ ...filters, page: 1, ...patch })}`;
}
