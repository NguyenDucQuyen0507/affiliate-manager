import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";
import type {
  BioPageStatus,
  ChannelStatus,
  Deal,
  DealStatus,
  PostStatus,
} from "@/lib/types";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;
export type StatusMeta = { label: string; variant: BadgeVariant };

export const postStatusMeta: Record<PostStatus, StatusMeta> = {
  PUBLISHED: { label: "Đã đăng", variant: "success" },
  PENDING: { label: "Chờ đăng", variant: "info" },
  FAILED: { label: "Lỗi", variant: "danger" },
};

export const channelStatusMeta: Record<ChannelStatus, StatusMeta> = {
  ACTIVE: { label: "Hoạt động", variant: "success" },
  NEEDS_RECONNECT: { label: "Cần kết nối lại", variant: "warning" },
  DISCONNECTED: { label: "Đã ngắt kết nối", variant: "neutral" },
};

export const bioPageStatusMeta: Record<BioPageStatus, StatusMeta> = {
  PUBLIC: { label: "Công khai", variant: "success" },
  HIDDEN: { label: "Đang ẩn", variant: "neutral" },
};

export const dealStatusMeta: Record<DealStatus, StatusMeta> = {
  ACTIVE: { label: "Đang chạy", variant: "success" },
  DRAFT: { label: "Nháp", variant: "neutral" },
  EXPIRED: { label: "Hết hạn", variant: "warning" },
};

export function countPostsByStatus(deal: Deal): Record<PostStatus, number> {
  const counts: Record<PostStatus, number> = { PENDING: 0, PUBLISHED: 0, FAILED: 0 };
  for (const post of deal.posts) counts[post.status] += 1;
  return counts;
}

/**
 * Badge shown in the deal table. Draft/expired deals show their status. For active
 * deals, failed posts take priority so they get noticed; a deal that is not visible
 * anywhere yet (nothing published, not on Bio) but has queued posts is "scheduled".
 */
export function getDealBadge(deal: Deal): StatusMeta {
  if (deal.status !== "ACTIVE") return dealStatusMeta[deal.status];
  const { FAILED, PENDING, PUBLISHED } = countPostsByStatus(deal);
  if (FAILED > 0) return { label: `${FAILED} bài lỗi`, variant: "danger" };
  if (PUBLISHED === 0 && !deal.showOnBio && PENDING > 0) {
    return { label: "Đã lên lịch", variant: "info" };
  }
  return dealStatusMeta.ACTIVE;
}
