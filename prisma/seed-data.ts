// Sample data for `prisma db seed` (mirrors the docs/design/screens mockups).
// Dates are fixed around Thứ Năm 12/11/2026 so the Overview and Schedule screens
// show "today" / "tomorrow" as in the mockups.

import { buildCaptionTemplate } from "../src/lib/deal-caption";
import type {
  ChannelStatus,
  ChannelType,
  DealStatus,
  Marketplace,
  PostStatus,
} from "../src/generated/prisma/enums";

export const seedUser = {
  email: "admin@example.com",
  name: "Quyền",
  role: "ADMIN" as const,
};

export type SeedChannel = {
  key: string;
  type: ChannelType;
  name: string;
  status: ChannelStatus;
  externalId: string | null;
  botUsername: string | null;
};

export const seedChannels: SeedChannel[] = [
  { key: "fb-tu-do", type: "FACEBOOK", name: "Tủ đồ của nàng", status: "NEEDS_RECONNECT", externalId: null, botUsername: null },
  { key: "fb-me-be", type: "FACEBOOK", name: "Góc Mẹ & Bé", status: "ACTIVE", externalId: null, botUsername: null },
  { key: "tg-main", type: "TELEGRAM", name: "[Tên kênh Telegram]", status: "ACTIVE", externalId: null, botUsername: "@[ten_bot]" },
];

// 31 deals: 24 active, 4 draft, 3 expired (as in Deals.dc.html).

const FB = "fb-tu-do";
const FB_BABY = "fb-me-be";
const TG = "tg-main";
const PUBLISHED_AT = "2026-11-10T09:00";

export type SeedPost = {
  /** SeedChannel.key */
  channelKey: string;
  /** App-local "YYYY-MM-DDTHH:mm" (Asia/Ho_Chi_Minh). */
  scheduledAt: string;
  status: PostStatus;
  errorMessage: string | null;
};

export type SeedDeal = {
  title: string;
  category: string;
  marketplace: Marketplace;
  affiliateUrl: string;
  price: number;
  originalPrice: number | null;
  searchCode: string | null;
  /** "YYYY-MM-DD" or null. */
  expiresAt: string | null;
  caption: string;
  showOnBio: boolean;
  status: DealStatus;
  posts: SeedPost[];
};

function post(channelKey: string, scheduledAt: string, status: PostStatus, errorMessage?: string): SeedPost {
  return { channelKey, scheduledAt, status, errorMessage: errorMessage ?? null };
}

/** Already-published posts on the given channels. */
function published(...channelKeys: string[]): SeedPost[] {
  return channelKeys.map((key) => post(key, PUBLISHED_AT, "PUBLISHED"));
}

const MARKETPLACE_HOST: Record<Marketplace, string> = {
  SHOPEE: "s.shopee.vn",
  TIKTOK_SHOP: "vt.tiktok.com",
  LAZADA: "s.lazada.vn",
};

let sampleLinkId = 1;

function deal(input: Omit<SeedDeal, "affiliateUrl" | "caption"> & { caption?: string }): SeedDeal {
  return {
    ...input,
    // Placeholder short links; real ones come from the marketplace affiliate programs.
    affiliateUrl: `https://${MARKETPLACE_HOST[input.marketplace]}/sample-${sampleLinkId++}`,
    caption: input.caption ?? buildCaptionTemplate({ ...input, marketplace: input.marketplace }),
  };
}

