"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Loader2, Plus } from "lucide-react";
import { connectFacebookAction, connectTelegramAction } from "@/app/dashboard/channels/actions";
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
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { telegramConnectSchema, type TelegramConnectValues } from "@/lib/channel-schema";
import { ChannelIcon } from "./channel-icon";
import { useChannelAction } from "./channel-actions";

type Step = "choose" | "telegram";

export function AddChannelDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const facebook = useChannelAction();
  const telegram = useChannelAction();
  const form = useForm<TelegramConnectValues>({
    resolver: zodResolver(telegramConnectSchema),
    defaultValues: { botToken: "", channelUsername: "" },
  });

  function close() {
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setStep("choose");
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="touch">
          <Plus strokeWidth={2.2} aria-hidden="true" />
          Thêm kênh
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "choose" ? (
          <>
            <DialogHeader>
              <DialogTitle>Thêm kênh</DialogTitle>
              <DialogDescription>Chọn nơi bạn muốn tự động đăng deal.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2.5">
              <OptionButton
                icon={<ChannelIcon kind="FACEBOOK" />}
                title="Facebook Fanpage"
                description="Đăng nhập Facebook và chọn trang bạn quản lý."
                disabled={facebook.pending}
                onClick={() => facebook.run(connectFacebookAction, close)}
              />
              <OptionButton
                icon={<ChannelIcon kind="TELEGRAM" />}
                title="Telegram channel"
                description="Dùng bot của bạn để đăng vào kênh."
                onClick={() => setStep("telegram")}
              />
            </div>
          </>
        ) : (
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => telegram.run(() => connectTelegramAction(values), close))}
          >
            <DialogHeader>
              <DialogTitle>Kết nối kênh Telegram</DialogTitle>
              <DialogDescription>
                Tạo bot với @BotFather, thêm bot làm quản trị viên của kênh, rồi dán thông tin vào đây.
              </DialogDescription>
            </DialogHeader>
            <Controller
              name="botToken"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="tg-token">Bot token</FieldLabel>
                  <Input
                    {...field}
                    id="tg-token"
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                  <FieldDescription>Token được mã hóa và chỉ lưu trên máy chủ.</FieldDescription>
                </Field>
              )}
            />
            <Controller
              name="channelUsername"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="tg-channel">Tên kênh</FieldLabel>
                  <Input
                    {...field}
                    id="tg-channel"
                    placeholder="@ten_kenh"
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <DialogFooter className="sm:justify-between">
              <Button type="button" variant="ghost" size="row" onClick={() => setStep("choose")}>
                <ChevronLeft aria-hidden="true" />
                Quay lại
              </Button>
              <Button type="submit" size="row" disabled={telegram.pending}>
                {telegram.pending && <Loader2 className="animate-spin" aria-hidden="true" />}
                Kết nối
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OptionButton({
  icon,
  title,
  description,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-11 items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors outline-none hover:border-primary-soft-border hover:bg-primary-soft focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
    >
      {icon}
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-[13px] text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}
