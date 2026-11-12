import { DesktopSidebar, MobileTopBar } from "@/components/dashboard/sidebar";
import { currentUser } from "@/lib/sample-data/dashboard";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-background lg:flex-row">
      <MobileTopBar user={currentUser} />
      <DesktopSidebar user={currentUser} />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-12 sm:px-10 sm:pt-8">
        {children}
      </main>
    </div>
  );
}
