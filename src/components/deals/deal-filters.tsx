"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  dealFiltersToSearch,
  statusTabs,
  type DealFilters as Filters,
  type DealStatusFilter,
  type MarketplaceFilter,
} from "@/lib/deal-filters";
import { MARKETPLACES, marketplaceLabel } from "@/lib/labels";

const SEARCH_DEBOUNCE_MS = 300;

export function DealFilters({
  filters,
  counts,
}: {
  filters: Filters;
  counts: Record<DealStatusFilter, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);

  // Any filter change resets pagination to page 1.
  function navigate(patch: Partial<Filters>) {
    const next = { ...filters, q: query.trim(), ...patch, page: 1 };
    startTransition(() => {
      router.replace(`${pathname}${dealFiltersToSearch(next)}`, { scroll: false });
    });
  }

  // Debounced search: update the URL shortly after the user stops typing.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === filters.q) return;
    const timer = setTimeout(() => navigate({ q: trimmed }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the typed query changes
  }, [query]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Tabs
        value={filters.status}
        onValueChange={(value) => navigate({ status: value as DealStatusFilter })}
        aria-label="Lọc theo trạng thái"
      >
        <TabsList className="h-auto flex-wrap justify-start">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-none">
              {tab.label} · {counts[tab.value]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex w-full flex-wrap gap-2.5 sm:w-auto">
        <div className="relative w-full sm:w-[280px]">
          <label htmlFor="deal-search" className="sr-only">
            Tìm deal
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <Input
            id="deal-search"
            type="search"
            placeholder="Tìm theo tên hoặc mã Shopee"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="deal-marketplace" className="text-[13px] text-muted-foreground">
            Sàn
          </label>
          <Select
            value={filters.marketplace}
            onValueChange={(value) => navigate({ marketplace: value as MarketplaceFilter })}
          >
            <SelectTrigger id="deal-marketplace" className="min-w-36 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectItem value="ALL">Tất cả sàn</SelectItem>
              {MARKETPLACES.map((marketplace) => (
                <SelectItem key={marketplace} value={marketplace}>
                  {marketplaceLabel[marketplace]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
