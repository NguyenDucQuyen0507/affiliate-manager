"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { Button } from "@/components/ui/button";
import type { BioDeal } from "@/lib/bio";
import { formatPrice, formatShortDate } from "@/lib/format";
import { marketplaceLabel } from "@/lib/labels";

const ALL = "__all__";

export function BioDealList({ deals, categories }: { deals: BioDeal[]; categories: string[] }) {
  const [category, setCategory] = useState(ALL);
  const visible = category === ALL ? deals : deals.filter((deal) => deal.category === category);

  return (
    <>
      {categories.length > 1 && (
        <div
          role="group"
          aria-label="Danh mục"
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-3.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-6"
        >
          <Chip active={category === ALL} onClick={() => setCategory(ALL)}>
            Tất cả
          </Chip>
          {categories.map((name) => (
            <Chip key={name} active={category === name} onClick={() => setCategory(name)}>
              {name}
            </Chip>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chưa có deal nào. Quay lại sau nhé!</p>
      ) : (
        <ul className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {visible.map((deal) => (
            <li key={deal.id}>
              <BioDealCard deal={deal} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "min-h-10 flex-none rounded-full border px-4 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-bio-border bg-card text-secondary-foreground hover:border-primary-soft-border",
      )}
    >
      {children}
    </button>
  );
}

function BioDealCard({ deal }: { deal: BioDeal }) {
  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Đã sao chép mã", {
        description: `Dán mã ${code} vào ô tìm kiếm ${marketplaceLabel[deal.marketplace]}.`,
      });
    } catch {
      toast.error("Không sao chép được. Hãy chọn và sao chép mã thủ công.");
    }
  }

  return (
    <article className="flex h-full overflow-hidden rounded-2xl border border-bio-border bg-card lg:flex-col">
      <ProductThumbnail
        url={deal.imageUrl}
        sizes="(min-width: 1024px) 320px, 112px"
        className="w-28 lg:aspect-[4/3] lg:w-full"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-3.5 py-3 lg:gap-2 lg:p-4">
        <h2 className="text-[15px] leading-snug font-bold lg:text-base">{deal.title}</h2>
        <p className="text-sm">
          <strong className="text-primary">{formatPrice(deal.price)}</strong>{" "}
          {deal.originalPrice && (
            <span className="text-[13px] text-muted-foreground line-through">
              <span className="sr-only">Giá gốc </span>
              {formatPrice(deal.originalPrice)}
            </span>
          )}
        </p>
        {deal.searchCode ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Mã:
            <code className="rounded-[4px] bg-muted px-1.5 py-[3px] font-mono text-xs font-bold text-foreground">
              {deal.searchCode}
            </code>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {marketplaceLabel[deal.marketplace]}
            {deal.expiresAt && ` · còn hạn đến ${formatShortDate(deal.expiresAt)}`}
          </p>
        )}
        <div className="mt-0.5 flex flex-wrap gap-2 sm:mt-auto sm:pt-1.5">
          <Button asChild size="row" className="rounded-lg lg:flex-1">
            <a href={deal.affiliateUrl} target="_blank" rel="sponsored nofollow noopener noreferrer">
              Mua ngay
              <span className="sr-only"> {deal.title} trên {marketplaceLabel[deal.marketplace]}</span>
            </a>
          </Button>
          {deal.searchCode && (
            <Button
              type="button"
              variant="outline"
              size="row"
              className="rounded-lg px-3"
              onClick={() => copyCode(deal.searchCode!)}
            >
              Sao chép mã
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
