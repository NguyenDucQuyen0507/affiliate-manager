import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PendingPostActions, RetryAllButton, RetryButton } from "@/components/schedule/post-actions";
import { ScheduleTabs } from "@/components/schedule/schedule-tabs";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { formatDayHeading, formatRelativeDateTime, formatTime, todayKey } from "@/lib/format";
import { channelDisplayName, channelTypeLabel } from "@/lib/labels";
import { requireAdmin } from "@/lib/auth-guard";
import { getPostCounts, getPostsByStatus, type QueuePost } from "@/lib/posts";
import { parseScheduleTab, scheduleTabs } from "@/lib/schedule-tabs";
import { postStatusMeta } from "@/lib/status";

export const metadata: Metadata = {
  title: "Lịch đăng – Affiliate Manager",
};

export default function SchedulePage({ searchParams }: PageProps<"/dashboard/schedule">) {
  return (
    <Suspense fallback={<ScheduleSkeleton />}>
      <ScheduleView searchParams={searchParams} />
    </Suspense>
  );
}

function ScheduleTitle() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-heading text-[30px] leading-tight font-bold tracking-[-0.01em]">Lịch đăng</h1>
      <p className="text-sm text-muted-foreground">
        Mỗi dòng là một bài trên một kênh. Hệ thống kiểm tra hàng đợi mỗi phút.
      </p>
    </div>
  );
}

async function ScheduleView({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard/schedule">["searchParams"];
}) {
  const tab = parseScheduleTab((await searchParams).tab);
  // Render at request time: "today" and the queue change every minute.
  await connection();
  const admin = await requireAdmin();
  const status = scheduleTabs.find((t) => t.value === tab)!.status;
  const today = todayKey();
  const [counts, failed, posts] = await Promise.all([
    getPostCounts(admin.id),
    getPostsByStatus(admin.id, "FAILED"),
    tab === "failed" ? Promise.resolve([]) : getPostsByStatus(admin.id, status),
  ]);

  // Failures need attention, so they stay on top of the upcoming queue as well.
  const showFailedPanel = tab === "failed" || (tab === "upcoming" && failed.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <ScheduleTitle />
        <ScheduleTabs value={tab} counts={counts} />
      </header>

      {showFailedPanel && <FailedPanel posts={failed} today={today} />}

      {tab !== "failed" &&
        (posts.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          groupByDay(posts).map(([date, dayPosts]) => (
            <DayGroup
              key={date}
              heading={formatDayHeading(date, today)}
              posts={dayPosts}
              withActions={tab === "upcoming"}
            />
          ))
        ))}
    </div>
  );
}

/** Groups posts by date, keeping the incoming order. */
function groupByDay(posts: QueuePost[]) {
  const groups = new Map<string, QueuePost[]>();
  for (const post of posts) {
    const date = post.scheduledAt.slice(0, 10);
    groups.set(date, [...(groups.get(date) ?? []), post]);
  }
  return [...groups.entries()];
}

/** "Bình sữa chống sặc 240ml · Telegram, [Tên kênh]" */
function postLabel(post: QueuePost) {
  return `${post.dealTitle} · ${channelTypeLabel[post.channel.type]}, ${post.channel.name}`;
}

function FailedPanel({ posts, today }: { posts: QueuePost[]; today: string }) {
  if (posts.length === 0) {
    return (
      <Card className="items-center p-10 text-center text-sm text-muted-foreground">
        Không có bài đăng lỗi nào.
      </Card>
    );
  }

  return (
    <section
      aria-labelledby="failed-title"
      className="flex flex-col gap-3 rounded-xl border border-danger-border bg-danger-soft px-4 py-5 sm:px-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="failed-title" className="font-heading text-lg font-semibold text-danger-strong">
          {posts.length} bài đăng lỗi
        </h2>
        <RetryAllButton />
      </div>
      <ul className="flex flex-col gap-3">
        {posts.map((post) => (
          <li
            key={post.id}
            className="flex flex-col gap-2 rounded-lg bg-card px-4 py-3 sm:grid sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
          >
            <span className="text-sm font-semibold text-muted-foreground">
              {formatRelativeDateTime(post.scheduledAt, today)}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-semibold">{postLabel(post)}</span>
              {post.errorMessage && <span className="text-[13px] text-danger-strong">{post.errorMessage}</span>}
            </div>
            <div className="sm:justify-self-end">
              <RetryButton postId={post.id} label={postLabel(post)} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DayGroup({
  heading,
  posts,
  withActions,
}: {
  heading: string;
  posts: QueuePost[];
  withActions: boolean;
}) {
  const id = `day-${posts[0].scheduledAt.slice(0, 10)}`;
  return (
    <section aria-labelledby={id} className="overflow-hidden rounded-xl border bg-card">
      <h2
        id={id}
        className="border-b border-muted-track bg-table-head px-4 py-4 font-heading text-base font-semibold sm:px-6"
      >
        {heading}
      </h2>
      <div className="overflow-x-auto">
        <ul className="min-w-[780px]">
          {posts.map((post) => {
            const status = postStatusMeta[post.status];
            return (
              <li
                key={post.id}
                className="grid grid-cols-[70px_44px_minmax(0,1fr)_200px_110px_auto] items-center gap-4 border-b border-muted px-4 py-3.5 last:border-b-0 sm:px-6"
              >
                <span className="text-[15px] font-bold tabular-nums">{formatTime(post.scheduledAt)}</span>
                <ProductThumbnail url={post.imageUrl} sizes="44px" className="size-11 rounded-md" />
                <Link
                  href={`/dashboard/deals/${post.dealId}`}
                  className="truncate text-sm font-semibold hover:text-primary hover:underline"
                >
                  {post.dealTitle}
                </Link>
                <span className="truncate text-sm text-muted-foreground">
                  {channelDisplayName(post.channel)}
                </span>
                <Badge variant={status.variant} className="justify-self-start">
                  {status.label}
                </Badge>
                {withActions ? (
                  <PendingPostActions postId={post.id} label={postLabel(post)} />
                ) : (
                  <span />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function EmptyState({ tab }: { tab: "upcoming" | "published" }) {
  return (
    <Card className="items-center gap-2 p-10 text-center">
      <p className="text-sm text-muted-foreground">
        {tab === "upcoming" ? "Chưa có bài nào trong hàng đợi." : "Chưa có bài nào được đăng."}
      </p>
      {tab === "upcoming" && (
        <Link
          href="/dashboard/deals"
          className="text-sm font-semibold text-primary underline underline-offset-2 hover:text-primary-hover"
        >
          Chọn deal để lên lịch
        </Link>
      )}
    </Card>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <ScheduleTitle />
        <Skeleton className="h-11 w-[300px] max-w-full rounded-lg bg-muted-track" />
      </header>
      <Skeleton className="h-[220px] rounded-xl bg-muted-track" />
      <Skeleton className="h-[320px] rounded-xl bg-muted-track" />
    </div>
  );
}
