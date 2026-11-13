"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteDeal } from "@/app/dashboard/deals/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/** "Xóa" in the deal editor header, with a confirmation dialog. */
export function DeleteDealButton({ dealId, disabled }: { dealId: string; disabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete(event: React.MouseEvent) {
    // Keep the dialog open (with a spinner) until the server answers.
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await deleteDeal(dealId);
        if (result.ok) {
          toast.success("Đã xóa deal");
          setOpen(false);
          router.replace("/dashboard/deals");
        } else {
          toast.error(result.message);
          setOpen(false);
        }
      } catch {
        toast.error("Không xóa được deal. Vui lòng thử lại.");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="danger-outline" size="touch" disabled={disabled || pending}>
          <Trash2 aria-hidden="true" />
          Xóa
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa deal này?</AlertDialogTitle>
          <AlertDialogDescription>Các bài đã lên lịch cũng sẽ bị hủy.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="row" disabled={pending}>
            Giữ lại
          </AlertDialogCancel>
          <AlertDialogAction variant="danger" size="row" disabled={pending} onClick={confirmDelete}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Xóa deal
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
