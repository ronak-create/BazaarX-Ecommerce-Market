"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@bazaarx/ui";
import { createClient } from "@/lib/supabase/client";
import type { AuthProfile } from "@bazaarx/types";

export function UserMenu() {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    setProfile(res.ok ? await res.json() : null);
    setLoading(false);
  }

  useEffect(() => {
    const supabase = createClient();
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfile(null);
    window.location.href = "/";
  }

  if (loading) return <div className="h-9 w-24 animate-pulse rounded-md bg-slate-100" />;

  if (!profile) {
    return (
      <Link href="/auth/login">
        <Button>Sign in</Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/orders" className="text-slate-600 hover:underline">
        Orders
      </Link>
      <span className="hidden text-slate-600 sm:inline">
        {profile.name || profile.email || profile.phone}
      </span>
      {profile.role === "ADMIN" && (
        <Link href="/admin/kyc" className="text-brand hover:underline">
          Admin
        </Link>
      )}
      {profile.isSeller ? (
        <Link href="/seller/onboarding" className="text-brand hover:underline">
          Seller
        </Link>
      ) : (
        <Link href="/seller/onboarding" className="text-slate-600 hover:underline">
          Sell on BazaarX
        </Link>
      )}
      <Button variant="outline" onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}
