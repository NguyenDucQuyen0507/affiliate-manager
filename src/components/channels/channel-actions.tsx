"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  connectFacebookAction,
  disconnectChannelAction,
  renameChannelAction,
  sendTestPostAction,
  type ChannelActionResult,
} from "@/app/dashboard/channels/actions";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** Runs a channel action with a pending state and reports the result as a toast. */
export function useChannelAction() {
  const [pending, startTransition] = useTransition();
  function run(action: () => Promise<ChannelActionResult>, onSuccess?: () => void) {
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) {
          toast.success(result.message);
          onSuccess?.();
        } else {
          toast.error(result.message);
        }
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

type Platform = "Facebook" | "Telegram";

export function TestPostButton({ channelId, platform }: { channelId: string; platform: Platform }) {
  const { pending, run } = useChannelAction();
  return (
    <Button
      type="button"
      variant="outline"
      size="row"
      disabled={pending}
      onClick={() => run(() => sendTestPostAction(channelId, platform))}
    >
      {pending && <Spinner />}
      Đăng thử
    </Button>
  );
}

export function ReconnectFacebookButton() {
  const { pending, run } = useChannelAction();
  return (
    <Button type="button" size="row" disabled={pending} onClick={() => run(connectFacebookAction)}>
      {pending && <Spinner />}
      Kết nối lại
    </Button>
  );
}

export function ChannelSettingsDialog({ channelId, name }: { channelId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const rename = useChannelAction();
  const disconnect = useChannelAction();
  const inputId = `channel-name-${channelId}`;

  function save() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed.length > 80) {
      setError("Tên kênh phải từ 1 đến 80 ký tự");
      return;
    }
    setError(null);
    rename.run(() => renameChannelAction(channelId, trimmed), () => setOpen(false));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraft(name);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="row">
          Cài đặt
          <span className="sr-only"> kênh {name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cài đặt kênh</DialogTitle>
          <DialogDescription>Tên hiển thị chỉ dùng trong trang quản lý này.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor={inputId}>Tên hiển thị</FieldLabel>
            <Input
              id={inputId}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              aria-invalid={Boolean(error)}
            />
            <FieldError>{error}</FieldError>
          </Field>
          <DialogFooter className="sm:justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="danger-outline" size="row" disabled={disconnect.pending}>
                  {disconnect.pending && <Spinner />}
                  Ngắt kết nối
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ngắt kết nối “{name}”?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Token của kênh sẽ bị xóa khỏi máy chủ và các bài đang chờ đăng lên kênh này sẽ bị hủy.
                    Bạn có thể kết nối lại sau.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel size="row">Giữ kết nối</AlertDialogCancel>
                  <AlertDialogAction
                    variant="danger"
                    size="row"
                    onClick={() => disconnect.run(() => disconnectChannelAction(channelId), () => setOpen(false))}
                  >
                    Ngắt kết nối
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button type="submit" size="row" disabled={rename.pending}>
              {rename.pending && <Spinner />}
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
