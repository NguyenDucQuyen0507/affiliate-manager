import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { RetryButton } from "@/components/schedule/post-actions";
import { requireAdmin } from "@/lib/auth-guard";
import { getBioPageStatus, getChannels } from "@/lib/channels";
import { getDealStats } from "@/lib/deals";
import {
  formatRelativeDateTime,
  formatShortDate,
  formatTime,
  nowInAppTimeZone,
  weekdayLabel,
} from "@/lib/format";
import { channelDisplayName, channelTypeLabel } from "@/lib/labels";
import { getPostCounts, getPostsByStatus, getPostsOnDate, type QueuePost } from "@/lib/posts";
import {
  bioPageStatusMeta,
  channelStatusMeta,
  postStatusMeta,
  type StatusMeta,
} from "@/lib/status";

export const metadata: Metadata = {
  title: "Tổng quan – Affiliate Manager",
};

const sectionTitle = "font-heading text-lg font-semibold";

type Kpi = {
  label: string;
  value: number;
  hint: string;
  /** Highlights the card in danger colors and turns the hint into a link. */
  href?: string;
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardView />
    </Suspense>
  );
}

async function DashboardView() {
  // "Today" and "next post" depend on the current time, so render per request.
  await connection();
  const now = nowInAppTimeZone();
  const today = now.date;
  const admin = await requireAdmin();

  const [dealStats, counts, todayPosts, pending, failed, channels, bioStatus] = await Promise.all([
    getDealStats(admin.id, today),
    getPostCounts(admin.id),
    getPostsOnDate(admin.id, today),
    getPostsByStatus(admin.id, "PENDING"),
    getPostsByStatus(admin.id, "FAILED"),
    getChannels(),
    getBioPageStatus(),
  ]);

  const publishedToday = todayPosts.filter((post) => post.status === "PUBLISHED");
  const publishedChannels = new Set(publishedToday.map((post) => post.channelId)).size;
  const nextPost = pending.find((post) => post.scheduledAt >= now.dateTime);

  const kpis: Kpi[] = [
    {
      label: "Deal đang chạy",
      value: dealStats.active,
      hint:
        dealStats.expiringThisWeek > 0
          ? `${dealStats.expiringThisWeek} deal hết hạn trong tuần này`
          : "Không có deal hết hạn trong tuần này",
    },
    {
      label: "Đã đăng hôm nay",
      value: publishedToday.length,
      hint: publishedToday.length > 0 ? `Trên ${publishedChannels} kênh` : "Chưa có bài nào",
    },
    {
      label: "Đang chờ đăng",
      value: counts.PENDING,
      hint: !nextPost
        ? "Hàng đợi trống"
        : nextPost.scheduledAt.startsWith(today)
          ? `Bài kế tiếp lúc ${formatTime(nextPost.scheduledAt)}`
          : `Bài kế tiếp: ${formatShortDate(nextPost.scheduledAt)} ${formatTime(nextPost.scheduledAt)}`,
    },
    counts.FAILED > 0
      ? {
          label: "Lỗi cần xử lý",
          value: counts.FAILED,
          hint: "Xem và đăng lại",
          href: "/dashboard/schedule?tab=failed",
        }
      : { label: "Lỗi cần xử lý", value: 0, hint: "Không có bài lỗi" },
  ];

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Tổng quan"
        description={`${weekdayLabel(today)}, ${formatShortDate(today)}`}
      />

      <section aria-label="Chỉ số chính" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <Card role="region" aria-labelledby="today-title" className="min-w-0 flex-[2_1_520px] gap-1 p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="today-title" className={sectionTitle}>
              Lịch đăng hôm nay
            </h2>
            <Link
              href="/dashboard/schedule"
              className="text-sm font-semibold text-primary underline underline-offset-2 hover:text-primary-hover"
            >
              Xem tất cả
            </Link>
          </div>
          {todayPosts.length === 0 ? (
            <p className="border-t border-muted py-6 text-center text-sm text-muted-foreground">
              Hôm nay chưa có bài nào được lên lịch.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {mergeTimelineRows(todayPosts).map((row) => (
                <TimelineRow key={row.key} row={row} />
              ))}
            </ul>
          )}
        </Card>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-6">
          <Card role="region" aria-labelledby="fix-title" className="gap-3.5 p-4 sm:p-6">
            <h2 id="fix-title" className={sectionTitle}>
              Cần xử lý
            </h2>
            {failed.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có bài đăng lỗi nào.</p>
            ) : (
              failed.map((post) => <FailedPostCard key={post.id} post={post} today={today} />)
            )}
          </Card>

          <Card role="region" aria-labelledby="ch-title" className="gap-3.5 p-4 sm:p-6">
            <h2 id="ch-title" className={sectionTitle}>
              Kênh
            </h2>
            <ul className="flex flex-col gap-3.5">
              {channels.map((channel) => (
                <ChannelRow
                  key={channel.id}
                  label={channelDisplayName(channel)}
                  status={channelStatusMeta[channel.status]}
                />
              ))}
              <ChannelRow label="Trang Bio link" status={bioPageStatusMeta[bioStatus]} />
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

