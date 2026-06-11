/** Date helpers for order/return windows. */

export const RETURN_WINDOW_DAYS = 7;

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** True if `deliveredAt` is still inside the return window. */
export function isWithinReturnWindow(deliveredAt: Date, now: Date = new Date()): boolean {
  return now <= addDays(deliveredAt, RETURN_WINDOW_DAYS);
}

/** Human-friendly relative-ish formatting for order timelines. */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
