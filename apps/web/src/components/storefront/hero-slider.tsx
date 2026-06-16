"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";

export type HeroSlide = { src: string; href: string; label?: string | null };

/**
 * Auto-advancing hero carousel with a slow Ken-Burns zoom + crossfade between
 * slides. Pauses on hover, supports dot navigation, and respects a single slide
 * gracefully (no controls shown). Images come from HOME banners, padded with
 * recent product imagery so the motion is visible from day one.
 */
export function HeroSlider({ slides, intervalMs = 4500 }: { slides: HeroSlide[]; intervalMs?: number }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const id = setInterval(() => setI((p) => (p + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [count, paused, intervalMs]);

  const active = slides[i] ?? slides[0];
  if (!active) return null;

  return (
    <div
      className="group relative block min-h-[280px] overflow-hidden rounded-3xl border border-ink-200 bg-ink-900 lg:min-h-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={s.src + idx}
          src={s.src}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-smooth ${
            idx === i ? "animate-kenburns opacity-100" : "scale-105 opacity-0"
          }`}
        />
      ))}

      {/* Readability gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />

      <Link href={active.href} className="absolute inset-0" aria-label="Shop the latest" />

      <span className="pointer-events-none absolute bottom-5 left-5 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-ink-900 backdrop-blur">
        Shop the latest <ArrowRight size={13} weight="bold" />
      </span>

      {count > 1 && (
        <div className="absolute bottom-6 right-5 flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === i ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
