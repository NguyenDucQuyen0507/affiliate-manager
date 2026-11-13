import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BioDealList, BioFilterBar, FeaturedDeals, TelegramFollow } from "@/components/bio/bio-deal-list";
import { BioSearch } from "@/components/bio/bio-search";
import { Skeleton } from "@/components/ui/skeleton";
import { getBioPage } from "@/lib/bio";
import { parseBioFilters } from "@/lib/bio-filters";
import { formatTimeThenDay, todayKey } from "@/lib/format";
import { bioProfile } from "@/lib/sample-data/account";

// TODO: read the profile from the database (generateMetadata) once it exists.
export const metadata: Metadata = {
  title: bioProfile.name,
  description: bioProfile.tagline,
};

export default function BioPage({ searchParams }: PageProps<"/bio">) {
  return (
    <div className="flex min-h-svh flex-1 justify-center bg-bio-background">
      <main className="flex w-full max-w-[480px] flex-col sm:max-w-5xl">
        <Suspense fallback={<BioSkeleton />}>
          <BioContent searchParams={searchParams} />
        </Suspense>
        <footer className="px-5 pt-5 pb-7 text-center text-xs leading-normal text-muted-foreground sm:px-8 sm:pt-8 sm:pb-10">
          Các link trên là link tiếp thị liên kết. Mình nhận hoa hồng nhỏ khi bạn mua, giá của bạn không đổi.
          Giá có thể thay đổi theo thời gian, hãy kiểm tra trên sàn trước khi thanh toán.
        </footer>
      </main>
    </div>
  );
}

async function BioContent({ searchParams }: { searchParams: PageProps<"/bio">["searchParams"] }) {
  // Reading searchParams makes this per request, so expired deals disappear on their expiry date.
  const requested = parseBioFilters(await searchParams);
  const today = todayKey();
  const page = await getBioPage(today, requested);
  if (!page) notFound();
  const { profile, filters } = page;

  return (
    <>
      <header className="flex flex-col items-center gap-2 px-5 pt-7 pb-3.5 text-center sm:gap-2.5 sm:px-8 sm:pt-12 sm:pb-6">
        <div
          className="flex size-[72px] items-center justify-center overflow-hidden rounded-full bg-primary-soft-border font-heading text-[28px] font-bold text-bio-avatar-foreground sm:size-[88px] sm:text-[34px]"
          aria-hidden="true"
        >
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar host is not configured for next/image yet
            <img src={profile.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            profile.name.charAt(0).toUpperCase()
          )}
        </div>
        <h1 className="font-heading text-[22px] font-bold sm:text-[30px]">{profile.name}</h1>
        <p className="text-sm leading-normal text-muted-foreground sm:text-base">{profile.tagline}</p>
        {page.activeCount > 0 && (
          <p className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
            {page.updatedAt && `Cập nhật ${formatTimeThenDay(page.updatedAt, today)} · `}
            {page.activeCount} deal đang chạy
          </p>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-5 px-5 sm:gap-6 sm:px-8">
        <div className="flex flex-col gap-3 sm:mx-auto sm:w-full sm:max-w-2xl sm:items-center">
          <div className="w-full">
            <BioSearch filters={filters} />
          </div>
          <BioFilterBar filters={filters} categories={page.categories} />
        </div>
        <FeaturedDeals deals={page.featured} today={today} />
        <BioDealList deals={page.deals} total={page.total} filters={filters} today={today} />
        {page.telegramUrl && <TelegramFollow url={page.telegramUrl} />}
      </div>
    </>
  );
}

function BioSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3 px-5 pt-7 sm:px-8 sm:pt-12">
      <Skeleton className="mx-auto size-[72px] rounded-full bg-bio-border" />
      <Skeleton className="mx-auto h-6 w-48 bg-bio-border" />
      <Skeleton className="mx-auto mb-4 h-4 w-64 bg-bio-border" />
      <Skeleton className="h-11 rounded-xl bg-bio-border" />
      <Skeleton className="mb-2 h-10 rounded-full bg-bio-border" />
      <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[150px] rounded-2xl bg-bio-border lg:h-[380px]" />
        ))}
      </div>
    </div>
  );
}
