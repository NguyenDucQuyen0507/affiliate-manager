// Domain types shared by the UI. The data layer (src/lib/*.ts, server-only) maps
// Prisma rows to these shapes; keep them in sync with prisma/schema.prisma.

export type Marketplace = "SHOPEE" | "TIKTOK_SHOP" | "LAZADA";

/** Bio is not a Channel: it is a per-deal flag (Deal.showOnBio). */
export type ChannelType = "FACEBOOK" | "TELEGRAM";

export type DealStatus = "ACTIVE" | "DRAFT" | "EXPIRED";

export type PostStatus = "PENDING" | "PUBLISHED" | "FAILED";

/** DISCONNECTED channels are kept only so post history still resolves their name. */
export type ChannelStatus = "ACTIVE" | "NEEDS_RECONNECT" | "DISCONNECTED";

export type BioPageStatus = "PUBLIC" | "HIDDEN";

export type BioProfile = {
  name: string;
  tagline: string;
  avatarUrl: string | null;
};

/** A connected Facebook Page or Telegram channel. Tokens never leave the server. */
export type Channel = {
  id: string;
  type: ChannelType;
  name: string;
  status: ChannelStatus;
  /** Telegram bot handle, e.g. "@deal_bot" (null for Facebook). The token itself never leaves the server. */
  botUsername: string | null;
};

/** One deal × channel publication, with its own schedule and status. */
export type Post = {
  id: string;
  channelId: string;
  /** Local date-time "YYYY-MM-DDTHH:mm" (same format as <input type="datetime-local">). */
  scheduledAt: string;
  status: PostStatus;
  /** Human-readable reason, set when status is FAILED. */
  errorMessage: string | null;
};

export type Deal = {
  id: string;
  title: string;
  /** "" when not set (drafts). */
  category: string;
  /** Null only for drafts saved without an affiliate link. */
  marketplace: Marketplace | null;
  affiliateUrl: string;
  imageUrls: string[];
  /** Prices in VND (integer). Null only for drafts saved without a price. */
  price: number | null;
  originalPrice: number | null;
  /** In-app search code shoppers can type on the marketplace (e.g. a Shopee voucher keyword). */
  searchCode: string | null;
  /** ISO date (YYYY-MM-DD), or null when no expiry is set. */
  expiresAt: string | null;
  caption: string;
  showOnBio: boolean;
  status: DealStatus;
  posts: Post[];
};
