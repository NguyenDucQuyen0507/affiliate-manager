import { Skeleton } from "@/components/ui/skeleton";

export function EditorSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32 bg-muted-track" />
        <Skeleton className="h-9 w-56 bg-muted-track" />
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <Skeleton className="h-[720px] min-w-0 flex-[3_1_520px] rounded-xl bg-muted-track" />
        <Skeleton className="h-[560px] min-w-0 flex-[2_1_380px] rounded-xl bg-muted-track" />
      </div>
    </div>
  );
}
