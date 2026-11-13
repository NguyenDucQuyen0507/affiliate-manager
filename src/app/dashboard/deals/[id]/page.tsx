import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DealEditor } from "@/components/deals/editor/deal-editor";
import { EditorSkeleton } from "@/components/deals/editor/editor-skeleton";
import { getChannels } from "@/lib/channels";
import { getDealById, getDealCategories } from "@/lib/deals";

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
  const [deal, channels, categories] = await Promise.all([
    getDealById(id),
    getChannels(),
    getDealCategories(),
  ]);
  if (!deal) notFound();
  return <DealEditor deal={deal} channels={channels} categories={categories} />;
}
