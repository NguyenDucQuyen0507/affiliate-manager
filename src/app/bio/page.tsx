import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BioDealList } from "@/components/bio/bio-deal-list";
import { Skeleton } from "@/components/ui/skeleton";
import { getBioPage } from "@/lib/bio";
import { todayKey } from "@/lib/format";
import { bioProfile } from "@/lib/sample-data/dashboard";

// TODO: read the profile from the database (generateMetadata) once it exists.
export const metadata: Metadata = {
  title: bioProfile.name,
  description: bioProfile.tagline,
};

export default function BioPage() {
  return (
    <div className="flex min-h-svh flex-1 justify-center bg-bio-background">
      <main className="flex w-full max-w-[480px] flex-col sm:max-w-5xl">
        <Suspense fallback={<BioSkeleton />}>
          <BioContent />
        </Suspense>
        <footer className="px-5 pt-4 pb-6 text-center text-xs leading-normal text-muted-foreground sm:px-8 sm:pt-8 sm:pb-10">
          Các link trên là link tiếp thị liên kết. Mình nhận hoa hồng nhỏ khi bạn mua, giá của bạn không đổi.
        </footer>
      </main>
    </div>
  );
}

async function BioContent() {
  // Expired deals must disappear on their expiry date, so evaluate per request.
  await connection();
  const page = await getBioPage(todayKey());
  if (!page) notFound();
  const { profile, deals, categories } = page;

  return (
    <>
      <header className="flex flex-col items-center gap-2 px-5 pt-7 pb-4 text-center sm:gap-2.5 sm:px-8 sm:pt-12 sm:pb-6">
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
        <p className="text-sm text-muted-foreground sm:text-base">{profile.tagline}</p>
      </header>
      <div className="flex flex-1 flex-col px-5 sm:px-8">
        <BioDealList deals={deals} categories={categories} />
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
      <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[150px] rounded-2xl bg-bio-border lg:h-[380px]" />
        ))}
      </div>
    </div>
  );
}
