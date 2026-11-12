"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyField({ id, value }: { id: string; value: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Đã sao chép địa chỉ");
    } catch {
      toast.error("Không sao chép được. Hãy chọn và sao chép thủ công.");
    }
  }

  return (
    <div className="flex gap-2">
      <input
        id={id}
        type="text"
        readOnly
        value={value}
        onFocus={(event) => event.target.select()}
        className="h-10 min-w-0 flex-1 rounded-md border border-input bg-table-head px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <Button type="button" variant="outline" size="row" onClick={copy}>
        Sao chép
      </Button>
    </div>
  );
}

export function ChangeThemeButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="row"
      // TODO: Bio page themes are not designed yet.
      onClick={() => toast.info("Tính năng đổi giao diện trang Bio sẽ có trong bản sau.")}
    >
      Đổi giao diện
    </Button>
  );
}
