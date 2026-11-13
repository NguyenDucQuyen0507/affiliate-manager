"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { scheduleTabHref, scheduleTabs, type ScheduleTab } from "@/lib/schedule-tabs";
import type { PostStatus } from "@/lib/types";

export function ScheduleTabs({
  value,
  counts,
}: {
  value: ScheduleTab;
  counts: Record<PostStatus, number>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <Tabs
      value={value}
      onValueChange={(next) =>
        startTransition(() => {
          router.replace(scheduleTabHref(next as ScheduleTab), { scroll: false });
        })
      }
    >
      <TabsList className="h-auto flex-wrap justify-start" aria-label="Lọc theo trạng thái">
        {scheduleTabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "flex-none",
              // Failed tab stays red so errors get noticed (as in the mockup).
              tab.value === "failed" && "font-semibold text-danger data-active:text-danger",
            )}
          >
            {tab.label} · {counts[tab.status]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
