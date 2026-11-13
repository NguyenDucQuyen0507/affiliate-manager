// Product image limits, shared by the editor (client) and the upload route (server).

export const MAX_DEAL_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const IMAGE_EXTENSION_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type AllowedImageType = keyof typeof IMAGE_EXTENSION_BY_TYPE;

export const IMAGE_ACCEPT = Object.keys(IMAGE_EXTENSION_BY_TYPE).join(",");

export function isAllowedImageType(type: string): type is AllowedImageType {
  return Object.hasOwn(IMAGE_EXTENSION_BY_TYPE, type);
}

/** Path of an image stored by the dev storage (public/uploads). */
export const LOCAL_UPLOAD_URL_RE = /^\/uploads\/[A-Za-z0-9_-]{16,64}\.(?:jpg|png|webp)$/;

/** A saved deal image: hosted https/http URL, or a file uploaded to this app. */
export function isStoredImageUrl(url: string) {
  return LOCAL_UPLOAD_URL_RE.test(url) || /^https?:\/\/\S+$/.test(url);
}
