// Deal list filter state <-> URL search params (pure; safe for client components).

import { MARKETPLACES } from "@/lib/labels";
import type { DealStatus, Marketplace } from "@/lib/types";

export const DEALS_PAGE_SIZE = 6;

export type DealStatusFilter = "ALL" | DealStatus;
export type MarketplaceFilter = "ALL" | Marketplace;

export const statusTabs: { value: DealStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang chạy" },
  { value: "DRAFT", label: "Nháp" },
  { value: "EXPIRED", label: "Hết hạn" },
];

export type DealFilters = {
  status: DealStatusFilter;
  marketplace: MarketplaceFilter;
  q: string;
  page: number;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Parses URL search params into validated filters (unknown values fall back to defaults). */
export function parseDealFilters(params: RawSearchParams): DealFilters {
  const status = first(params.status)?.toUpperCase();
  const marketplace = first(params.marketplace)?.toUpperCase();
  const page = Number.parseInt(first(params.page) ?? "1", 10);

  return {
    status: statusTabs.some((tab) => tab.value === status)
      ? (status as DealStatusFilter)
      : "ALL",
    marketplace: MARKETPLACES.includes(marketplace as Marketplace)
      ? (marketplace as Marketplace)
      : "ALL",
    q: (first(params.q) ?? "").trim(),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Builds the query string for a filter state, omitting default values. */
export function dealFiltersToSearch(filters: Partial<DealFilters>) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "ALL") params.set("status", filters.status.toLowerCase());
  if (filters.q) params.set("q", filters.q);
  if (filters.marketplace && filters.marketplace !== "ALL") {
    params.set("marketplace", filters.marketplace.toLowerCase());
  }
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const search = params.toString();
  return search ? `?${search}` : "";
}
