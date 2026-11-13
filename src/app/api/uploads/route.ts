// POST /api/uploads: uploads one product image (multipart field "file").
// Admin only. Returns { url } or { error } with a Vietnamese message.

import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/auth-guard";
import { MAX_IMAGE_BYTES } from "@/lib/image-rules";
import { storeProductImage } from "@/lib/image-storage";

// Room for the multipart headers around a 5MB file.
const MAX_BODY_BYTES = MAX_IMAGE_BYTES + 64 * 1024;

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest) {
  // Same-origin only (the session cookie is SameSite=Lax; this is a second guard).
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return fail(403, "Yêu cầu không hợp lệ.");

  const admin = await getAdmin();
  if (!admin) return fail(401, "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.");

  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) return fail(413, "Ảnh lớn hơn 5MB.");

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return fail(400, "Không đọc được file ảnh.");
  }
  if (!(file instanceof File)) return fail(400, "Không đọc được file ảnh.");

  const result = await storeProductImage(file);
  if (!result.ok) return fail(result.status, result.message);
  return NextResponse.json({ url: result.url }, { status: 201 });
}
