import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { DealEditor } from "@/components/deals/editor/deal-editor";
import { EditorSkeleton } from "@/components/deals/editor/editor-skeleton";
import { getChannels } from "@/lib/channels";
import { requireAdmin } from "@/lib/auth-guard";
import { getDealCategories } from "@/lib/deals";

export const metadata: Metadata = {
  title: "Tạo deal mới – Affiliate Manager",
};

export default function NewDealPage() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <NewDeal />
    </Suspense>
  );
}

async function NewDeal() {
  // Channels come from the database: read them per request, not at build time.
  await connection();
  const admin = await requireAdmin();
  const [channels, categories] = await Promise.all([getChannels(), getDealCategories(admin.id)]);
  return <DealEditor deal={null} channels={channels} categories={categories} />;
}
