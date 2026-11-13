"use client";

import { useSyncExternalStore } from "react";
import { addDays, fromAppDateTime } from "@/lib/format";

const TICK_MS = 30_000;

function subscribe(onTick: () => void) {
  const timer = setInterval(onTick, TICK_MS);
  return () => clearInterval(timer);
}
// Rounded to the tick so the snapshot stays stable between renders.
const getNow = () => Math.floor(Date.now() / TICK_MS) * TICK_MS;
// Unknown on the server: render nothing there, the browser fills it in after hydration.
const getServerNow = () => null;

/** "Còn 5 giờ 12 phút" until the end of the expiry day (Vietnam time). */
export function Countdown({ expiresAt, className }: { expiresAt: string; className?: string }) {
  const now = useSyncExternalStore(subscribe, getNow, getServerNow);
  if (now === null) return null;

  // A deal is valid through its whole expiry date.
  const end = fromAppDateTime(`${addDays(expiresAt, 1)}T00:00`).getTime();
  const minutes = Math.floor((end - now) / 60_000);
  if (minutes <= 0) return null;

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const label =
    days > 0 ? `Còn ${days} ngày ${hours} giờ` : hours > 0 ? `Còn ${hours} giờ ${mins} phút` : `Còn ${mins} phút`;

  return <span className={className}>{label}</span>;
}
