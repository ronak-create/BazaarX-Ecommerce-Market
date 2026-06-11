// Load the monorepo-root .env so there is a single source of truth for secrets.
// Runs before Next reads env, so server vars and NEXT_PUBLIC_* are populated.
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// Security headers applied to every response. CSP is intentionally omitted to
// avoid breaking Razorpay Checkout and Supabase; add a tested CSP before launch.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@bazaarx/db", "@bazaarx/types", "@bazaarx/utils", "@bazaarx/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
