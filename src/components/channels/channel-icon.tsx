import { Send, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

/** lucide-react 1.x dropped brand icons; this is the same stroke "f" used in the mockup. */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const tileClass = "flex size-11 flex-none items-center justify-center rounded-lg";

export function ChannelIcon({ kind }: { kind: "FACEBOOK" | "TELEGRAM" | "BIO" }) {
  if (kind === "FACEBOOK") {
    return (
      <div className={cn(tileClass, "bg-brand-facebook-soft text-brand-facebook")}>
        <FacebookIcon className="size-[22px]" />
      </div>
    );
  }
  if (kind === "TELEGRAM") {
    return (
      <div className={cn(tileClass, "bg-brand-telegram-soft text-brand-telegram")}>
        <Send className="size-[22px]" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className={cn(tileClass, "bg-primary-soft text-primary")}>
      <Smartphone className="size-[22px]" aria-hidden="true" />
    </div>
  );
}
