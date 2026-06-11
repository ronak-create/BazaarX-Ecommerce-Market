// Load the monorepo-root .env so there is a single source of truth for secrets.
// Runs before Next reads env, so server vars and NEXT_PUBLIC_* are populated.
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// Static security headers applied to every response. The Content-Security-Policy
// is set per-request in middleware.ts (it needs a fresh nonce each time).
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
  // Monorepo: trace files from the repo root so the Prisma query-engine binary
  // (in the hoisted pnpm store) is copied into the serverless bundle.
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
    outputFileTracingIncludes: {
      "/**": ["../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/**"],
    },
  },
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
