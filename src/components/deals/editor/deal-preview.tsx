"use client";

import { useSyncExternalStore } from "react";
import { useWatch, type Control } from "react-hook-form";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DealFormValues } from "@/lib/deal-schema";
import { formatPrice, formatScheduleLabel, formatShortDate, formatTime, todayKey } from "@/lib/format";
import { detectMarketplace, marketplaceLabel } from "@/lib/labels";
import type { Channel, ChannelType } from "@/lib/types";
import type { EditorImage } from "./image-picker";

// TODO: replace with the real public Bio URL once the domain is configured.
const BIO_URL_LABEL = "[tên-miền]/bio";

const noopSubscribe = () => () => {};

/** Today's date (app time zone); null during server render to avoid a hydration mismatch. */
function useToday() {
  return useSyncExternalStore(noopSubscribe, todayKey, () => null);
}

export function DealPreview({
  control,
  channels,
  images,
}: {
  control: Control<DealFormValues>;
  channels: Channel[];
  images: EditorImage[];
}) {
  const values = useWatch({ control }) as DealFormValues;
  const today = useToday();
  const imageUrl = images[0]?.url ?? null;

  // First enabled target per channel type drives that tab's preview.
  function pickTarget(type: ChannelType) {
    const enabled = values.targets.find(
      (t) => t.enabled && channels.find((c) => c.id === t.channelId)?.type === type,
    );
    const channel =
      channels.find((c) => c.id === enabled?.channelId) ?? channels.find((c) => c.type === type);
    return { channel, scheduledAt: enabled?.scheduledAt ?? "", selected: Boolean(enabled) };
  }

  const fb = pickTarget("FACEBOOK");
  const tg = pickTarget("TELEGRAM");
  const marketplace = detectMarketplace(values.affiliateUrl);
  const title = values.title.trim() || "[Tên sản phẩm]";

  return (
    <Tabs defaultValue="facebook" className="gap-4">
      <TabsList className="w-full" aria-label="Kênh xem trước">
        <TabsTrigger value="facebook" className="min-h-10">Facebook</TabsTrigger>
        <TabsTrigger value="telegram" className="min-h-10">Telegram</TabsTrigger>
        <TabsTrigger value="bio" className="min-h-10">Bio link</TabsTrigger>
      </TabsList>

      <TabsContent value="facebook" className="flex flex-col gap-2">
        {!fb.selected && <PreviewNote>Chưa chọn trang Facebook nào. Đây là bản xem thử.</PreviewNote>}
        <div className="overflow-hidden rounded-[12px] border bg-card">
          <div className="flex items-center gap-2.5 px-3.5 py-3">
            <PageAvatar name={fb.channel?.name ?? "F"} className="size-10" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{fb.channel?.name ?? "Trang Facebook"}</span>
              <span className="text-xs text-muted-foreground">
                {fb.scheduledAt ? formatScheduleLabel(fb.scheduledAt, today) : "Chưa chọn giờ"}
              </span>
            </div>
          </div>
          <Caption text={values.caption} className="px-3.5 pb-3" />
          <ProductThumbnail url={imageUrl} sizes="400px" className="h-[260px]" />
          <div className="flex gap-2.5 border-t border-muted-track bg-table-head px-3.5 py-3">
            <PageAvatar name={fb.channel?.name ?? "F"} className="size-8 flex-none" />
            <div className="flex min-w-0 flex-col gap-0.5 rounded-[12px] bg-muted px-3 py-2">
              <span className="text-xs font-semibold">
                {fb.channel?.name ?? "Trang Facebook"} · Bình luận ghim
              </span>
              <span className="text-[13px] break-all text-secondary-foreground">
                Link mua: {shortUrl(values.affiliateUrl) || "[link affiliate]"} · Xem thêm deal:{" "}
                {BIO_URL_LABEL}
              </span>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="telegram" className="flex flex-col gap-2">
        {!tg.selected && <PreviewNote>Chưa chọn kênh Telegram. Đây là bản xem thử.</PreviewNote>}
        <div className="rounded-[12px] bg-preview-telegram p-4">
          <div className="max-w-[340px] overflow-hidden rounded-[12px] bg-card">
            <ProductThumbnail url={imageUrl} sizes="340px" className="h-[220px]" />
            <div className="flex flex-col gap-1.5 px-3 py-2.5">
              <span className="text-sm font-bold">{title}</span>
              <PriceLine values={values} />
              <Caption text={values.caption} className="text-[13px] leading-normal text-secondary-foreground" />
              {values.searchCode && (
                <span className="text-[13px] text-secondary-foreground">
                  Mã tìm kiếm: {values.searchCode}
                </span>
              )}
              <span className="self-end text-[11px] text-subtle">
                {tg.scheduledAt ? formatTime(tg.scheduledAt) : "--:--"}
              </span>
            </div>
          </div>
          <div className="mt-1.5 max-w-[340px] rounded-[10px] bg-card/70 p-2.5 text-center text-sm font-semibold text-info">
            Mua trên {marketplace ? marketplaceLabel[marketplace] : "sàn"}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="bio" className="flex flex-col gap-2">
        {!values.showOnBio && <PreviewNote>Deal này chưa bật hiện trên trang Bio link.</PreviewNote>}
        <div className="rounded-[12px] bg-bio-background p-4">
          <div className="flex overflow-hidden rounded-xl border border-bio-border bg-card">
            <ProductThumbnail url={imageUrl} sizes="110px" className="w-[110px]" />
            <div className="flex min-w-0 flex-col gap-1.5 px-3.5 py-3">
              <span className="text-sm font-bold">{title}</span>
              <span className="text-sm">
                <strong className="text-primary">
                  {values.price ? formatPrice(values.price) : "[Giá]"}
                </strong>{" "}
                {values.originalPrice && (
                  <span className="text-[13px] text-muted-foreground line-through">
                    {formatPrice(values.originalPrice)}
                  </span>
                )}
              </span>
              {values.expiresAt && (
                <span className="text-xs text-muted-foreground">
                  Còn hạn đến {formatShortDate(values.expiresAt)}
                </span>
              )}
              <span className="inline-flex min-h-9 items-center self-start rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground">
                Mua ngay
              </span>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function PriceLine({ values }: { values: DealFormValues }) {
  return (
    <span className="text-sm">
      <strong>{values.price ? formatPrice(values.price) : "[Giá]"}</strong>{" "}
      {values.originalPrice && (
        <span className="text-muted-foreground line-through">{formatPrice(values.originalPrice)}</span>
      )}
      {values.expiresAt && <> · hết hạn {formatShortDate(values.expiresAt)}</>}
    </span>
  );
}

function Caption({ text, className }: { text: string; className?: string }) {
  return (
    <p className={`text-sm leading-[1.55] whitespace-pre-line ${className ?? ""}`}>
      {text.trim() || <span className="text-subtle">Caption sẽ hiện ở đây.</span>}
    </p>
  );
}

function PageAvatar({ name, className }: { name: string; className: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-accent-foreground ${className}`}
      aria-hidden="true"
    >
      {name.replace(/^\[/, "").charAt(0).toUpperCase()}
    </div>
  );
}

function PreviewNote({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-muted-foreground">{children}</p>;
}

/** "https://s.shopee.vn/abc" → "s.shopee.vn/abc" */
function shortUrl(url: string) {
  return url.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
}
