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

/**
 * Default caption template. Never includes the affiliate link: on Facebook the link
 * goes into a pinned comment, on Telegram into a button.
 */
export function buildCaptionTemplate(input: CaptionInput) {
  const title = input.title.trim() || "[Tên sản phẩm]";
  let first = title;
  if (input.price) first += `. Đang giảm còn ${formatPrice(input.price)}`;
  if (input.expiresAt) first += `, chỉ đến ${formatShortDate(input.expiresAt)}`;
  first += ".";

  const where = input.marketplace ? ` trên thanh tìm kiếm ${marketplaceLabel[input.marketplace]}` : "";
  const second = input.searchCode
    ? `Mua ngay: nhập mã ${input.searchCode}${where}.`
    : "Mua ngay: link ở bên dưới.";

  return `${first}\n${second}`;
}
