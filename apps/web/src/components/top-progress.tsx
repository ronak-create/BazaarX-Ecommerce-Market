"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Slim top progress bar for instant click feedback. App Router gives no
 * navigation-start event, so we intercept same-origin link clicks to start the
 * bar and finish it when the pathname/search actually changes. Removes the
 * "nothing happened for 2s" feeling on slow server pages.
 */
export function TopProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Begin on internal link clicks (left-click, no modifier, same origin).
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || a.target === "_blank" || a.hasAttribute("download")) return;
      if (a.origin !== window.location.origin) return;
      if (a.pathname === window.location.pathname && a.search === window.location.search) return;
      start();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // The route committed — complete the bar.
  useEffect(() => {
    if (!active) return;
    done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function start() {
    clearTimers();
    setActive(true);
    setWidth(8);
    // Creep forward so the bar always shows motion while the page loads.
    const steps: { at: number; to: number }[] = [
      { at: 120, to: 28 },
      { at: 320, to: 52 },
      { at: 700, to: 74 },
      { at: 1300, to: 88 },
    ];
    steps.forEach(({ at, to }) => {
      timers.current.push(setTimeout(() => setWidth(to), at));
    });
  }

  function done() {
    clearTimers();
    setWidth(100);
    timers.current.push(
      setTimeout(() => {
        setActive(false);
        setWidth(0);
      }, 260),
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5">
      <div
        className="h-full bg-ink-900 transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${width}%`, opacity: active ? 1 : 0 }}
      />
    </div>
  );
}
