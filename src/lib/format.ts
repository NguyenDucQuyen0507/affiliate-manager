// Pure formatting helpers (safe for both server and client components).

const priceFormatter = new Intl.NumberFormat("vi-VN");

/** 189000 → "189.000" */
export function formatNumber(value: number) {
  return priceFormatter.format(value);
}

/** 189000 → "189.000đ" */
export function formatPrice(vnd: number) {
  return `${formatNumber(vnd)}đ`;
}

/** "2026-11-20" (or "2026-11-20T09:00") → "20/11" */
export function formatShortDate(isoDate: string) {
  const [, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}`;
}

/** "2026-11-12T11:30" → "11:30" */
export function formatTime(localDateTime: string) {
  return localDateTime.slice(11, 16);
}

/**
 * "2026-11-12T11:30" → "Hôm nay lúc 11:30" when the date is `today` (YYYY-MM-DD),
 * otherwise "12/11 lúc 11:30".
 */
export function formatScheduleLabel(localDateTime: string, today: string | null) {
  const date = localDateTime.slice(0, 10);
  const day = date === today ? "Hôm nay" : formatShortDate(date);
  return `${day} lúc ${formatTime(localDateTime)}`;
}

/**
 * All schedule times are wall-clock times in Vietnam. Computing "today" in this
 * zone (not the server's or browser's) keeps "Hôm nay"/"Ngày mai" consistent.
 */
export const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

const appClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Current time in APP_TIME_ZONE: { date: "YYYY-MM-DD", dateTime: "YYYY-MM-DDTHH:mm" }. */
export function nowInAppTimeZone(now = new Date()) {
  const parts = Object.fromEntries(appClock.formatToParts(now).map((p) => [p.type, p.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return { date, dateTime: `${date}T${parts.hour}:${parts.minute}` };
}

/** Today's date in APP_TIME_ZONE as YYYY-MM-DD. */
export function todayKey() {
  return nowInAppTimeZone().date;
}

/** "2026-11-12" + 1 → "2026-11-13" */
export function addDays(dateKey: string, days: number) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/** "2026-11-12" → "Thứ Năm" */
export function weekdayLabel(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** "Hôm nay", "Ngày mai", "Hôm qua" relative to `today`, else null. */
function relativeDay(dateKey: string, today: string | null) {
  if (!today) return null;
  if (dateKey === today) return "Hôm nay";
  if (dateKey === addDays(today, 1)) return "Ngày mai";
  if (dateKey === addDays(today, -1)) return "Hôm qua";
  return null;
}

/** Day group heading: "Hôm nay · Thứ Năm 12/11", or "Thứ Bảy 14/11". */
export function formatDayHeading(dateKey: string, today: string | null) {
  const day = `${weekdayLabel(dateKey)} ${formatShortDate(dateKey)}`;
  const relative = relativeDay(dateKey, today);
  return relative ? `${relative} · ${day}` : day;
}

/** "2026-11-12T10:15" → "Hôm nay 10:15", or "09/11 10:15". */
export function formatRelativeDateTime(localDateTime: string, today: string | null) {
  const date = localDateTime.slice(0, 10);
  return `${relativeDay(date, today) ?? formatShortDate(date)} ${formatTime(localDateTime)}`;
}
