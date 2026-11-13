"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { bioHref, type BioFilters } from "@/lib/bio-filters";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Search box for the Bio page. Updates ?q= shortly after typing stops; without
 * JavaScript the form still submits as a normal GET request.
 */
export function BioSearch({ filters }: { filters: BioFilters }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);
  // Last q this box put in the URL; any other change (Back, a chip link) came from outside.
  const sentQuery = useRef(filters.q);

  useEffect(() => {
    if (filters.q === sentQuery.current) return;
    sentQuery.current = filters.q;
    setQuery(filters.q);
  }, [filters.q]);

  function go(q: string) {
    sentQuery.current = q;
    startTransition(() => router.replace(bioHref(filters, { q }), { scroll: false }));
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === filters.q) return;
    const timer = setTimeout(() => go(trimmed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the typed query changes
  }, [query]);

  return (
    <form
      role="search"
      action="/bio"
      onSubmit={(event) => {
        event.preventDefault();
        go(query.trim());
      }}
    >
      {filters.category && <input type="hidden" name="cat" value={filters.category} />}
      {filters.sort !== "newest" && <input type="hidden" name="sort" value={filters.sort} />}
      <label className="flex min-h-11 items-center gap-2 rounded-xl border border-bio-border bg-card px-3.5 has-focus-visible:border-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
        <Search className="size-4 flex-none text-subtle" aria-hidden="true" />
        <span className="sr-only">Tìm deal</span>
        <input
          type="search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm váy, áo, bình sữa…"
          autoComplete="off"
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-subtle sm:text-sm"
        />
      </label>
    </form>
  );
}
