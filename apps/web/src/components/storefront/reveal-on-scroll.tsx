"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Reveals any element carrying the `.reveal` class as it scrolls into view by
 * toggling `.is-visible` (styles live in globals.css). One IntersectionObserver
 * for the whole page — no scroll listeners, no re-renders. Honors reduced motion
 * via the CSS fallback.
 *
 * Keyed on the pathname: this component lives in the storefront layout, which
 * does NOT remount on client-side navigation, so without re-running per route
 * the next page's `.reveal` elements would stay hidden until a hard reload.
 */
export function RevealOnScroll() {
  const pathname = usePathname();

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
  }, [pathname]);

  return null;
}
