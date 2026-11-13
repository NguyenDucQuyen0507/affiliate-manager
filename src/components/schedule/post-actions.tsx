"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  cancelPost,
  publishPostNow,
  retryAllFailedPosts,
  retryPost,
  type PostActionResult,
} from "@/app/dashboard/schedule/actions";
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

/** Runs a post action with a pending state and reports the result as a toast. */
function usePostAction() {
  const [pending, startTransition] = useTransition();
  function run(action: () => Promise<PostActionResult>) {
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
      } catch {
        toast.error("Không thực hiện được. Vui lòng thử lại.");
      }
    });
  }
  return { pending, run };
}

function Spinner() {
  return <Loader2 className="animate-spin" aria-hidden="true" />;
}

export function RetryButton({ postId, label }: { postId: string; label: string }) {
  const { pending, run } = usePostAction();
  return (
    <Button
      type="button"
      variant="danger-outline"
      size="row"
      disabled={pending}
      onClick={() => run(() => retryPost(postId))}
    >
      {pending && <Spinner />}
      Đăng lại
      <span className="sr-only"> {label}</span>
    </Button>
  );
}

export function RetryAllButton() {
  const { pending, run } = usePostAction();
  return (
    <Button
      type="button"
      variant="danger"
      size="row"
      className="px-4"
      disabled={pending}
      onClick={() => run(retryAllFailedPosts)}
    >
      {pending && <Spinner />}
      Đăng lại tất cả
    </Button>
  );
}

export function PendingPostActions({ postId, label }: { postId: string; label: string }) {
  const publish = usePostAction();
  const cancel = usePostAction();

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant="ghost"
        size="row"
        className="px-3 text-secondary-foreground"
        disabled={publish.pending || cancel.pending}
        onClick={() => publish.run(() => publishPostNow(postId))}
      >
        {publish.pending && <Spinner />}
        Đăng ngay
        <span className="sr-only"> {label}</span>
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="row"
            className="px-3 font-medium text-muted-foreground"
            disabled={publish.pending || cancel.pending}
          >
            {cancel.pending && <Spinner />}
            Hủy
            <span className="sr-only"> {label}</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy bài đăng này?</AlertDialogTitle>
            <AlertDialogDescription>
              Bài “{label}” sẽ bị xóa khỏi hàng đợi. Deal vẫn được giữ nguyên, bạn có thể lên lịch lại
              trong trang sửa deal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="row">Giữ lại</AlertDialogCancel>
            <AlertDialogAction variant="danger" size="row" onClick={() => cancel.run(() => cancelPost(postId))}>
              Hủy bài
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
