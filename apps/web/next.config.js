// Load the monorepo-root .env so there is a single source of truth for secrets.
// Runs before Next reads env, so server vars and NEXT_PUBLIC_* are populated.
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@bazaarx/db", "@bazaarx/types", "@bazaarx/utils", "@bazaarx/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

module.exports = nextConfig;
