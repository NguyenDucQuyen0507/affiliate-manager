// Public Bio page sections (Server Components; links instead of client state, so
// every filter is a shareable URL and works without JavaScript).

import Link from "next/link";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { Button } from "@/components/ui/button";
import type { BioDeal } from "@/lib/bio";
import { bioHref, bioSorts, type BioFilters } from "@/lib/bio-filters";
import { formatPrice, formatShortDate, formatTimeThenDay } from "@/lib/format";
import { marketplaceLabel } from "@/lib/labels";
import { CopyCodeButton } from "./copy-code-button";
import { Countdown } from "./countdown";

const sectionTitleClass = "font-heading text-lg font-bold";

export function BioFilterBar({ filters, categories }: { filters: BioFilters; categories: string[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {categories.length > 1 && (
        <nav
          aria-label="Danh mục"
          className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          <CategoryChip href={bioHref(filters, { category: "" })} active={!filters.category}>
            Tất cả
          </CategoryChip>
          {categories.map((name) => (
            <CategoryChip key={name} href={bioHref(filters, { category: name })} active={filters.category === name}>
              {name}
            </CategoryChip>
          ))}
        </nav>
      )}
      <nav
        aria-label="Sắp xếp và lọc"
        className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        {bioSorts.map((sort) => {
          const active = filters.sort === sort.value;
          return (
            <Link
              key={sort.value}
              // Tapping the active chip again goes back to the default order.
              href={bioHref(filters, { sort: active ? "newest" : sort.value })}
              scroll={false}
              aria-current={active ? "true" : undefined}
              className={cn(
                "inline-flex min-h-9 flex-none items-center rounded-lg border px-3 text-xs font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                active
                  ? "border-primary bg-primary-soft text-primary-hover"
                  : "border-bio-border bg-card text-secondary-foreground hover:border-primary-soft-border",
              )}
            >
              {sort.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function CategoryChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-10 flex-none items-center rounded-full border px-4 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-bio-border bg-card text-secondary-foreground hover:border-primary-soft-border",
      )}
    >
      {children}
    </Link>
  );
}

/** "Shopee · giá kiểm tra lúc 14:00 hôm nay · hết hạn 20/11" */
function DealMeta({ deal, today, showExpiry }: { deal: BioDeal; today: string; showExpiry: boolean }) {
  const parts = [
    marketplaceLabel[deal.marketplace],
    deal.priceCheckedAt
      ? `giá kiểm tra lúc ${formatTimeThenDay(deal.priceCheckedAt, today)}`
      : "giá có thể đã thay đổi",
  ];
  if (showExpiry && deal.expiresAt) parts.push(`hết hạn ${formatShortDate(deal.expiresAt)}`);
  return <p className="text-xs text-muted-foreground">{parts.join(" · ")}</p>;
}

function DiscountBadge({ percent, className }: { percent: number; className?: string }) {
  return (
    <span
      className={cn(
        "absolute top-2 left-2 rounded-full bg-primary px-2 py-[3px] text-xs font-bold text-primary-foreground",
        className,
      )}
    >
      -{percent}%<span className="sr-only"> so với giá gốc</span>
    </span>
  );
}

function Price({ deal, large }: { deal: BioDeal; large?: boolean }) {
  return (
    <p className={large ? "text-[15px]" : "text-sm"}>
      <strong className={cn("text-primary", large && "text-lg")}>{formatPrice(deal.price)}</strong>{" "}
      {deal.originalPrice && deal.discount && (
        <span className="text-[13px] text-muted-foreground line-through">
          <span className="sr-only">Giá gốc </span>
          {formatPrice(deal.originalPrice)}
        </span>
      )}
    </p>
  );
}

function BuyLink({ deal, className }: { deal: BioDeal; className?: string }) {
  return (
    <Button asChild className={cn("rounded-[10px]", className)}>
      <a href={deal.affiliateUrl} target="_blank" rel="sponsored nofollow noopener noreferrer">
        Mua ngay
        <span className="sr-only"> {deal.title} trên {marketplaceLabel[deal.marketplace]}</span>
      </a>
    </Button>
  );
}

export function FeaturedDeals({ deals, today }: { deals: BioDeal[]; today: string }) {
  if (deals.length === 0) return null;
  return (
    <section aria-labelledby="bio-today" className="flex flex-col gap-2.5">
      <h2 id="bio-today" className={sectionTitleClass}>
        Deal hôm nay
      </h2>
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
        {deals.map((deal) => (
          <article
            key={deal.id}
            className="flex flex-col overflow-hidden rounded-[18px] border border-bio-border bg-card"
          >
            <div className="relative">
              <ProductThumbnail url={deal.imageUrl} sizes="(min-width: 1024px) 480px, 100vw" className="h-[230px]" />
              {deal.discount && <DiscountBadge percent={deal.discount} className="top-3 left-3 px-2.5 py-[5px] text-[13px]" />}
              {deal.expiresAt && (
                <Countdown
                  expiresAt={deal.expiresAt}
                  className="absolute top-3 right-3 rounded-full bg-card px-2.5 py-[5px] text-xs font-semibold text-danger"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 px-4 pt-3.5 pb-4">
              <h3 className="text-[17px] leading-snug font-bold">{deal.title}</h3>
              <Price deal={deal} large />
              {deal.note && (
                <p className="rounded-[10px] bg-bio-background px-3 py-2.5 text-[13px] leading-normal text-secondary-foreground">
                  <strong>Nhận xét của mình:</strong> {deal.note}
                </p>
              )}
              <DealMeta deal={deal} today={today} showExpiry={false} />
              <div className="mt-auto flex gap-2 pt-0.5">
                <BuyLink deal={deal} className="h-11 flex-1 text-sm" />
                {deal.searchCode && (
                  <CopyCodeButton
                    code={deal.searchCode}
                    marketplaceName={marketplaceLabel[deal.marketplace]}
                    showCode
                    className="h-11 flex-1 text-sm font-semibold"
                  />
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function BioDealList({
  deals,
  total,
  filters,
  today,
}: {
  deals: BioDeal[];
  total: number;
  filters: BioFilters;
  today: string;
}) {
  const filtered = Boolean(filters.q || filters.category || filters.sort === "under200k");

  return (
    <section aria-labelledby="bio-all" className="flex flex-col gap-3">
      <h2 id="bio-all" className={sectionTitleClass}>
        {filtered ? `Kết quả (${total})` : "Tất cả deal"}
      </h2>

      {deals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-bio-border bg-card px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {filtered ? "Không có deal nào phù hợp. Thử từ khóa hoặc danh mục khác nhé." : "Chưa có deal nào. Quay lại sau nhé!"}
          </p>
          {filtered && (
            <Button asChild variant="outline" className="h-10 rounded-[10px]">
              <Link href="/bio" scroll={false}>
                Xem tất cả deal
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {deals.map((deal) => (
            <li key={deal.id}>
              <BioDealCard deal={deal} today={today} />
            </li>
          ))}
        </ul>
      )}

      {deals.length < total && (
        <Button asChild variant="outline" className="h-11 rounded-xl border-bio-border text-sm">
          <Link href={bioHref(filters, { page: filters.page + 1 })} scroll={false}>
            Xem thêm deal
          </Link>
        </Button>
      )}
    </section>
  );
}

function BioDealCard({ deal, today }: { deal: BioDeal; today: string }) {
  return (
    <article className="flex h-full overflow-hidden rounded-2xl border border-bio-border bg-card lg:flex-col">
      <div className="relative flex-none">
        <ProductThumbnail
          url={deal.imageUrl}
          sizes="(min-width: 1024px) 320px, 112px"
          className="h-full min-h-[150px] w-28 lg:aspect-[4/3] lg:h-auto lg:w-full"
        />
        {deal.discount && <DiscountBadge percent={deal.discount} />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-3.5 py-3 lg:gap-2 lg:p-4">
        <h3 className="text-[15px] leading-snug font-bold">{deal.title}</h3>
        <Price deal={deal} />
        {deal.note && (
          <p className="text-[13px] leading-[1.45] text-secondary-foreground">
            <span className="sr-only">Nhận xét của mình: </span>&ldquo;{deal.note}&rdquo;
          </p>
        )}
        <DealMeta deal={deal} today={today} showExpiry />
        <div className="mt-0.5 flex flex-wrap gap-2 sm:mt-auto sm:pt-1">
          <BuyLink deal={deal} className="h-10 px-3.5 text-[13px] lg:flex-1" />
          {deal.searchCode && (
            <CopyCodeButton
              code={deal.searchCode}
              marketplaceName={marketplaceLabel[deal.marketplace]}
              className="h-10 px-3 text-[13px] font-semibold"
            />
          )}
        </div>
      </div>
    </article>
  );
}

export function TelegramFollow({ url }: { url: string }) {
  return (
    <section
      aria-labelledby="bio-telegram"
      className="flex flex-col gap-2.5 rounded-2xl bg-sidebar p-[18px] text-white"
    >
      <h2 id="bio-telegram" className="font-heading text-[17px] font-bold">
        Không muốn lỡ deal sốc?
      </h2>
      <p className="text-[13px] leading-normal text-sidebar-foreground">
        Deal flash sale được báo trên kênh Telegram trước khi lên trang này.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-card text-sm font-semibold text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 sm:self-start sm:px-6"
      >
        <Send className="size-[18px]" aria-hidden="true" />
        Theo dõi kênh Telegram
      </a>
    </section>
  );
}
