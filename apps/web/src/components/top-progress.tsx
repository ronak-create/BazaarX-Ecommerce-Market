"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Navigation feedback: a slim top progress bar for instant click feedback PLUS a
 * full-screen blurred overlay with the Sandy loader for slow (DB-bound) pages.
 * App Router gives no navigation-start event, so we intercept same-origin link
 * clicks to start and finish when the pathname/search actually changes. The
 * overlay only appears after a short delay, so fast/cached navigations never
 * flash it — it surfaces precisely when a page is genuinely waiting on data.
 */
export function TopProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [active, setActive] = useState(false);
  const [overlay, setOverlay] = useState(false);
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
    // Reveal the blur overlay only if the navigation is still pending after a
    // short beat — quick/cached pages resolve first and never flash it.
    timers.current.push(setTimeout(() => setOverlay(true), 180));
    // Safety net: never let the overlay get stuck if a route never commits.
    timers.current.push(setTimeout(() => done(), 12_000));
  }

  function done() {
    clearTimers();
    setOverlay(false);
    setWidth(100);
    timers.current.push(
      setTimeout(() => {
        setActive(false);
        setWidth(0);
      }, 260),
    );
  }

  return (
    <>
      {/* Slim top bar */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5">
        <div
          className="h-full bg-ink-900 transition-[width,opacity] duration-200 ease-out"
          style={{ width: `${width}%`, opacity: active ? 1 : 0 }}
        />
      </div>

      {/* Full-screen blur + Sandy loader for slow, data-bound navigations */}
      {overlay && (
        <div
          role="status"
          aria-busy="true"
          aria-label="Loading"
          className="animate-fade-in fixed inset-0 z-[90] flex items-center justify-center bg-ink-50/55 backdrop-blur-md"
        >
          <div className="animate-scale-in flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sandy-loading.svg"
              alt=""
              width={112}
              height={112}
              className="h-28 w-28 select-none drop-shadow"
              draggable={false}
            />
            <div className="flex items-center gap-1.5 text-sm font-medium tracking-wide text-ink-600">
              <span>Loading</span>
              <span className="inline-flex gap-0.5">
                <span className="h-1 w-1 animate-bounce rounded-full bg-ink-400 [animation-delay:-0.3s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-ink-400 [animation-delay:-0.15s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-ink-400" />
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
