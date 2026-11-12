// Deal editor form schema, shared by the client form and the server action.

import { z } from "zod";
import { detectMarketplace } from "@/lib/labels";
import type { Channel, Deal } from "@/lib/types";

export const dealIntents = ["draft", "schedule"] as const;
export type DealIntent = (typeof dealIntents)[number];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const targetSchema = z.object({
  channelId: z.string().min(1),
  enabled: z.boolean(),
  /** "YYYY-MM-DDTHH:mm" or "" when not chosen. */
  scheduledAt: z.string().refine((v) => v === "" || DATE_TIME_RE.test(v), "Giờ đăng không hợp lệ"),
  /** Set for posts that already went out; they can no longer be changed. */
  locked: z.boolean(),
});

/**
 * "Lưu nháp" only needs a product name; "Lên lịch đăng" needs everything required
 * to actually publish (link, price, caption, at least one channel with a time).
 */
export const dealFormSchema = z
  .object({
    intent: z.enum(dealIntents),
    affiliateUrl: z.string().trim().max(2000),
    title: z.string().trim().min(1, "Nhập tên sản phẩm").max(200, "Tên tối đa 200 ký tự"),
    price: z.number().int().positive("Giá phải lớn hơn 0").nullable(),
    originalPrice: z.number().int().positive("Giá phải lớn hơn 0").nullable(),
    searchCode: z
      .string()
      .trim()
      .max(32, "Mã tối đa 32 ký tự")
      .regex(/^[A-Za-z0-9_-]*$/, "Chỉ dùng chữ không dấu, số, - và _"),
    expiresAt: z.string().refine((v) => v === "" || DATE_RE.test(v), "Ngày không hợp lệ"),
    caption: z.string().max(2000, "Caption tối đa 2000 ký tự"),
    showOnBio: z.boolean(),
    targets: z.array(targetSchema),
  })
  .superRefine((values, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (values.affiliateUrl && !detectMarketplace(values.affiliateUrl)) {
      issue(["affiliateUrl"], "Link phải là link Shopee, TikTok Shop hoặc Lazada");
    }
    if (values.price && values.originalPrice && values.originalPrice < values.price) {
      issue(["originalPrice"], "Giá gốc phải lớn hơn hoặc bằng giá khuyến mãi");
    }

    if (values.intent !== "schedule") return;

    if (!values.affiliateUrl) issue(["affiliateUrl"], "Dán link affiliate để lên lịch đăng");
    if (!values.price) issue(["price"], "Nhập giá khuyến mãi");
    if (!values.caption.trim()) issue(["caption"], "Nhập caption cho bài đăng");

    const enabled = values.targets.filter((t) => t.enabled);
    if (enabled.length === 0 && !values.showOnBio) {
      issue(["targets", "root"], "Chọn ít nhất một kênh để đăng");
    }
    values.targets.forEach((target, index) => {
      if (!target.enabled || target.locked) return;
      if (!target.scheduledAt) {
        issue(["targets", index, "scheduledAt"], "Chọn giờ đăng");
      } else if (values.expiresAt && target.scheduledAt.slice(0, 10) > values.expiresAt) {
        issue(["targets", index, "scheduledAt"], "Giờ đăng phải trước ngày hết hạn");
      }
    });
  });

export type DealFormValues = z.infer<typeof dealFormSchema>;

/** Form defaults for a new deal, or for editing an existing one. */
export function getDealFormDefaults(channels: Channel[], deal?: Deal | null): DealFormValues {
  return {
    intent: "draft",
    affiliateUrl: deal?.affiliateUrl ?? "",
    title: deal?.title ?? "",
    price: deal?.price ?? null,
    originalPrice: deal?.originalPrice ?? null,
    searchCode: deal?.searchCode ?? "",
    expiresAt: deal?.expiresAt ?? "",
    caption: deal?.caption ?? "",
    showOnBio: deal?.showOnBio ?? false,
    targets: channels.map((channel) => {
      const post = deal?.posts.find((p) => p.channelId === channel.id);
      return {
        channelId: channel.id,
        enabled: Boolean(post),
        scheduledAt: post?.scheduledAt ?? "",
        locked: post?.status === "PUBLISHED",
      };
    }),
  };
}
