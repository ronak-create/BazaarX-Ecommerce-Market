import type { Config } from "tailwindcss";

/** Shared Tailwind preset for BazaarX web surfaces. */
const preset: Omit<Config, "content"> = {
  theme: {
    extend: {
      colors: {
        // Monochrome theme. "brand" is now a pure grayscale ramp running from
        // near-white (50) to true black (900) so every existing `bg-brand` /
        // `text-brand-xxx` usage renders as black-and-white, not violet.
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
        // Pure-neutral surface/text scale ("ink") — true grays, no warmth, for
        // a crisp black-on-white editorial feel.
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
        // Accent collapses to black in the monochrome system (sale prices,
        // ratings, urgency now read as solid black rather than rose).
        accent: {
          DEFAULT: "#0A0A0A",
          fg: "#FFFFFF",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        // Pure-black soft shadows for the monochrome system.
        card: "0 1px 2px rgba(0,0,0,0.05), 0 8px 24px -12px rgba(0,0,0,0.14)",
        "card-hover": "0 2px 4px rgba(0,0,0,0.07), 0 16px 36px -16px rgba(0,0,0,0.20)",
        pop: "0 8px 30px -8px rgba(0,0,0,0.22)",
      },
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
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.5s ease both",
        "badge-pop": "badge-pop 0.3s cubic-bezier(0.16,1,0.3,1) both",
        marquee: "marquee 32s linear infinite",
      },
    },
  },
  plugins: [],
};

export default preset;
