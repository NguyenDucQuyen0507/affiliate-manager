// Schedule page tabs <-> URL (pure; safe for server and client components).

import type { PostStatus } from "@/lib/types";

export type ScheduleTab = "upcoming" | "published" | "failed";

export const scheduleTabs: { value: ScheduleTab; label: string; status: PostStatus }[] = [
  { value: "upcoming", label: "Sắp tới", status: "PENDING" },
  { value: "published", label: "Đã đăng", status: "PUBLISHED" },
  { value: "failed", label: "Lỗi", status: "FAILED" },
];

export function parseScheduleTab(value: string | string[] | undefined): ScheduleTab {
  const tab = Array.isArray(value) ? value[0] : value;
  return scheduleTabs.some((t) => t.value === tab) ? (tab as ScheduleTab) : "upcoming";
}

export function scheduleTabHref(tab: ScheduleTab) {
  return tab === "upcoming" ? "/dashboard/schedule" : `/dashboard/schedule?tab=${tab}`;
}
