import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DealEditor } from "@/components/deals/editor/deal-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { getChannels } from "@/lib/channels";
import { getDealById } from "@/lib/deals";

export const metadata: Metadata = {
  title: "Sửa deal – Affiliate Manager",
};

export default function EditDealPage({ params }: PageProps<"/dashboard/deals/[id]">) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <EditDeal params={params} />
    </Suspense>
  );
}

async function EditDeal({ params }: { params: PageProps<"/dashboard/deals/[id]">["params"] }) {
  const { id } = await params;
  const [deal, channels] = await Promise.all([getDealById(id), getChannels()]);
  if (!deal) notFound();
  return <DealEditor deal={deal} channels={channels} />;
}

function EditorSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32 bg-muted-track" />
        <Skeleton className="h-9 w-56 bg-muted-track" />
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <Skeleton className="h-[720px] min-w-0 flex-[3_1_520px] rounded-xl bg-muted-track" />
        <Skeleton className="h-[560px] min-w-0 flex-[2_1_380px] rounded-xl bg-muted-track" />
      </div>
    </div>
  );
}
