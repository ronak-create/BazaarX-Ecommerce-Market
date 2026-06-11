"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

let synced = false;

async function syncProfile() {
  if (synced) return;
  synced = true;
  try {
    await fetch("/api/auth/sync", { method: "POST" });
  } catch {
    synced = false; // allow a retry on next auth event
  }
}

/**
 * Mirrors the Supabase user into the Prisma User table once per session.
 * Runs on mount (if already signed in) and on every SIGNED_IN event.
 * Mounted in Providers so it covers the whole app.
 */
export function AuthSync() {
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void syncProfile();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void syncProfile();
      if (event === "SIGNED_OUT") synced = false;
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}
