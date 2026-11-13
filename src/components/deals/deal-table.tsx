import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dealFiltersToSearch, type DealFilters } from "@/lib/deal-filters";
import type { DealListItem, DealQueryResult } from "@/lib/deals";
import { formatPrice, formatShortDate } from "@/lib/format";
import { marketplaceLabel } from "@/lib/labels";
import { getDealBadge } from "@/lib/status";

const headClass =
  "h-auto px-3 py-3.5 text-xs font-semibold tracking-[0.04em] text-muted-foreground uppercase";
const cellClass = "px-3 py-3.5";

export function DealTable({
  result,
  filters,
}: {
  result: DealQueryResult;
  filters: DealFilters;
}) {
  const { deals, total, page, pageCount, pageSize } = result;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = (page - 1) * pageSize + deals.length;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="min-w-[980px]">
        <TableHeader>
          <TableRow className="border-b-0 bg-table-head hover:bg-table-head">
            <TableHead className={cn(headClass, "pl-5")}>Sản phẩm</TableHead>
            <TableHead className={headClass}>Sàn</TableHead>
            <TableHead className={headClass}>Giá</TableHead>
            <TableHead className={headClass}>Mã tìm kiếm</TableHead>
            <TableHead className={headClass}>Kênh</TableHead>
            <TableHead className={headClass}>Trạng thái</TableHead>
            <TableHead className={cn(headClass, "pr-5 text-right")}>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.length === 0 ? (
            <TableRow className="border-t border-b-0 border-muted-track hover:bg-transparent">
              <TableCell colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                Không tìm thấy deal nào phù hợp.
              </TableCell>
            </TableRow>
          ) : (
            deals.map((deal) => <DealRow key={deal.id} deal={deal} />)
          )}
        </TableBody>
      </Table>

      <nav
        aria-label="Phân trang"
        className="flex flex-wrap items-center justify-between gap-3 border-t border-muted-track px-5 py-3.5 text-[13px] text-muted-foreground"
      >
        <span>
          Hiển thị {from}–{to} trong {total} deal
        </span>
        <div className="flex gap-2">
          <PageButton filters={filters} page={page - 1} disabled={page <= 1}>
            Trước
          </PageButton>
          <PageButton filters={filters} page={page + 1} disabled={page >= pageCount}>
            Sau
          </PageButton>
        </div>
      </nav>
    </div>
  );
}

function DealRow({ deal }: { deal: DealListItem }) {
  const expired = deal.status === "EXPIRED";
  const badge = getDealBadge(deal);
  const dimText = expired && "text-muted-foreground";

  return (
    <TableRow className="border-t border-b-0 border-muted-track">
      <TableCell className={cn(cellClass, "pl-5")}>
        <div className="flex items-center gap-3">
          <ProductThumbnail url={deal.imageUrls[0] ?? null} sizes="44px" className="size-11 rounded-md" />
          <div className="flex flex-col gap-0.5">
            <span className={cn("font-semibold", dimText)}>{deal.title}</span>
            <span className="text-[13px] text-muted-foreground">
              {deal.category && `${deal.category} · `}
              {deal.expiresAt ? `hết hạn ${formatShortDate(deal.expiresAt)}` : "chưa đặt hạn"}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className={cn(cellClass, dimText)}>
        {deal.marketplace ? marketplaceLabel[deal.marketplace] : "—"}
      </TableCell>
      <TableCell className={cellClass}>
        <div className="flex flex-col">
          <span className={cn("font-semibold", dimText)}>
            {deal.price !== null ? formatPrice(deal.price) : "—"}
          </span>
          {deal.originalPrice !== null && (
            <span className="text-[13px] text-muted-foreground line-through">
              {formatPrice(deal.originalPrice)}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className={cellClass}>
        {deal.searchCode ? (
          <code
            className={cn(
              "rounded-[6px] bg-muted px-2 py-1 font-mono text-[13px] font-semibold",
              dimText,
            )}
          >
            {deal.searchCode}
          </code>
        ) : (
          <span className="text-[13px] text-subtle">Không có</span>
        )}
      </TableCell>
      <TableCell className={cn(cellClass, "text-muted-foreground")}>
        {deal.channelLabels.length > 0 ? deal.channelLabels.join(", ") : "Chưa chọn"}
      </TableCell>
      <TableCell className={cellClass}>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </TableCell>
      <TableCell className={cn(cellClass, "pr-5 text-right")}>
        <Link
          href={`/dashboard/deals/${deal.id}`}
          className="inline-flex min-h-10 items-center font-semibold text-primary underline underline-offset-2 hover:text-primary-hover"
        >
          {expired ? "Gia hạn" : "Sửa"}
          <span className="sr-only"> {deal.title}</span>
        </Link>
      </TableCell>
    </TableRow>
  );
}

function PageButton({
  filters,
  page,
  disabled,
  children,
}: {
  filters: DealFilters;
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <Button variant="outline" size="row" disabled>
        {children}
      </Button>
    );
  }
  return (
    <Button asChild variant="outline" size="row">
      <Link href={`/dashboard/deals${dealFiltersToSearch({ ...filters, page })}`} scroll={false}>
        {children}
      </Link>
    </Button>
  );
}
