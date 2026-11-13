"use client";

import { useActionState } from "react";
import { Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/lib/auth-actions";

export function LoginCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="w-full max-w-[400px] gap-6 p-6 sm:p-8">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Tag className="size-[18px]" aria-hidden="true" />
        </div>
        <span className="font-heading text-lg font-bold">DealHub</span>
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[30px] leading-tight font-bold tracking-[-0.01em]">Đăng nhập</h1>
        <p className="text-sm text-muted-foreground">Đăng nhập để quản lý deal và lịch đăng bài.</p>
      </div>
      {children}
    </Card>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {state?.message && (
        <p
          role="alert"
          className="rounded-[10px] border border-danger-border bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger-strong"
        >
          {state.message}
        </p>
      )}
      <Field>
        <FieldLabel htmlFor="login-email">Email</FieldLabel>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          // The form resets after each submit; keep the email the user typed.
          defaultValue={state?.email}
          required
          autoFocus
          className="h-11"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="login-password">Mật khẩu</FieldLabel>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11"
        />
      </Field>
      <Button type="submit" size="touch" disabled={pending} className="mt-2 w-full">
        {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
        Đăng nhập
      </Button>
    </form>
  );
}
