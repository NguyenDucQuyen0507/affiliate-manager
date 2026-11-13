import { Suspense } from "react";
import { DesktopSidebar, MobileTopBar } from "@/components/dashboard/sidebar";
import { SidebarUserCard, SidebarUserCardSkeleton } from "@/components/dashboard/user-card";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  // Reads the session cookie, so it streams in at request time.
  const userCard = (
    <Suspense fallback={<SidebarUserCardSkeleton />}>
      <SidebarUserCard />
    </Suspense>
  );

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-background lg:flex-row">
      <MobileTopBar userCard={userCard} />
      <DesktopSidebar userCard={userCard} />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-12 sm:px-10 sm:pt-8">
        {children}
      </main>
    </div>
  );
}
