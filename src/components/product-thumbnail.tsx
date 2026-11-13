import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Product image, or a neutral placeholder until the deal has one. Decorative (alt=""). */
export function ProductThumbnail({
  url,
  sizes,
  className,
}: {
  url: string | null;
  /** next/image `sizes`, e.g. "48px". */
  sizes: string;
  className?: string;
}) {
  return (
    <div
      className={cn("relative flex-none overflow-hidden bg-muted", className)}
      aria-hidden="true"
    >
      {url ? (
        // Marketplace CDNs aren't configured for the image optimizer yet.
        <Image src={url} alt="" fill unoptimized sizes={sizes} className="object-cover" />
      ) : (
        <ImageIcon className="absolute top-1/2 left-1/2 size-[40%] max-h-8 max-w-8 -translate-1/2 text-border-strong" />
      )}
    </div>
  );
}
