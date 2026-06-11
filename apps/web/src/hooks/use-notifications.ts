"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NotificationsResponse } from "@bazaarx/types";

const KEY = ["notifications"] as const;
const EMPTY: NotificationsResponse = { items: [], unread: 0 };

/** Poll the caller's notifications; not-signed-in resolves to empty. */
export function useNotifications() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<NotificationsResponse> => {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.status === 401) return EMPTY;
      if (!res.ok) throw new Error("Failed to load notifications");
      return res.json();
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/** Mark every notification read. Optimistically clears the unread count. */
export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", { method: "POST" });
      if (!res.ok && res.status !== 401) throw new Error("Failed to update");
    },
    onMutate: () => {
      const prev = qc.getQueryData<NotificationsResponse>(KEY);
      if (prev) {
        qc.setQueryData<NotificationsResponse>(KEY, {
          unread: 0,
          items: prev.items.map((i) => ({ ...i, isRead: true })),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
