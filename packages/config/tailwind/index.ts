import type { Config } from "tailwindcss";
import { palette, radius, shadow, marqueeDuration, fontStacks } from "./theme";

/**
 * Shared Tailwind preset for BazaarX web surfaces. All design tokens live in
 * `./theme.ts` — edit that one file to re-skin the whole app.
 */
const preset: Omit<Config, "content"> = {
  theme: {
    extend: {
      colors: {
        brand: palette.brand,
        ink: palette.ink,
        accent: palette.accent,
        promo: palette.promo,
      },
      fontFamily: {
        display: fontStacks.display,
        sans: fontStacks.sans,
      },
      borderRadius: radius,
      boxShadow: shadow,
      container: {
        center: true,
        padding: "1.25rem",
        screens: { "2xl": "1320px" },
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "badge-pop": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        // Seamless infinite ticker: the track holds two copies of the content,
        // so shifting by -50% lands exactly on the start of the second copy.
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        // Slow zoom/pan for hero slides.
        kenburns: {
          "0%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1.15)" },
        },
        "shine": {
          "0%": { transform: "translateX(-120%) skewX(-12deg)" },
          "100%": { transform: "translateX(220%) skewX(-12deg)" },
        },
        // Full rotation for the travelling border-light on the coupon card.
        revolve: {
          from: { transform: "translate(-50%, -50%) rotate(0deg)" },
          to: { transform: "translate(-50%, -50%) rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.5s ease both",
        "badge-pop": "badge-pop 0.3s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16,1,0.3,1) both",
        float: "float 5s ease-in-out infinite",
        kenburns: "kenburns 9s ease-out both",
        revolve: "revolve 4s linear infinite",
        marquee: `marquee ${marqueeDuration} linear infinite`,
      },
      transitionTimingFunction: {
        // Premium "out-expo"-style easing used across hovers and entrances.
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default preset;
