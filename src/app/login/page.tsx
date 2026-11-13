import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { LoginCard, LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdmin, safeCallbackPath } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Đăng nhập – Affiliate Manager",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-12">
      <LoginCard>
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginGate searchParams={searchParams} />
        </Suspense>
      </LoginCard>
    </main>
  );
}

async function LoginGate({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const callbackUrl = safeCallbackPath((await searchParams).callbackUrl);
  // Reading the session may refresh the cookie (random values): request time only.
  await connection();
  // Already signed in (and still an admin): skip the form.
  if (await getAdmin()) redirect(callbackUrl);
  return <LoginForm callbackUrl={callbackUrl} />;
}

function LoginFormSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-[70px] rounded-[10px] bg-muted-track" />
      <Skeleton className="h-[70px] rounded-[10px] bg-muted-track" />
      <Skeleton className="mt-2 h-11 rounded-[10px] bg-muted-track" />
    </div>
  );
}
