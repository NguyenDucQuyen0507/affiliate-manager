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
  SHOPEE: ["shopee.vn", "shp.ee"],
  TIKTOK_SHOP: ["tiktok.com", "tiktokshop.com"],
  LAZADA: ["lazada.vn", "lzd.co"],
};

/** Detects the marketplace from an affiliate link (including short links), or null. */
export function detectMarketplace(url: string): Marketplace | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const marketplace of MARKETPLACES) {
    const match = MARKETPLACE_HOSTS[marketplace].some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    );
    if (match) return marketplace;
  }
  return null;
}
