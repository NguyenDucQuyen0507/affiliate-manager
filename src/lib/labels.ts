// Display labels and marketplace detection (safe for both server and client components).

import type { Channel, ChannelType, Marketplace } from "@/lib/types";

export const marketplaceLabel: Record<Marketplace, string> = {
  SHOPEE: "Shopee",
  TIKTOK_SHOP: "TikTok Shop",
  LAZADA: "Lazada",
};

export const MARKETPLACES = Object.keys(marketplaceLabel) as Marketplace[];

export const channelTypeLabel: Record<ChannelType, string> = {
  FACEBOOK: "Facebook",
  TELEGRAM: "Telegram",
};

export const BIO_LABEL = "Bio";

/** "Facebook · Tủ đồ của nàng" */
export function channelDisplayName(channel: Channel) {
  return `${channelTypeLabel[channel.type]} · ${channel.name}`;
}

const MARKETPLACE_HOSTS: Record<Marketplace, string[]> = {
  SHOPEE: ["shopee.vn", "shope.ee", "shp.ee"],
  TIKTOK_SHOP: ["tiktok.com", "tiktokshop.com"],
  LAZADA: ["lazada.vn", "lzd.co"],
};

function hostMatches(host: string, domains: string[]) {
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/** Detects the marketplace from an affiliate link (including short links), or null. */
export function detectMarketplace(url: string): Marketplace | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  return MARKETPLACES.find((marketplace) => hostMatches(host, MARKETPLACE_HOSTS[marketplace])) ?? null;
}

/** Shopee affiliate links must be the official short links. */
const SHOPEE_AFFILIATE_PREFIXES = ["https://s.shopee.vn/", "https://shope.ee/"];
/** TikTok Shop and Lazada: any https link on their domains (incl. short-link subdomains). */
const AFFILIATE_DOMAINS = [...MARKETPLACE_HOSTS.TIKTOK_SHOP, ...MARKETPLACE_HOSTS.LAZADA];

export const AFFILIATE_URL_ERROR =
  "Link không hợp lệ. Dùng link bắt đầu bằng https://s.shopee.vn/ hoặc https://shope.ee/, hoặc link TikTok Shop, Lazada.";

/** True for links accepted as affiliate links (see AFFILIATE_URL_ERROR). */
export function isAllowedAffiliateUrl(raw: string) {
  const value = raw.trim();
  if (SHOPEE_AFFILIATE_PREFIXES.some((prefix) => value.toLowerCase().startsWith(prefix))) {
    // Still needs a path after the prefix and must parse as a URL.
    return value.length > value.indexOf("/", 8) + 1 && URL.canParse(value);
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "https:" && !url.username && !url.password && hostMatches(url.hostname.toLowerCase(), AFFILIATE_DOMAINS);
}
