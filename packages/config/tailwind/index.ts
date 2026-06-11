import type { Config } from "tailwindcss";

/** Shared Tailwind preset for BazaarX web surfaces. */
const preset: Omit<Config, "content"> = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#5B21B6",
          fg: "#FFFFFF",
        },
      },
      container: {
        center: true,
        padding: "1rem",
        screens: { "2xl": "1280px" },
      },
    },
  },
  plugins: [],
};

export default preset;
