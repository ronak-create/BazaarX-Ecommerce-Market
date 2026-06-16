"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, ArrowRight, Sparkle } from "@phosphor-icons/react";

/**
 * Homepage promo callout for the public first-order coupon. Click-to-copy the
 * code. Uses the single chromatic accent (`promo`) against the mono system.
 */
export function CouponBanner({ code = "FIRST30", percent = 30 }: { code?: string; percent?: number }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard may be unavailable; the code is shown regardless */
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-promo px-6 py-7 text-promo-fg shadow-pop sm:px-10 sm:py-8">
      {/* Decorative grain of large dots */}
      <Sparkle weight="fill" className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 text-white/10" />
      <Sparkle weight="fill" className="pointer-events-none absolute bottom-2 right-24 h-12 w-12 text-white/10" />

      <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]">
            <Sparkle size={12} weight="fill" /> New here?
          </div>
          <h2 className="mt-3 font-display text-2xl font-semibold leading-tight sm:text-3xl">
            Get {percent}% off your first order.
          </h2>
          <p className="mt-1 text-sm text-white/80">
            Sign up, shop anything, and apply the code at checkout. One per account.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={copy}
            className="group inline-flex items-center gap-2.5 rounded-2xl border-2 border-dashed border-white/50 bg-white/10 px-4 py-3 font-mono text-lg font-bold tracking-widest transition hover:bg-white/20"
            aria-label={`Copy coupon code ${code}`}
          >
            {code}
            {copied ? <Check size={18} weight="bold" /> : <Copy size={18} className="opacity-80 group-hover:opacity-100" />}
          </button>
          <Link
            href="/search"
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-promo-700 transition hover:scale-105 active:scale-95"
            aria-label="Start shopping"
          >
            <ArrowRight size={20} weight="bold" />
          </Link>
        </div>
      </div>
    </section>
  );
}
