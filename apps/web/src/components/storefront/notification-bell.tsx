"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check } from "@phosphor-icons/react";
import { formatDateTime } from "@bazaarx/utils";
import { useNotifications, useMarkNotificationsRead } from "@/hooks/use-notifications";

export function NotificationBell() {
  const { data } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  // Mark everything read once the panel is opened.
  useEffect(() => {
    if (open && unread > 0) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative grid h-10 w-10 place-items-center rounded-full text-ink-700 transition-colors hover:bg-ink-100 hover:text-brand-700 active:scale-95"
      >
        <Bell size={22} weight={unread > 0 ? "fill" : "regular"} />
        {unread > 0 && (
          <span
            key={unread}
            className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] animate-badge-pop place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-fg ring-2 ring-ink-50"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-80 origin-top-right animate-fade-up overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-pop"
        >
          <div className="border-b border-ink-100 px-4 py-3">
            <span className="font-display text-sm font-semibold text-ink-900">Notifications</span>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell size={26} className="mx-auto text-ink-300" />
              <p className="mt-2 text-sm text-ink-500">No notifications yet.</p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`flex gap-3 border-b border-ink-100 px-4 py-3 last:border-b-0 ${
                    n.isRead ? "" : "bg-brand-50/40"
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-transparent" : "bg-brand-500"}`}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink-900">{n.title}</div>
                    <div className="text-sm text-ink-600">{n.body}</div>
                    <div className="mt-0.5 text-xs text-ink-400">{formatDateTime(n.createdAt)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {unread > 0 && (
            <button
              onClick={() => markRead.mutate()}
              className="flex w-full items-center justify-center gap-1.5 border-t border-ink-100 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-ink-50"
            >
              <Check size={15} weight="bold" /> Mark all read
            </button>
          )}
        </div>
      )}
    </div>
  );
}