export const seedDeals: SeedDeal[] = [
  // Rows shown on page 1 of the Deals mockup
  deal({ title: "Áo polo nam cotton", category: "Thời trang nam", marketplace: "SHOPEE", price: 189000, originalPrice: 339000, searchCode: "POLO45", expiresAt: "2026-11-20", status: "ACTIVE", showOnBio: true, posts: [post(FB, "2026-11-12T09:00", "PUBLISHED"), post(TG, "2026-11-13T09:00", "PENDING")] }),
  deal({
    title: "Váy babydoll hoa nhí", category: "Thời trang nữ", marketplace: "SHOPEE", price: 245000, originalPrice: 390000, searchCode: "VAYHOA", expiresAt: "2026-11-30", status: "ACTIVE", showOnBio: true,
    caption: "Váy babydoll hoa nhí dáng xòe, mặc đi chơi hay đi làm đều xinh. Đang giảm còn 245.000đ, chỉ đến 30/11.\nMua ngay: nhập mã VAYHOA trên thanh tìm kiếm Shopee.",
    posts: [post(FB, "2026-11-12T11:30", "PENDING"), post(TG, "2026-11-12T11:30", "PENDING")],
  }),
  deal({ title: "Bình sữa chống sặc 240ml", category: "Mẹ & bé", marketplace: "TIKTOK_SHOP", price: 159000, originalPrice: 220000, searchCode: null, expiresAt: "2026-11-25", status: "ACTIVE", showOnBio: true, posts: [post(TG, "2026-11-12T10:15", "FAILED", "Bot không có quyền đăng vào kênh. Thêm bot làm quản trị viên kênh rồi đăng lại."), post(FB_BABY, "2026-11-13T19:30", "PENDING")] }),
  deal({ title: "Combo 3 hộp khăn ướt không mùi", category: "Mẹ & bé", marketplace: "SHOPEE", price: 99000, originalPrice: 135000, searchCode: "KHANUOT3", expiresAt: "2026-12-15", status: "ACTIVE", showOnBio: false, posts: [post(FB_BABY, "2026-11-12T14:00", "PENDING")] }),
  deal({ title: "Túi tote canvas đi học", category: "Phụ kiện", marketplace: "LAZADA", price: 79000, originalPrice: 120000, searchCode: null, expiresAt: null, status: "DRAFT", showOnBio: false, posts: [] }),
  deal({ title: "Set đồ ngủ lụa satin", category: "Thời trang nữ", marketplace: "SHOPEE", price: 210000, originalPrice: 350000, searchCode: "SATIN35", expiresAt: "2026-11-08", status: "EXPIRED", showOnBio: false, posts: [post(FB, "2026-11-11T20:00", "FAILED", "Token của trang đã hết hạn. Kết nối lại trang trong mục Kênh kết nối.")] }),

  // Remaining sample deals
  deal({ title: "Giày sneaker nữ đế bằng", category: "Giày dép", marketplace: "SHOPEE", price: 259000, originalPrice: 420000, searchCode: "SNEAKER40", expiresAt: "2026-11-28", status: "ACTIVE", showOnBio: true, posts: published(FB, TG) }),
  deal({ title: "Nồi chiên không dầu 5L", category: "Gia dụng", marketplace: "TIKTOK_SHOP", price: 899000, originalPrice: 1490000, searchCode: null, expiresAt: "2026-11-22", status: "ACTIVE", showOnBio: false, posts: published(FB, TG) }),
  deal({ title: "Kem chống nắng nâng tông SPF50", category: "Làm đẹp", marketplace: "SHOPEE", price: 145000, originalPrice: 230000, searchCode: "SUNSPF50", expiresAt: "2026-12-05", status: "ACTIVE", showOnBio: true, posts: published(FB, TG) }),
  deal({ title: "Tai nghe bluetooth chống ồn", category: "Điện tử", marketplace: "LAZADA", price: 499000, originalPrice: 790000, searchCode: null, expiresAt: "2026-11-30", status: "ACTIVE", showOnBio: true, posts: published(TG) }),
  deal({ title: "Bộ chăn ga cotton Hàn Quốc", category: "Nhà cửa", marketplace: "SHOPEE", price: 329000, originalPrice: 550000, searchCode: "CHANGA", expiresAt: "2026-12-10", status: "ACTIVE", showOnBio: false, posts: published(FB) }),
  deal({ title: "Sữa rửa mặt dịu nhẹ 150ml", category: "Làm đẹp", marketplace: "TIKTOK_SHOP", price: 89000, originalPrice: 129000, searchCode: null, expiresAt: "2026-11-18", status: "ACTIVE", showOnBio: true, posts: published(FB, TG) }),
  deal({ title: "Balo laptop chống nước", category: "Phụ kiện", marketplace: "SHOPEE", price: 279000, originalPrice: 450000, searchCode: "BALO15", expiresAt: "2026-12-01", status: "ACTIVE", showOnBio: false, posts: published(FB, TG) }),
  deal({ title: "Đồ chơi xếp hình gỗ cho bé", category: "Mẹ & bé", marketplace: "LAZADA", price: 119000, originalPrice: 189000, searchCode: null, expiresAt: "2026-11-27", status: "ACTIVE", showOnBio: true, posts: published(TG) }),
  deal({ title: "Quần jean nam ống suông", category: "Thời trang nam", marketplace: "SHOPEE", price: 229000, originalPrice: 359000, searchCode: "JEAN30", expiresAt: "2026-11-24", status: "ACTIVE", showOnBio: true, posts: published(FB, TG) }),
  deal({ title: "Máy xay sinh tố cầm tay", category: "Gia dụng", marketplace: "SHOPEE", price: 189000, originalPrice: 299000, searchCode: "XAYMINI", expiresAt: "2026-12-12", status: "ACTIVE", showOnBio: false, posts: published(FB) }),
  deal({ title: "Son kem lì mịn môi", category: "Làm đẹp", marketplace: "TIKTOK_SHOP", price: 99000, originalPrice: 159000, searchCode: null, expiresAt: "2026-11-21", status: "ACTIVE", showOnBio: true, posts: published(FB, TG) }),
  deal({ title: "Đèn ngủ cảm biến chuyển động", category: "Nhà cửa", marketplace: "LAZADA", price: 69000, originalPrice: 110000, searchCode: null, expiresAt: "2026-12-03", status: "ACTIVE", showOnBio: true, posts: published(TG) }),
  deal({ title: "Áo khoác gió unisex", category: "Thời trang nam", marketplace: "SHOPEE", price: 199000, originalPrice: 320000, searchCode: "KHOACGIO", expiresAt: "2026-11-29", status: "ACTIVE", showOnBio: false, posts: published(FB, TG) }),
  deal({ title: "Bình giữ nhiệt inox 500ml", category: "Gia dụng", marketplace: "SHOPEE", price: 129000, originalPrice: 199000, searchCode: "GIUNHIET", expiresAt: "2026-12-08", status: "ACTIVE", showOnBio: true, posts: published(FB, TG) }),
  deal({ title: "Sạc dự phòng 10000mAh", category: "Điện tử", marketplace: "TIKTOK_SHOP", price: 239000, originalPrice: 390000, searchCode: null, expiresAt: "2026-11-26", status: "ACTIVE", showOnBio: false, posts: published(FB, TG) }),
  deal({ title: "Tã quần cho bé size L", category: "Mẹ & bé", marketplace: "SHOPEE", price: 279000, originalPrice: 345000, searchCode: "TAQUANL", expiresAt: "2026-12-20", status: "ACTIVE", showOnBio: true, posts: published(FB_BABY, TG) }),
  deal({ title: "Kệ để giày 5 tầng", category: "Nhà cửa", marketplace: "LAZADA", price: 159000, originalPrice: 250000, searchCode: null, expiresAt: "2026-11-30", status: "ACTIVE", showOnBio: false, posts: [...published(FB), post(TG, "2026-11-12T20:00", "PENDING")] }),
  deal({ title: "Váy công sở dáng chữ A", category: "Thời trang nữ", marketplace: "SHOPEE", price: 265000, originalPrice: 420000, searchCode: "VAYCS", expiresAt: "2026-12-02", status: "ACTIVE", showOnBio: false, posts: published(FB, TG) }),
  deal({ title: "Serum vitamin C 30ml", category: "Làm đẹp", marketplace: "TIKTOK_SHOP", price: 175000, originalPrice: 280000, searchCode: null, expiresAt: "2026-11-23", status: "ACTIVE", showOnBio: true, posts: published(FB, TG) }),
  deal({ title: "Chuột không dây im lặng", category: "Điện tử", marketplace: "SHOPEE", price: 109000, originalPrice: 169000, searchCode: "CHUOTIM", expiresAt: "2026-12-06", status: "ACTIVE", showOnBio: true, posts: published(TG) }),
  deal({ title: "Ô gấp tự động chống UV", category: "Phụ kiện", marketplace: "LAZADA", price: 149000, originalPrice: 230000, searchCode: null, expiresAt: null, status: "DRAFT", showOnBio: false, posts: [] }),
  deal({ title: "Thảm yoga TPE 6mm", category: "Thể thao", marketplace: "SHOPEE", price: 189000, originalPrice: 299000, searchCode: "YOGA6", expiresAt: "2026-12-31", status: "DRAFT", showOnBio: false, posts: [] }),
  deal({ title: "Bộ hộp đựng thực phẩm thủy tinh", category: "Gia dụng", marketplace: "TIKTOK_SHOP", price: 219000, originalPrice: 340000, searchCode: null, expiresAt: null, status: "DRAFT", showOnBio: false, posts: [] }),
  deal({ title: "Mũ bucket vải kaki", category: "Phụ kiện", marketplace: "SHOPEE", price: 59000, originalPrice: 99000, searchCode: "BUCKET", expiresAt: "2026-11-05", status: "EXPIRED", showOnBio: false, posts: published(FB) }),
  deal({ title: "Bàn chải điện sạc pin", category: "Làm đẹp", marketplace: "LAZADA", price: 249000, originalPrice: 399000, searchCode: null, expiresAt: "2026-11-10", status: "EXPIRED", showOnBio: false, posts: published(FB, TG) }),
];
