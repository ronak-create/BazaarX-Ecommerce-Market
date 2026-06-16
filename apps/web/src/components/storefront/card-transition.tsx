"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Signature page transition for product-card clicks. The clicked card spins on
 * its vertical axis a few times while flying toward the viewer (a real 3D card —
 * product image on the front, black back face, thin physical depth). On the final
 * half-turn the black back fills the screen; we hold black until the product page
 * reports ready (`route:ready`), then lift the black up like an opening curtain.
 *
 * Mounted once in providers (above the router) so its state survives the
 * navigation. Driven by event delegation so individual cards stay server
 * components — they only carry `data-product-card` + `data-card-image`.
 */

type Phase = "idle" | "spin" | "hold" | "lift";

const DEPTH = 16; // px of card thickness
const PERSPECTIVE = 1400;

export function CardTransition() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [image, setImage] = useState<string>("");

  const cardRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const readyRef = useRef(false); // destination page has mounted
  const coverShownAt = useRef(0);
  const phaseRef = useRef<Phase>("idle"); // authoritative across stale closures
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function goPhase(p: Phase) {
    phaseRef.current = p;
    setPhase(p);
  }

  // ---- Intercept product-card clicks (capture phase, before <Link>) ----------
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement)?.closest?.("a[data-product-card]") as HTMLAnchorElement | null;
      if (!a) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // let native nav happen
      const href = a.getAttribute("href");
      if (!href) return;

      e.preventDefault();
      rectRef.current = a.getBoundingClientRect();
      setImage(a.getAttribute("data-card-image") || "");
      readyRef.current = false;
      run(href);
    }
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Listen for the destination "ready" beacon -----------------------------
  useEffect(() => {
    function onReady() {
      readyRef.current = true;
      maybeLift();
    }
    window.addEventListener("route:ready", onReady);
    return () => window.removeEventListener("route:ready", onReady);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  async function run(href: string) {
    const rect = rectRef.current;
    if (!rect) return;
    goPhase("spin");

    // Wait a frame so the card element exists, then choreograph with WAAPI.
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const el = cardRef.current;
    if (!el) {
      router.push(href);
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = vw / 2 - cx;
    const dy = vh / 2 - cy;
    const cover = (Math.max(vw / rect.width, vh / rect.height) * 1.15).toFixed(3);

    const easing = "cubic-bezier(0.65, 0, 0.35, 1)";
    const baseScale = "1";

    // Stage 1 — spin + approach (front image visible, growing toward viewer).
    const spin = el.animate(
      [
        { transform: `translate3d(0,0,0) rotateY(0deg) scale(${baseScale})` },
        { transform: `translate3d(${dx * 0.5}px, ${dy * 0.5}px, 120px) rotateY(360deg) scale(${(Number(cover) * 0.55).toFixed(3)})`, offset: 0.55 },
        { transform: `translate3d(${dx}px, ${dy}px, 240px) rotateY(720deg) scale(${(Number(cover) * 0.8).toFixed(3)})` },
      ],
      { duration: 900, easing, fill: "forwards" },
    );

    // Start loading the destination in parallel with the spin.
    router.push(href);

    try {
      await spin.finished;
    } catch {
      return; // cancelled
    }
    if (cardRef.current !== el) return;

    // Stage 2 — cover: finish on the black back face, scaled past the viewport.
    const coverAnim = el.animate(
      [
        { transform: `translate3d(${dx}px, ${dy}px, 240px) rotateY(720deg) scale(${(Number(cover) * 0.8).toFixed(3)})` },
        { transform: `translate3d(${dx}px, ${dy}px, 0px) rotateY(900deg) scale(${cover})` },
      ],
      { duration: 450, easing: "cubic-bezier(0.5, 0, 0.2, 1)", fill: "forwards" },
    );
    try {
      await coverAnim.finished;
    } catch {
      return;
    }

    // Stage 3 — hold a plain black cover (seamless), then wait for readiness.
    coverShownAt.current = performance.now();
    goPhase("hold");
    // Safety: never stay black forever.
    timers.current.push(setTimeout(() => maybeLift(true), 6000));
    maybeLift();
  }

  function maybeLift(force = false) {
    if (phaseRef.current === "lift") return;
    if (!force && !readyRef.current) return;
    if (!coverShownAt.current) return; // not covering yet
    const elapsed = performance.now() - coverShownAt.current;
    const wait = Math.max(0, 200 - elapsed); // small minimum hold
    timers.current.push(setTimeout(lift, wait));
  }

  async function lift() {
    if (phaseRef.current === "lift") return;
    const cover = coverRef.current;
    goPhase("lift");
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const target = coverRef.current ?? cover;
    if (!target) {
      reset();
      return;
    }
    const anim = target.animate(
      [{ transform: "translateY(0%)" }, { transform: "translateY(-100%)" }],
      { duration: 600, easing: "cubic-bezier(0.7, 0, 0.3, 1)", fill: "forwards" },
    );
    try {
      await anim.finished;
    } catch {
      /* cancelled */
    }
    reset();
  }

  function reset() {
    clearTimers();
    coverShownAt.current = 0;
    readyRef.current = false;
    rectRef.current = null;
    goPhase("idle");
  }

  if (phase === "idle") return null;

  const rect = rectRef.current;
  const showCard = phase === "spin" && rect;
  const showCover = phase === "hold" || phase === "lift";

  const faceBase: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    borderRadius: 16,
    overflow: "hidden",
  };

  return (
    <div className="fixed inset-0 z-[120]" style={{ pointerEvents: showCover ? "auto" : "none" }} aria-hidden>
      {/* 3D spinning card */}
      {showCard && rect && (
        <div style={{ position: "absolute", inset: 0, perspective: `${PERSPECTIVE}px` }}>
          <div
            ref={cardRef}
            style={{
              position: "fixed",
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              transformStyle: "preserve-3d",
              willChange: "transform",
            }}
          >
            {/* Front — product image */}
            <div style={{ ...faceBase, transform: `translateZ(${DEPTH / 2}px)`, background: "#0a0a0a" }}>
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
              ) : null}
            </div>
            {/* Back — black */}
            <div style={{ ...faceBase, transform: `rotateY(180deg) translateZ(${DEPTH / 2}px)`, background: "#000" }} />
            {/* Edges — give the card real thickness */}
            <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: DEPTH, background: "#111", transform: `rotateY(-90deg) translateZ(${DEPTH / 2}px)`, transformOrigin: "left center" }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: DEPTH, background: "#111", transform: `rotateY(90deg) translateZ(${DEPTH / 2}px)`, transformOrigin: "right center" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: DEPTH, background: "#161616", transform: `rotateX(90deg) translateZ(${DEPTH / 2}px)`, transformOrigin: "center top" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: DEPTH, background: "#161616", transform: `rotateX(-90deg) translateZ(${DEPTH / 2}px)`, transformOrigin: "center bottom" }} />
          </div>
        </div>
      )}

      {/* Black cover (held while loading, then lifts up like an opening screen) */}
      {showCover && (
        <div
          ref={coverRef}
          className="fixed inset-0 flex items-center justify-center bg-black"
          style={{ willChange: "transform" }}
        >
          {/* faint loader so a slow load isn't a dead black screen */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sandy-loading.svg" alt="" width={96} height={96} className="h-24 w-24 opacity-30 invert" draggable={false} />
        </div>
      )}
    </div>
  );
}
