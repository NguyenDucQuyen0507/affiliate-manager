import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DealFilters } from "@/components/deals/deal-filters";
import { DealTable } from "@/components/deals/deal-table";
import { Skeleton } from "@/components/ui/skeleton";
import { parseDealFilters } from "@/lib/deal-filters";
import { queryDeals } from "@/lib/deals";

export const metadata: Metadata = {
  title: "Deal – Affiliate Manager",
};

export default function DealsPage({ searchParams }: PageProps<"/dashboard/deals">) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Deal"
        description="Mỗi deal là một sản phẩm kèm link affiliate, có thể đăng lên nhiều kênh."
      />
      <Suspense fallback={<DealsSkeleton />}>
        <DealsView searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function DealsView({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard/deals">["searchParams"];
}) {
  const filters = parseDealFilters(await searchParams);
  const result = await queryDeals(filters);
  // Use the clamped page so pagination links stay valid for out-of-range ?page=.
  const current = { ...filters, page: result.page };

  return (
    <>
      <DealFilters filters={current} counts={result.counts} />
      <DealTable result={result} filters={current} />
    </>
  );
}

function DealsSkeleton() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-11 w-[380px] max-w-full rounded-lg bg-muted-track" />
        <Skeleton className="h-11 w-[420px] max-w-full rounded-lg bg-muted-track" />
      </div>
      <Skeleton className="h-[560px] rounded-xl bg-muted-track" />
    </>
  );
}
