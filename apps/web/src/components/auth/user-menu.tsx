"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  User,
  Package,
  Storefront,
  Handshake,
  ShieldCheck,
  SignOut,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import type { AuthProfile } from "@bazaarx/types";

export function UserMenu() {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfile(null);
    setOpen(false);
    window.location.href = "/";
  }

  if (loading) return <div className="h-10 w-10 animate-pulse rounded-full bg-ink-100" />;

  if (!profile) {
    return (
      <Link
        href="/auth/login"
        className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-fg shadow-pop transition-all hover:bg-brand-800 active:scale-[0.98]"
      >
        <User size={16} weight="bold" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  const label = profile.name || profile.email || profile.phone || "Account";
  const initial = (profile.name || profile.email || "?").charAt(0).toUpperCase();

  const items = [
    { href: "/orders", label: "My orders", icon: Package, show: true },
    { href: "/admin/kyc", label: "Admin console", icon: ShieldCheck, show: profile.role === "ADMIN" },
    {
      href: "/seller/onboarding",
      label: profile.isSeller ? "Seller dashboard" : "Sell on BazaarX",
      icon: Storefront,
      show: true,
    },
    { href: "/reseller", label: "Reseller", icon: Handshake, show: profile.isReseller },
  ].filter((i) => i.show);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={`grid h-10 w-10 place-items-center overflow-hidden rounded-full border transition-all active:scale-95 ${
          open ? "border-brand-400 ring-2 ring-brand-100" : "border-ink-200 hover:border-ink-300"
        }`}
      >
        {profile.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center bg-brand-50 font-display text-sm font-semibold text-brand-700">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 origin-top-right animate-fade-up overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-pop"
        >
          <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-50 font-display text-sm font-semibold text-brand-700">
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-ink-900">{label}</div>
              {profile.email && (
                <div className="truncate text-xs text-ink-500">{profile.email}</div>
              )}
            </div>
          </div>

          <div className="py-1.5">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50 hover:text-brand-700"
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-ink-100 py-1.5">
            <button
              onClick={signOut}
              role="menuitem"
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-accent transition-colors hover:bg-accent/5"
            >
              <SignOut size={18} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
