"use client";

import { useEffect } from "react";

/**
 * Fires a `route:ready` window event once this page has actually mounted (i.e.
 * its server data has resolved and rendered — the group `loading.tsx` shows
 * until then). `card-transition.tsx` listens for this to lift its black cover
 * exactly when the destination is ready. Renders nothing.
 */
export function RouteReadyBeacon() {
  useEffect(() => {
    const id = requestAnimationFrame(() => window.dispatchEvent(new Event("route:ready")));
    return () => cancelAnimationFrame(id);
  }, []);
  return null;
}
