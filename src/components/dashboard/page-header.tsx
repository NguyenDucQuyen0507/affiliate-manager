import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[30px] leading-tight font-bold tracking-[-0.01em]">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button asChild size="touch">
        <Link href="/dashboard/deals/new">
          <Plus strokeWidth={2.2} aria-hidden="true" />
          Tạo deal mới
        </Link>
      </Button>
    </header>
  );
}
