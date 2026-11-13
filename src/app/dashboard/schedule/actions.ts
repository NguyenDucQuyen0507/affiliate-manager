"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";
import { cancelPendingPost, queuePostNow, requeueFailedPosts } from "@/lib/posts";

// Every action starts with requireAdmin(): Server Actions are public endpoints.

export type PostActionResult = { ok: true; message: string } | { ok: false; message: string };

const postIdSchema = z.string().min(1).max(64);

function done(message: string): PostActionResult {
  // Post status shows up on every dashboard page (overview, deals, schedule).
  revalidatePath("/dashboard", "layout");
  return { ok: true, message };
}

const notFound: PostActionResult = {
  ok: false,
  message: "Không tìm thấy bài đăng hoặc bài đã thay đổi trạng thái. Hãy tải lại trang.",
};

export async function retryPost(postId: string): Promise<PostActionResult> {
  await requireAdmin();
  const id = postIdSchema.safeParse(postId);
  if (!id.success) return notFound;
  const count = await requeueFailedPosts([id.data]);
  return count > 0 ? done("Đã đưa vào hàng đợi đăng lại") : notFound;
}

export async function retryAllFailedPosts(): Promise<PostActionResult> {
  await requireAdmin();
  const count = await requeueFailedPosts("ALL");
  if (count === 0) return { ok: false, message: "Không còn bài lỗi nào để đăng lại." };
  return done(`Đã đưa ${count} bài vào hàng đợi đăng lại`);
}

export async function publishPostNow(postId: string): Promise<PostActionResult> {
  await requireAdmin();
  const id = postIdSchema.safeParse(postId);
  if (!id.success) return notFound;
  return (await queuePostNow(id.data))
    ? done("Bài sẽ được đăng trong lượt kiểm tra hàng đợi kế tiếp")
    : notFound;
}

export async function cancelPost(postId: string): Promise<PostActionResult> {
  await requireAdmin();
  const id = postIdSchema.safeParse(postId);
  if (!id.success) return notFound;
  return (await cancelPendingPost(id.data)) ? done("Đã hủy bài đăng") : notFound;
}
