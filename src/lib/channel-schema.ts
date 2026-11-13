import { z } from "zod";

/** "Thêm kênh Telegram" form, shared by the client form and the server action. */
export const telegramConnectSchema = z.object({
  botToken: z
    .string()
    .trim()
    .regex(/^\d{5,}:[A-Za-z0-9_-]{30,}$/, "Token không đúng định dạng (ví dụ 123456789:AA…)"),
  channelUsername: z
    .string()
    .trim()
    .regex(/^@[A-Za-z][A-Za-z0-9_]{4,31}$/, "Nhập tên kênh dạng @ten_kenh"),
});

export type TelegramConnectValues = z.infer<typeof telegramConnectSchema>;
