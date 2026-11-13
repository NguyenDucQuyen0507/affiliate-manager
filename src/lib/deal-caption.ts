import { formatPrice, formatShortDate } from "@/lib/format";
import { marketplaceLabel } from "@/lib/labels";
import type { Marketplace } from "@/lib/types";

type CaptionInput = {
  title: string;
  price: number | null;
  originalPrice: number | null;
  expiresAt: string | null;
  searchCode: string | null;
  marketplace: Marketplace | null;
};

/** Whole-percent discount, or null when there is no real discount. 245.000 / 390.000 → 37. */
export function discountPercent(price: number | null, originalPrice: number | null) {
  if (!price || !originalPrice || originalPrice <= price) return null;
  const percent = Math.round(((originalPrice - price) / originalPrice) * 100);
  return percent > 0 ? percent : null;
}

/**
 * Short Vietnamese caption built from the deal fields; the user can edit it afterwards.
 * Never includes the affiliate link: on Facebook the link goes into a pinned comment,
 * on Telegram into a button.
 *
 *   Nồi chiên không dầu 5L
 *   Giá chỉ 245.000đ (giảm 37% so với 390.000đ)
 *   Hạn đến 20/11
 *   Mua ngay: nhập mã NOICHIEN5L trên thanh tìm kiếm Shopee.
 */
export function buildCaptionTemplate(input: CaptionInput) {
  const lines = [input.title.trim() || "[Tên sản phẩm]"];

  if (input.price) {
    const percent = discountPercent(input.price, input.originalPrice);
    lines.push(
      percent && input.originalPrice
        ? `Giá chỉ ${formatPrice(input.price)} (giảm ${percent}% so với ${formatPrice(input.originalPrice)})`
        : `Giá chỉ ${formatPrice(input.price)}`,
    );
  }
  if (input.expiresAt) lines.push(`Hạn đến ${formatShortDate(input.expiresAt)}`);

  const where = input.marketplace ? ` trên thanh tìm kiếm ${marketplaceLabel[input.marketplace]}` : "";
  lines.push(
    input.searchCode ? `Mua ngay: nhập mã ${input.searchCode}${where}.` : "Mua ngay: link ở bên dưới.",
  );
  return lines.join("\n");
}
