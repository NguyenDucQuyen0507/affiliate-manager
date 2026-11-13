// Remembers the channels and posting times of the last deal created in this browser
// (localStorage), so the next new deal starts with them already selected.
// Browser-only; every storage access is guarded because it can throw or be empty.

import { addDays, nowInAppTimeZone } from "@/lib/format";
import type { DealFormValues } from "@/lib/deal-schema";

const STORAGE_KEY = "affiliate-manager:last-deal-targets";
const TIME_RE = /^\d{2}:\d{2}$/;

type Saved = {
  v: 1;
  /** channelId → time of day "HH:mm" ("" when the post went out right away). */
  channels: Record<string, string>;
  showOnBio: boolean;
};

export function rememberDealTargets(values: DealFormValues) {
  const channels: Record<string, string> = {};
  for (const target of values.targets) {
    if (!target.enabled) continue;
    channels[target.channelId] = values.intent === "schedule" ? target.scheduledAt.slice(11, 16) : "";
  }
  const saved: Saved = { v: 1, channels, showOnBio: values.showOnBio };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Storage blocked or full: remembering is only a convenience.
  }
}

function readSaved(): Saved | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!parsed || typeof parsed !== "object") return null;
    const { v, channels, showOnBio } = parsed as Partial<Saved>;
    if (v !== 1 || !channels || typeof channels !== "object") return null;
    return { v, channels, showOnBio: showOnBio === true };
  } catch {
    return null;
  }
}

/** Next occurrence of "HH:mm" in Vietnam time: today if still ahead, else tomorrow. */
function nextOccurrence(time: string) {
  const now = nowInAppTimeZone();
  const today = `${now.date}T${time}`;
  return today > now.dateTime ? today : `${addDays(now.date, 1)}T${time}`;
}

/**
 * The remembered selection applied to fresh form targets, or null when nothing
 * is remembered. Channels that no longer exist are ignored.
 */
export function recallDealTargets(
  targets: DealFormValues["targets"],
): Pick<DealFormValues, "targets" | "showOnBio"> | null {
  const saved = readSaved();
  if (!saved) return null;
  const known = targets.some((target) => Object.hasOwn(saved.channels, target.channelId));
  if (!known && !saved.showOnBio) return null;

  return {
    showOnBio: saved.showOnBio,
    targets: targets.map((target) => {
      if (!Object.hasOwn(saved.channels, target.channelId)) return target;
      const time = saved.channels[target.channelId];
      return {
        ...target,
        enabled: true,
        scheduledAt: typeof time === "string" && TIME_RE.test(time) ? nextOccurrence(time) : target.scheduledAt,
      };
    }),
  };
}
