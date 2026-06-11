// Content-Security-Policy builder. Uses a per-request nonce + 'strict-dynamic'
// so framework scripts (and the Razorpay checkout script they inject at runtime)
// are trusted without an open 'unsafe-inline' script policy.

const isDev = process.env.NODE_ENV !== "production";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// Allow the project's Supabase host (XHR + realtime websocket) explicitly,
// plus the wildcard so signed-URL/storage subdomains resolve.
const SUPABASE_WS = SUPABASE_URL.replace(/^https/, "wss");

/** Build a CSP header value for one request. Newlines are collapsed to spaces. */
export function buildCsp(nonce: string): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'strict-dynamic' lets the nonce'd bundle load Razorpay's checkout.js; the
    // http:/https: fallbacks are for browsers without strict-dynamic support.
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      "https:",
      ...(isDev ? ["'unsafe-eval'", "http:"] : []),
    ],
    // Tailwind/Next inject inline <style>; nonce-ing those is impractical.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https://*.supabase.co", "https://placehold.co", "https://*.razorpay.com"],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      SUPABASE_URL,
      SUPABASE_WS,
      "https://api.razorpay.com",
      "https://lumberjack.razorpay.com",
      ...(isDev ? ["ws:", "http://localhost:*"] : []),
    ].filter(Boolean),
    "frame-src": ["https://api.razorpay.com", "https://checkout.razorpay.com"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": [],
  };

  return Object.entries(directives)
    .map(([key, vals]) => (vals.length ? `${key} ${vals.join(" ")}` : key))
    .join("; ");
}
