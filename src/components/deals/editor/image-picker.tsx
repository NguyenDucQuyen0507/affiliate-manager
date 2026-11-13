"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  IMAGE_ACCEPT,
  MAX_DEAL_IMAGES,
  MAX_IMAGE_BYTES,
  isAllowedImageType,
} from "@/lib/image-rules";

export type EditorImage = {
  id: string;
  /** Stored URL once uploaded; a local preview (object URL) while uploading. */
  url: string;
  uploading: boolean;
};

type UploadResponse = { url?: string; error?: string };

async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/uploads", { method: "POST", body });
  const data = (await response.json().catch(() => ({}))) as UploadResponse;
  if (!response.ok || !data.url) throw new Error(data.error ?? "Không tải được ảnh lên. Vui lòng thử lại.");
  return data.url;
}

/**
 * Product image tiles. Images can be pasted (Ctrl+V anywhere on the page), dropped
 * on the tiles, or picked with "Thêm ảnh"; each one is uploaded right away.
 */
export function ImagePicker({
  images,
  setImages,
}: {
  images: EditorImage[];
  setImages: React.Dispatch<React.SetStateAction<EditorImage[]>>;
}) {
  const [dragging, setDragging] = useState(false);
  // Image count including files accepted in this tick (state updates are async).
  const count = useRef(images.length);
  useEffect(() => {
    count.current = images.length;
  }, [images.length]);

  function addFiles(files: File[]) {
    for (const file of files) {
      if (!isAllowedImageType(file.type)) {
        toast.error(`"${file.name}" không phải ảnh JPG, PNG hoặc WEBP`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`Ảnh "${file.name}" lớn hơn 5MB`);
        continue;
      }
      if (count.current >= MAX_DEAL_IMAGES) {
        toast.error(`Tối đa ${MAX_DEAL_IMAGES} ảnh cho mỗi deal`);
        break;
      }
      count.current += 1;
      void addOne(file);
    }
  }

  async function addOne(file: File) {
    const preview = URL.createObjectURL(file);
    setImages((current) => [...current, { id: preview, url: preview, uploading: true }]);
    try {
      const url = await uploadImage(file);
      setImages((current) =>
        current.map((image) => (image.id === preview ? { ...image, url, uploading: false } : image)),
      );
    } catch (error) {
      setImages((current) => current.filter((image) => image.id !== preview));
      toast.error(error instanceof Error ? error.message : "Không tải được ảnh lên");
    } finally {
      URL.revokeObjectURL(preview);
    }
  }

  // Ctrl+V with an image on the clipboard adds it, wherever the focus is on the page.
  // Text pastes (no image file) are left alone.
  const onPaste = useEffectEvent((event: ClipboardEvent) => {
    const files = Array.from(event.clipboardData?.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (files.length === 0) return;
    event.preventDefault();
    addFiles(files);
  });
  useEffect(() => {
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  function remove(image: EditorImage) {
    setImages((current) => current.filter((item) => item.id !== image.id));
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes("Files")) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          "flex flex-wrap gap-3 rounded-lg border-[1.5px] border-dashed border-transparent p-1 -m-1 transition-colors",
          dragging && "border-primary bg-primary-soft",
        )}
      >
        {images.map((image, index) => (
          <div key={image.id} className="relative size-24 overflow-hidden rounded-lg bg-muted">
            <Image
              src={image.url}
              alt={`Ảnh sản phẩm ${index + 1}`}
              fill
              unoptimized
              sizes="96px"
              className={cn("object-cover", image.uploading && "opacity-50")}
            />
            {image.uploading ? (
              <span className="absolute inset-0 flex items-center justify-center" role="status">
                <Loader2 className="size-5 animate-spin text-foreground" aria-hidden="true" />
                <span className="sr-only">Đang tải ảnh {index + 1} lên</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => remove(image)}
                className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-foreground/70 text-white outline-none hover:bg-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Xóa ảnh {index + 1}</span>
              </button>
            )}
          </div>
        ))}
        {images.length < MAX_DEAL_IMAGES && (
          <label className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-[1.5px] border-dashed border-border-dashed text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
            <Plus className="size-5" aria-hidden="true" />
            Thêm ảnh
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              multiple
              className="sr-only"
              onChange={(event) => {
                addFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      <p className="text-[13px] text-muted-foreground">
        Dán ảnh (Ctrl+V), kéo thả vào đây hoặc bấm Thêm ảnh. Tối đa {MAX_DEAL_IMAGES} ảnh JPG, PNG,
        WEBP, mỗi ảnh không quá 5MB.
      </p>
    </div>
  );
}
