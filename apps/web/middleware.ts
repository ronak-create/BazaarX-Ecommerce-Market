import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { buildCsp } from "@/lib/csp";
import { rateLimit } from "@/lib/rate-limit";

// Route prefixes that require an authenticated session.
const PROTECTED_PREFIXES = ["/seller", "/admin", "/reseller", "/account", "/checkout", "/orders"];

/** Best-effort client IP from proxy headers, falling back to a constant. */
function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit mutating API traffic by IP. Auth endpoints get a tighter cap.
  if (pathname.startsWith("/api/") && request.method !== "GET" && request.method !== "HEAD") {
    const ip = clientIp(request);
    const isAuth = pathname.startsWith("/api/auth");
    const { ok, limit, remaining, retryAfter } = isAuth
      ? rateLimit(`auth:${ip}`, 10, 60_000)
      : rateLimit(`api:${ip}`, 60, 60_000);
    if (!ok) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests, slow down." } },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "RateLimit-Limit": String(limit),
            "RateLimit-Remaining": String(remaining),
          },
        },
      );
    }
  }

  // Per-request CSP nonce, forwarded to the app so Next can nonce its scripts.
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const { response, user } = await updateSession(request, requestHeaders);

  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Fine-grained role checks (SELLER must be APPROVED, ADMIN role, etc.) are
  // enforced in each route group's server layout via lib/auth guards.
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets and image optimisation.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
