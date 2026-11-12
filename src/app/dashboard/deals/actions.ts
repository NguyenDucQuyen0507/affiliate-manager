"use server";

import { dealFormSchema } from "@/lib/deal-schema";

export type SaveDealResult = { ok: true } | { ok: false; message: string };

/**
 * Creates (dealId = null) or updates a deal and (re)schedules its posts.
 * TODO: check the session once auth exists, persist to the database,
 * create/update one Post per enabled channel and revalidate /dashboard/deals.
 */
export async function saveDeal(dealId: string | null, input: unknown): Promise<SaveDealResult> {
  const parsed = dealFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại các ô báo lỗi." };
  }
  return { ok: true };
}