type TimelineRowData = {
  key: string;
  time: string;
  dealTitle: string;
  channelLabel: string;
  status: QueuePost["status"];
  imageUrl: string | null;
};

/** One row per deal × time × status, listing every channel it goes to. */
function mergeTimelineRows(posts: QueuePost[]): TimelineRowData[] {
  const rows = new Map<string, TimelineRowData>();
  for (const post of posts) {
    const key = `${post.dealId}|${post.scheduledAt}|${post.status}`;
    const existing = rows.get(key);
    if (existing) {
      existing.channelLabel += ` · ${channelDisplayName(post.channel)}`;
    } else {
      rows.set(key, {
        key,
        time: formatTime(post.scheduledAt),
        dealTitle: post.dealTitle,
        channelLabel: channelDisplayName(post.channel),
        status: post.status,
        imageUrl: post.imageUrl,
      });
    }
  }
  return [...rows.values()];
}

function TimelineRow({ row }: { row: TimelineRowData }) {
  const status = postStatusMeta[row.status];
  return (
    <li className="grid grid-cols-[48px_48px_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-muted py-3 sm:grid-cols-[64px_48px_minmax(0,1fr)_auto]">
      <span className="text-sm font-semibold text-muted-foreground tabular-nums">{row.time}</span>
      <ProductThumbnail url={row.imageUrl} sizes="48px" className="size-12 rounded-lg" />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-semibold sm:truncate">{row.dealTitle}</span>
        <span className="text-[13px] text-muted-foreground sm:truncate">{row.channelLabel}</span>
      </div>
      <Badge variant={status.variant}>{status.label}</Badge>
    </li>
  );
}

function FailedPostCard({ post, today }: { post: QueuePost; today: string }) {
  const needsReconnect = post.channel.status === "NEEDS_RECONNECT";
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-danger-soft p-3.5">
      <span className="text-sm font-semibold">{post.dealTitle}</span>
      <span className="text-[13px] text-danger-strong">
        {channelTypeLabel[post.channel.type]}: {post.errorMessage ?? "Đăng không thành công"}
      </span>
      <span className="sr-only">Thời gian: {formatRelativeDateTime(post.scheduledAt, today)}</span>
      <div className="flex flex-wrap gap-2">
        <RetryButton postId={post.id} label={`${post.dealTitle} · ${channelDisplayName(post.channel)}`} />
        <Link
          href="/dashboard/channels"
          className="inline-flex min-h-10 items-center px-3.5 text-[13px] font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          {needsReconnect ? "Kết nối lại" : "Kiểm tra kênh"}
        </Link>
      </div>
    </div>
  );
}

function ChannelRow({ label, status }: { label: string; status: StatusMeta }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <Badge variant={status.variant}>{status.label}</Badge>
    </li>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const danger = Boolean(kpi.href);
  return (
    <Card className={cn("gap-2.5 p-4 sm:p-5", danger && "bg-danger-soft ring-danger-border")}>
      <span className={cn("text-[13px] font-medium text-muted-foreground", danger && "font-semibold text-danger")}>
        {kpi.label}
      </span>
      <span className={cn("font-heading text-[34px] leading-none font-bold", danger && "text-danger")}>
        {kpi.value}
      </span>
      {kpi.href ? (
        <Link href={kpi.href} className="text-[13px] font-semibold text-danger underline underline-offset-2">
          {kpi.hint}
        </Link>
      ) : (
        <span className="text-[13px] text-muted-foreground">{kpi.hint}</span>
      )}
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-7">
      <Skeleton className="h-[72px] w-full max-w-md bg-muted-track" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[132px] rounded-xl bg-muted-track" />
        ))}
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <Skeleton className="h-[460px] min-w-0 flex-[2_1_520px] rounded-xl bg-muted-track" />
        <Skeleton className="h-[460px] min-w-0 flex-[1_1_300px] rounded-xl bg-muted-track" />
      </div>
    </div>
  );
}
