"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navItems } from "./nav-items";

/** Server-rendered user card (see components/dashboard/user-card.tsx). */
type UserCardSlot = { userCard: React.ReactNode };

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <Tag className="size-[18px]" aria-hidden="true" />
      </div>
      <span className="font-heading text-lg font-bold text-white">DealHub</span>
    </div>
  );
}

/** Reads the current path; must render inside <Suspense> (dynamic routes resolve it at runtime). */
function ActiveNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <NavLinkList pathname={pathname} onNavigate={onNavigate} />;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense fallback={<NavLinkList pathname={null} onNavigate={onNavigate} />}>
      <ActiveNavLinks onNavigate={onNavigate} />
    </Suspense>
  );
}

function NavLinkList({
  pathname,
  onNavigate,
}: {
  pathname: string | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname !== null && isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              active &&
                "bg-sidebar-accent font-semibold text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-[18px] shrink-0" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}

function SidebarBody({ userCard, onNavigate }: UserCardSlot & { onNavigate?: () => void }) {
  return (
    <>
      <Brand />
      <NavLinks onNavigate={onNavigate} />
      {userCard}
    </>
  );
}

/** Fixed dark sidebar on large screens. */
export function DesktopSidebar({ userCard }: UserCardSlot) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="sticky top-0 hidden h-svh w-[232px] shrink-0 flex-col gap-7 overflow-y-auto bg-sidebar px-4 py-6 text-sidebar-foreground lg:flex"
    >
      <SidebarBody userCard={userCard} />
    </nav>
  );
}

/** Top bar with a Sheet-based sidebar on narrow screens. */
export function MobileTopBar({ userCard }: UserCardSlot) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-sidebar px-4 lg:hidden">
      <Brand />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Menu className="size-[18px]" aria-hidden="true" />
            <span className="sr-only">Mở menu điều hướng</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[264px] gap-0 border-sidebar-border bg-sidebar px-4 py-6 text-sidebar-foreground [&>[data-slot=sheet-close]]:text-sidebar-foreground [&>[data-slot=sheet-close]]:hover:bg-sidebar-accent"
        >
          <SheetTitle className="sr-only">Điều hướng chính</SheetTitle>
          <SheetDescription className="sr-only">
            Chuyển giữa các trang quản lý
          </SheetDescription>
          <nav aria-label="Điều hướng chính" className="flex flex-1 flex-col gap-7">
            <SidebarBody userCard={userCard} onNavigate={() => setOpen(false)} />
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
