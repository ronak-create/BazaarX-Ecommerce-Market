import { formatDateTime } from "@bazaarx/utils";
import { StatusBadge } from "./status-badge";
import type { OrderTrackingDTO } from "@bazaarx/types";

export function TrackingTimeline({ tracking }: { tracking: OrderTrackingDTO[] }) {
  if (tracking.length === 0) return null;
  // Most recent first.
  const events = [...tracking].reverse();

  return (
    <ol className="space-y-3">
      {events.map((t) => (
        <li key={t.id} className="flex gap-3">
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <StatusBadge status={t.status} />
              <span className="text-xs text-slate-400">{formatDateTime(t.timestamp)}</span>
            </div>
            {t.message && <p className="mt-0.5 text-slate-600">{t.message}</p>}
            {t.trackingNumber && (
              <p className="mt-0.5 text-xs text-slate-500">
                {t.carrier} · {t.trackingNumber}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
