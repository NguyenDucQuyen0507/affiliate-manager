"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

export type EditorImage = {
  id: string;
  url: string;
  /** Local object URL for a file picked in this session (not uploaded yet). */
  file: File | null;
};

const MAX_IMAGES = 10;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

/**
 * Product image tiles + "Thêm ảnh". Picked files are previewed locally only.
 * TODO: upload files to storage on save once the storage provider is chosen.
 */
export function ImagePicker({
  images,
  onChange,
}: {
  images: EditorImage[];
  onChange: (images: EditorImage[]) => void;
}) {
  // Revoke object URLs we created when the editor unmounts.
  const created = useRef(new Set<string>());
  useEffect(() => {
    const urls = created.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next = [...images];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`Ảnh "${file.name}" lớn hơn 5MB`);
        continue;
      }
      if (next.length >= MAX_IMAGES) {
        toast.error(`Tối đa ${MAX_IMAGES} ảnh cho mỗi deal`);
        break;
      }
      const url = URL.createObjectURL(file);
      created.current.add(url);
      next.push({ id: url, url, file });
    }
    onChange(next);
  }

  function remove(image: EditorImage) {
    if (image.file) {
      URL.revokeObjectURL(image.url);
      created.current.delete(image.url);
    }
    onChange(images.filter((item) => item.id !== image.id));
  }

  return (
    <div className="flex flex-wrap gap-3">
      {images.map((image, index) => (
        <div key={image.id} className="relative size-24 overflow-hidden rounded-lg bg-muted">
          <Image
            src={image.url}
            alt={`Ảnh sản phẩm ${index + 1}`}
            fill
            unoptimized
            sizes="96px"
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => remove(image)}
            className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-foreground/70 text-white outline-none hover:bg-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Xóa ảnh {index + 1}</span>
          </button>
        </div>
      ))}
      {images.length < MAX_IMAGES && (
        <label className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-[1.5px] border-dashed border-border-dashed text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
          <Plus className="size-5" aria-hidden="true" />
          Thêm ảnh
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}
