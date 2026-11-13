"use client";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Copies a marketplace search code and confirms with a toast. */
export function CopyCodeButton({
  code,
  marketplaceName,
  showCode = false,
  className,
}: {
  code: string;
  marketplaceName: string;
  /** "Chép mã VAYHOA" instead of "Chép mã". */
  showCode?: boolean;
  className?: string;
}) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Đã chép mã", {
        description: `Dán mã ${code} vào ô tìm kiếm ${marketplaceName}.`,
      });
    } catch {
      toast.error("Không chép được. Hãy chọn và chép mã thủ công.");
    }
  }

  return (
    <Button type="button" variant="outline" onClick={copy} className={cn("rounded-[10px]", className)}>
      Chép mã{showCode ? ` ${code}` : <span className="sr-only"> {code}</span>}
    </Button>
  );
}
