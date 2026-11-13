"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { disconnectChannel, renameChannel } from "@/lib/channels";
import { telegramConnectSchema } from "@/lib/channel-schema";

// TODO: verify the session in every action once auth exists.

export type ChannelActionResult = { ok: true; message: string } | { ok: false; message: string };

const channelIdSchema = z.string().min(1).max(64);

const notFound: ChannelActionResult = {
  ok: false,
  message: "Không tìm thấy kênh. Hãy tải lại trang.",
};

/** The Facebook Graph API / Telegram Bot API integration is not built yet. */
function notConnected(platform: "Facebook" | "Telegram"): ChannelActionResult {
  return {
    ok: false,
    message: `Chưa kết nối API ${platform}: phần máy chủ cho tính năng này chưa được cài đặt.`,
  };
}

function done(message: string): ChannelActionResult {
  // Channel names/status show up on every dashboard page.
  revalidatePath("/dashboard", "layout");
  return { ok: true, message };
}

export async function renameChannelAction(channelId: string, name: string): Promise<ChannelActionResult> {
  const id = channelIdSchema.safeParse(channelId);
  const parsedName = z.string().trim().min(1).max(80).safeParse(name);
  if (!id.success) return notFound;
  if (!parsedName.success) return { ok: false, message: "Tên kênh phải từ 1 đến 80 ký tự." };
  return (await renameChannel(id.data, parsedName.data)) ? done("Đã đổi tên kênh") : notFound;
}

export async function disconnectChannelAction(channelId: string): Promise<ChannelActionResult> {
  const id = channelIdSchema.safeParse(channelId);
  if (!id.success) return notFound;
  const cancelled = await disconnectChannel(id.data);
  if (cancelled === null) return notFound;
  return done(
    cancelled > 0 ? `Đã ngắt kết nối kênh và hủy ${cancelled} bài chờ đăng` : "Đã ngắt kết nối kênh",
  );
}

/** TODO: post a test message through the channel's API and report the result. */
export async function sendTestPostAction(channelId: string, platform: "Facebook" | "Telegram") {
  if (!channelIdSchema.safeParse(channelId).success) return notFound;
  return notConnected(platform);
}

/** TODO: start the Facebook Login flow (pages_manage_posts) and store the page token encrypted. */
export async function connectFacebookAction(): Promise<ChannelActionResult> {
  return notConnected("Facebook");
}

/**
 * TODO: call getMe + getChat to verify the bot is an admin of the channel, then
 * store the token encrypted. The token must never be returned to the client.
 */
export async function connectTelegramAction(input: unknown): Promise<ChannelActionResult> {
  const parsed = telegramConnectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Thông tin chưa hợp lệ, vui lòng kiểm tra lại." };
  return notConnected("Telegram");
}
