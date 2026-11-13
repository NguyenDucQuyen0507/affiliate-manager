// Deal editor form schema, shared by the client form and the server action.

import { z } from "zod";
import { todayKey } from "@/lib/format";
import { AFFILIATE_URL_ERROR, isAllowedAffiliateUrl } from "@/lib/labels";
import type { Channel, Deal } from "@/lib/types";

/** "publish" = "Lưu & đăng ngay": like "schedule", but every chosen channel goes out now. */
export const dealIntents = ["draft", "schedule", "publish"] as const;
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
 * "Lưu & đăng ngay" needs the same, except times (posts go out now).
 */
export const dealFormSchema = z
  .object({
    intent: z.enum(dealIntents),
    affiliateUrl: z.string().trim().max(2000),
    title: z.string().trim().min(1, "Nhập tên sản phẩm").max(200, "Tên tối đa 200 ký tự"),
    category: z.string().trim().max(50, "Danh mục tối đa 50 ký tự"),
    price: z.number().int().positive("Giá phải lớn hơn 0").nullable(),
    originalPrice: z.number().int().positive("Giá phải lớn hơn 0").nullable(),
    searchCode: z
      .string()
      .trim()
      .max(32, "Mã tối đa 32 ký tự")
      .regex(/^[A-Za-z0-9_-]*$/, "Chỉ dùng chữ không dấu, số, - và _"),
    expiresAt: z.string().refine((v) => v === "" || DATE_RE.test(v), "Ngày không hợp lệ"),
    caption: z.string().max(2000, "Caption tối đa 2000 ký tự"),
    note: z.string().trim().max(280, "Nhận xét tối đa 280 ký tự"),
    showOnBio: z.boolean(),
    isFeatured: z.boolean(),
    targets: z.array(targetSchema),
  })
  .superRefine((values, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (values.affiliateUrl && !isAllowedAffiliateUrl(values.affiliateUrl)) {
      issue(["affiliateUrl"], AFFILIATE_URL_ERROR);
    }
    if (values.price && values.originalPrice && values.originalPrice < values.price) {
      issue(["originalPrice"], "Giá gốc phải lớn hơn hoặc bằng giá khuyến mãi");
    }

    if (values.intent === "draft") return;
    const publishNow = values.intent === "publish";

    if (!values.affiliateUrl) {
      issue(["affiliateUrl"], publishNow ? "Dán link affiliate để đăng" : "Dán link affiliate để lên lịch đăng");
    }
    if (!values.category) issue(["category"], "Nhập danh mục để hiện trên trang Bio");
    if (!values.price) issue(["price"], "Nhập giá khuyến mãi");
    if (!values.caption.trim()) issue(["caption"], "Nhập caption cho bài đăng");
    // An active deal past its expiry date is shown as "Hết hạn" right away.
    if (values.expiresAt && values.expiresAt < todayKey()) {
      issue(["expiresAt"], "Ngày hết hạn đã qua, hãy chọn ngày khác để gia hạn");
    }

    const enabled = values.targets.filter((t) => t.enabled);
    if (publishNow) {
      // Times are ignored: every chosen channel that has not been posted to goes out now.
      if (!enabled.some((t) => !t.locked)) {
        issue(["targets", "root"], "Chọn ít nhất một kênh chưa đăng để đăng ngay");
      }
      return;
    }
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
    category: deal?.category ?? "",
    price: deal?.price ?? null,
    originalPrice: deal?.originalPrice ?? null,
    searchCode: deal?.searchCode ?? "",
    expiresAt: deal?.expiresAt ?? "",
    caption: deal?.caption ?? "",
    note: deal?.note ?? "",
    showOnBio: deal?.showOnBio ?? false,
    isFeatured: deal?.isFeatured ?? false,
    targets: channels.map((channel) => {
      // Prefer the post that can still change; otherwise show the latest one sent.
      const posts = deal?.posts.filter((p) => p.channelId === channel.id) ?? [];
      const post = posts.find((p) => p.status !== "PUBLISHED") ?? posts.at(-1);
      return {
        channelId: channel.id,
        enabled: Boolean(post),
        scheduledAt: post?.scheduledAt ?? "",
        locked: post?.status === "PUBLISHED",
      };
    }),
  };
}
