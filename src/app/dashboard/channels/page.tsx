import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddChannelDialog } from "@/components/channels/add-channel-dialog";
import { ChangeThemeButton, CopyField } from "@/components/channels/bio-card-actions";
import {
  ChannelSettingsDialog,
  ReconnectFacebookButton,
  TestPostButton,
} from "@/components/channels/channel-actions";
import { ChannelIcon } from "@/components/channels/channel-icon";
import { getBioPageStatus, getBioUrl, getChannels, getLastPublishedAtByChannel } from "@/lib/channels";
import { formatRelativeDateTime, todayKey } from "@/lib/format";
import { bioPageStatusMeta, type StatusMeta } from "@/lib/status";
import type { Channel } from "@/lib/types";

export const metadata: Metadata = {
  title: "Kênh kết nối – Affiliate Manager",
};

const cardClass = "gap-3.5 p-4 sm:p-6";

export default function ChannelsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[30px] leading-tight font-bold tracking-[-0.01em]">Kênh kết nối</h1>
          <p className="text-sm text-muted-foreground">
            Token được mã hóa và chỉ lưu trên máy chủ, không bao giờ hiện lại trên giao diện.
          </p>
        </div>
        <AddChannelDialog />
      </header>

      <Suspense fallback={<ChannelsSkeleton />}>
        <ChannelGrid />
      </Suspense>
    </div>
  );
}

async function ChannelGrid() {
  // "Lần đăng cuối" is shown relative to today, so render per request.
  await connection();
  const today = todayKey();
  const [channels, lastPublished, bioStatus] = await Promise.all([
    getChannels(),
    getLastPublishedAtByChannel(),
    getBioPageStatus(),
  ]);
  const bioUrl = getBioUrl();

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-5">
      {channels.map((channel) => (
        <ChannelCard
          key={channel.id}
          channel={channel}
          lastPublished={lastPublished[channel.id] ? formatRelativeDateTime(lastPublished[channel.id], today) : null}
        />
      ))}

      <Card role="region" aria-labelledby="channel-bio" className={cardClass}>
        <CardHeading
          id="channel-bio"
          icon={<ChannelIcon kind="BIO" />}
          title="Trang Bio link"
          subtitle="Trang công khai của bạn"
          status={bioPageStatusMeta[bioStatus]}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bio-url" className="text-sm font-semibold">
            Địa chỉ trang
          </label>
          <CopyField id="bio-url" value={bioUrl.label} />
        </div>
        <CardActions>
          <Button asChild variant="outline" size="row">
            <Link href={bioUrl.href} target="_blank">
              Xem trang
            </Link>
          </Button>
          <ChangeThemeButton />
        </CardActions>
      </Card>

      <section
        aria-labelledby="channel-other"
        className="flex flex-col justify-center gap-2.5 rounded-xl border-[1.5px] border-dashed border-border-strong p-4 sm:p-6"
      >
        <h2 id="channel-other" className="text-base font-semibold">
          Kênh khác
        </h2>
        <p className="text-sm leading-normal text-muted-foreground">
          Kiến trúc kênh dạng plugin: X (Twitter), Zalo OA hay Discord có thể thêm sau mà không đổi phần còn lại.
        </p>
      </section>
    </div>
  );
}

/** Channel cards call out an expired token directly (the dashboard says "Cần kết nối lại"). */
const cardStatusMeta: Record<Channel["status"], StatusMeta> = {
  ACTIVE: { label: "Hoạt động", variant: "success" },
  NEEDS_RECONNECT: { label: "Token hết hạn", variant: "warning" },
  DISCONNECTED: { label: "Đã ngắt kết nối", variant: "neutral" },
};

function ChannelCard({ channel, lastPublished }: { channel: Channel; lastPublished: string | null }) {
  const headingId = `channel-${channel.id}`;
  const isFacebook = channel.type === "FACEBOOK";
  const platform = isFacebook ? "Facebook" : "Telegram";

  return (
    <Card role="region" aria-labelledby={headingId} className={cardClass}>
      <CardHeading
        id={headingId}
        icon={<ChannelIcon kind={channel.type} />}
        title={channel.name}
        subtitle={isFacebook ? "Facebook Fanpage" : "Telegram channel · qua bot"}
        status={cardStatusMeta[channel.status]}
      />

      {channel.status === "NEEDS_RECONNECT" ? (
        <p className="text-sm leading-normal text-secondary-foreground">
          Bài mới cho {isFacebook ? "trang" : "kênh"} này đang tạm dừng. Kết nối lại để tiếp tục hàng đợi.
        </p>
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Kiểu đăng</dt>
          <dd>
            {isFacebook ? "Ảnh + caption, link trong bình luận ghim" : "Ảnh + caption + nút “Mua ngay”"}
          </dd>
          {isFacebook ? (
            <>
              <dt className="text-muted-foreground">Lần đăng cuối</dt>
              <dd>{lastPublished ?? "Chưa có bài nào"}</dd>
            </>
          ) : (
            <>
              <dt className="text-muted-foreground">Bot</dt>
              <dd>{channel.botUsername ?? "Chưa có bot"} · token đã lưu</dd>
            </>
          )}
        </dl>
      )}

      <CardActions>
        {channel.status === "NEEDS_RECONNECT" && isFacebook ? (
          <ReconnectFacebookButton />
        ) : (
          <TestPostButton channelId={channel.id} platform={platform} />
        )}
        <ChannelSettingsDialog channelId={channel.id} name={channel.name} />
      </CardActions>
    </Card>
  );
}

function CardHeading({
  id,
  icon,
  title,
  subtitle,
  status,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: StatusMeta;
}) {
  return (
    <div className="flex items-center justify-between gap-2.5">
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div className="flex min-w-0 flex-col">
          <h2 id={id} className="truncate text-base font-semibold">
            {title}
          </h2>
          <span className="text-[13px] text-muted-foreground">{subtitle}</span>
        </div>
      </div>
      <Badge variant={status.variant}>{status.label}</Badge>
    </div>
  );
}

function CardActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-auto flex flex-wrap gap-2">{children}</div>;
}

function ChannelsSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-5">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[210px] rounded-xl bg-muted-track" />
      ))}
    </div>
  );
}
