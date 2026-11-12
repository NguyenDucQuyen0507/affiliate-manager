import type { Metadata } from "next";
import { DealEditor } from "@/components/deals/editor/deal-editor";
import { getChannels } from "@/lib/channels";

export const metadata: Metadata = {
  title: "Tạo deal mới – Affiliate Manager",
};

export default async function NewDealPage() {
  const channels = await getChannels();
  return <DealEditor deal={null} channels={channels} />;
}
