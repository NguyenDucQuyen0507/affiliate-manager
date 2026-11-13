import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Unknown deal id, or a deal owned by someone else. */
export default function DealNotFound() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border bg-card px-6 py-14 text-center">
      <h1 className="font-heading text-lg font-semibold">Không tìm thấy deal</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Deal này không tồn tại hoặc đã bị xóa.
      </p>
      <Button asChild size="touch" className="mt-3">
        <Link href="/dashboard/deals">Về danh sách deal</Link>
      </Button>
    </div>
  );
}
