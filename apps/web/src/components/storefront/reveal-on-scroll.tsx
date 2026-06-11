"use client";

import { useEffect } from "react";

/**
 * Reveals any element carrying the `.reveal` class as it scrolls into view by
 * toggling `.is-visible` (styles live in globals.css). One IntersectionObserver
 * for the whole page — no scroll listeners, no re-renders. Honors reduced motion
 * via the CSS fallback. Re-scans when the route content changes.
 */
export function RevealOnScroll() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)"));
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });

  return null;
}
