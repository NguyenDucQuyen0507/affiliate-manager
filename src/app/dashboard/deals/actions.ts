"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import { dealFormSchema } from "@/lib/deal-schema";
import { MAX_DEAL_IMAGES, isStoredImageUrl } from "@/lib/image-rules";
import {
  createDealRecord,
  deleteDealRecord,
  updateDealRecord,
  type SaveDealOutcome,
} from "@/lib/deals";

// Server Actions are public endpoints: each one starts with requireAdmin() and only
// touches deals owned by that admin (the owner never comes from the client).

export type SaveDealResult =
  | { ok: true; dealId: string; publishedNow: number }
  | { ok: false; message: string };
export type DeleteDealResult = { ok: true } | { ok: false; message: string };

const dealIdSchema = z.string().min(1).max(64);
const imageUrlsSchema = z
  .array(z.string().max(2000).refine(isStoredImageUrl))
  .max(MAX_DEAL_IMAGES);

const INVALID = "Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại các ô báo lỗi.";
const NOT_FOUND = "Không tìm thấy deal này (404). Có thể deal đã bị xóa.";

function parseInput(input: unknown, imageUrls: unknown) {
  const values = dealFormSchema.safeParse(input);
  const images = imageUrlsSchema.safeParse(imageUrls);
  return values.success && images.success ? { values: values.data, images: images.data } : null;
}

function refreshDealPages() {
  // Deals show up on every dashboard page (overview, list, schedule) and on Bio.
  revalidatePath("/dashboard", "layout");
  revalidatePath("/bio");
}

function toResult(outcome: SaveDealOutcome): SaveDealResult {
  if (outcome.ok) {
    refreshDealPages();
    return outcome;
  }
  return {
    ok: false,
    message:
      outcome.reason === "DEAL_NOT_FOUND"
        ? NOT_FOUND
        : "Có kênh đã bị ngắt kết nối. Hãy tải lại trang và chọn lại kênh.",
  };
}

/** Creates a deal owned by the signed-in admin and schedules its posts. */
export async function saveDeal(input: unknown, imageUrls: unknown): Promise<SaveDealResult> {
  const admin = await requireAdmin();
  const parsed = parseInput(input, imageUrls);
  if (!parsed) return { ok: false, message: INVALID };
  return toResult(await createDealRecord(admin.id, parsed.values, parsed.images));
}

/** Updates a deal of the signed-in admin (404 message for anyone else's deal). */
export async function updateDeal(
  dealId: unknown,
  input: unknown,
  imageUrls: unknown,
): Promise<SaveDealResult> {
  const admin = await requireAdmin();
  const id = dealIdSchema.safeParse(dealId);
  if (!id.success) return { ok: false, message: NOT_FOUND };
  const parsed = parseInput(input, imageUrls);
  if (!parsed) return { ok: false, message: INVALID };
  return toResult(await updateDealRecord(admin.id, id.data, parsed.values, parsed.images));
}

/** Deletes a deal of the signed-in admin and cancels its queued posts. */
export async function deleteDeal(dealId: unknown): Promise<DeleteDealResult> {
  const admin = await requireAdmin();
  const id = dealIdSchema.safeParse(dealId);
  if (!id.success) return { ok: false, message: NOT_FOUND };

  const outcome = await deleteDealRecord(admin.id, id.data);
  if (!outcome.ok) {
    return {
      ok: false,
      message:
        outcome.reason === "DEAL_NOT_FOUND"
          ? NOT_FOUND
          : "Deal đang có bài được đăng lên kênh. Vui lòng đợi vài phút rồi xóa lại.",
    };
  }
  refreshDealPages();
  return { ok: true };
}
