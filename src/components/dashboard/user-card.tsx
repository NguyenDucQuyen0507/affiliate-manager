import { connection } from "next/server";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { logoutAction } from "@/lib/auth-actions";
import { requireAdmin } from "@/lib/auth-guard";

const cardClass = "mt-auto flex items-center gap-2.5 border-t border-sidebar-border px-2 py-3";

/** Signed-in admin at the bottom of the sidebar, with the sign-out button. */
export async function SidebarUserCard() {
  // Reading the session may refresh the cookie (random values): request time only.
  await connection();
  const admin = await requireAdmin();
  return (
    <div className={cardClass}>
      <Avatar className="after:hidden">
        <AvatarFallback className="bg-sidebar-border text-[13px] font-semibold text-white">
          {admin.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-semibold text-white">{admin.name}</span>
        <span className="truncate text-xs text-sidebar-muted" title={admin.email}>
          {admin.email}
        </span>
      </div>
      <form action={logoutAction}>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          title="Đăng xuất"
          className="size-10 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-[18px]" aria-hidden="true" />
          <span className="sr-only">Đăng xuất</span>
        </Button>
      </form>
    </div>
  );
}

export function SidebarUserCardSkeleton() {
  return (
    <div className={cardClass}>
      <Skeleton className="size-8 rounded-full bg-sidebar-border" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3 w-20 bg-sidebar-border" />
        <Skeleton className="h-3 w-32 bg-sidebar-border" />
      </div>
    </div>
  );
}
