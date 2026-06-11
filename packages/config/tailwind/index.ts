import type { Config } from "tailwindcss";

/** Shared Tailwind preset for BazaarX web surfaces. */
const preset: Omit<Config, "content"> = {
  theme: {
    extend: {
      colors: {
        // Existing brand violet, preserved, with a full ramp for tints/shades.
        brand: {
          DEFAULT: "#5B21B6",
          fg: "#FFFFFF",
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#5B21B6",
          800: "#4C1D95",
          900: "#3B1672",
        },
        // Warm-neutral surface/text scale ("ink") for a less clinical feel
        // than slate. One neutral family across the whole app.
        ink: {
          50: "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
        },
        // Single accent for sale prices, ratings, urgency.
        accent: {
          DEFAULT: "#E11D48",
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
        // Tinted, soft shadows — no pure-black drop shadows.
        card: "0 1px 2px rgba(28,25,23,0.04), 0 8px 24px -12px rgba(28,25,23,0.12)",
        "card-hover": "0 2px 4px rgba(28,25,23,0.06), 0 18px 40px -16px rgba(91,33,182,0.22)",
        pop: "0 8px 30px -8px rgba(28,25,23,0.18)",
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
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.5s ease both",
        "badge-pop": "badge-pop 0.3s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default preset;
