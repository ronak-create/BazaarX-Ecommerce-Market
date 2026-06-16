/**
 * ────────────────────────────────────────────────────────────────────────────
 *  BAZAARX — SINGLE SOURCE OF TRUTH FOR THE VISUAL THEME
 * ────────────────────────────────────────────────────────────────────────────
 *  Change the look of the entire app from this one file. Every colour, radius,
 *  shadow and motion token below is consumed by the Tailwind preset
 *  (`./index.ts`) and therefore by every surface (storefront, seller, admin).
 *
 *  • The system is intentionally MONOCHROME: `brand`, `ink` and `accent` are
 *    pure black-and-white ramps. Want a different brand colour later? Swap the
 *    `brand` ramp here and the whole UI follows.
 *  • `promo` is the ONLY chromatic accent — reserved for offer strips, the
 *    first-order coupon, and "sale" signalling. Flip it red/green/etc. here.
 *  • Fonts are declared in `apps/web/src/app/layout.tsx` (next/font requires
 *    module scope); their CSS variables are wired up under `fontFamily` below.
 * ────────────────────────────────────────────────────────────────────────────
 */

export const palette = {
  // Monochrome "brand" ramp: near-white (50) → true black (900).
  brand: {
    DEFAULT: "#0A0A0A",
    fg: "#FFFFFF",
    50: "#F5F5F5",
    100: "#E5E5E5",
    200: "#D4D4D4",
    300: "#A3A3A3",
    400: "#737373",
    500: "#404040",
    600: "#1F1F1F",
    700: "#141414",
    800: "#0A0A0A",
    900: "#000000",
  },
  // Pure-neutral surface/text scale — true grays, no warmth.
  ink: {
    50: "#FAFAFA",
    100: "#F4F4F5",
    200: "#E4E4E7",
    300: "#D4D4D8",
    400: "#A1A1AA",
    500: "#71717A",
    600: "#52525B",
    700: "#3F3F46",
    800: "#27272A",
    900: "#0A0A0A",
  },
  // Accent collapses to black in the monochrome system.
  accent: {
    DEFAULT: "#0A0A0A",
    fg: "#FFFFFF",
  },
  // The single chromatic accent — offers, coupons, savings. (Emerald green.)
  promo: {
    DEFAULT: "#059669",
    fg: "#FFFFFF",
    50: "#ECFDF5",
    100: "#D1FAE5",
    600: "#059669",
    700: "#047857",
  },
};

export const radius = {
  xl: "0.875rem",
  "2xl": "1.25rem",
  "3xl": "1.75rem",
};

export const shadow = {
  card: "0 1px 2px rgba(0,0,0,0.05), 0 8px 24px -12px rgba(0,0,0,0.14)",
  "card-hover": "0 4px 8px rgba(0,0,0,0.08), 0 24px 48px -20px rgba(0,0,0,0.28)",
  pop: "0 8px 30px -8px rgba(0,0,0,0.22)",
};

/** How long one full loop of the offer marquee takes. */
export const marqueeDuration = "34s";

/** CSS-variable font stacks (the actual fonts are loaded in layout.tsx). */
export const fontStacks = {
  display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
  sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
};
