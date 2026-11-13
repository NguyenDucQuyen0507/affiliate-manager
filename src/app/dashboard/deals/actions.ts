"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import { dealFormSchema } from "@/lib/deal-schema";
import { saveDealRecord } from "@/lib/deals";

export type SaveDealResult = { ok: true; dealId: string } | { ok: false; message: string };

const dealIdSchema = z.string().min(1).max(64);
const imageUrlsSchema = z
  .array(z.string().max(2000).regex(/^https?:\/\/\S+$/))
  .max(10);

/**
 * Creates (dealId = null) or updates a deal and (re)schedules its posts.
 * `imageUrls` are already-hosted image URLs; uploading new files is not supported yet.
 */
export async function saveDeal(
  dealId: string | null,
  input: unknown,
  imageUrls: unknown,
): Promise<SaveDealResult> {
  // Server Actions are public endpoints: always check the session first.
  const admin = await requireAdmin();

  const values = dealFormSchema.safeParse(input);
  const images = imageUrlsSchema.safeParse(imageUrls);
  const id = dealId === null ? null : dealIdSchema.safeParse(dealId);
  if (!values.success || !images.success || (id && !id.success)) {
    return { ok: false, message: "Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại các ô báo lỗi." };
  }

  const result = await saveDealRecord(admin.id, id?.data ?? null, values.data, images.data);
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.reason === "DEAL_NOT_FOUND"
          ? "Không tìm thấy deal này. Có thể deal đã bị xóa."
          : "Có kênh đã bị ngắt kết nối. Hãy tải lại trang và chọn lại kênh.",
    };
  }

  // The deal shows up on every dashboard page and possibly on the Bio page.
  revalidatePath("/dashboard", "layout");
  revalidatePath("/bio");
  return { ok: true, dealId: result.dealId };
}
