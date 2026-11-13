// Stores uploaded product images (server-only).
// No cloud storage is configured yet: in development files go to public/uploads
// (git-ignored) and are served by Next.js at /uploads/<name>. Production refuses
// uploads until a storage provider is added here.

import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  IMAGE_EXTENSION_BY_TYPE,
  MAX_IMAGE_BYTES,
  isAllowedImageType,
  type AllowedImageType,
} from "@/lib/image-rules";

export type StoreImageResult =
  | { ok: true; url: string }
  | { ok: false; status: number; message: string };

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/** Detects the real format from the first bytes; the browser-sent type is not trusted. */
function sniffImageType(bytes: Uint8Array): AllowedImageType | null {
  const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // "RIFF" .... "WEBP"
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

export async function storeProductImage(file: File): Promise<StoreImageResult> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, status: 501, message: "Chưa cấu hình nơi lưu ảnh trên máy chủ." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, status: 413, message: "Ảnh lớn hơn 5MB." };
  }
  if (!isAllowedImageType(file.type)) {
    return { ok: false, status: 415, message: "Chỉ nhận ảnh JPG, PNG hoặc WEBP." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type) {
    return { ok: false, status: 415, message: "File không phải ảnh JPG, PNG hoặc WEBP hợp lệ." };
  }

  // Random name: never use the client's file name in a path.
  const name = `${randomBytes(16).toString("hex")}.${IMAGE_EXTENSION_BY_TYPE[type]}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), bytes, { flag: "wx" });
  return { ok: true, url: `/uploads/${name}` };
}
