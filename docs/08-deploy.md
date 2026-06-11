# 08 — Deployment & Launch Hardening

How to take BazaarX (web) to production, plus the security posture and remaining checklist.

## Deploy the web app to Vercel

1. **Import the repo** into Vercel. Set the **root directory** to `apps/web` (or keep the monorepo root and let Turborepo build — set the build command to `pnpm build --filter @bazaarx/web` and install command to `pnpm install`).
2. **Environment variables** (Project → Settings → Environment Variables) — copy every key from `.env.example`. For database, **do not use the direct host in production**:
   - The direct host `db.<ref>.supabase.co:5432` is **IPv6-only** and works locally, but Vercel's serverless runtime is IPv4. Use the **region pooler** string from the Supabase dashboard → Connect → ORMs:
     - `DATABASE_URL` → transaction pooler: `postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true`
     - `DIRECT_URL` → session pooler: `...@aws-0-<region>.pooler.supabase.com:5432/postgres`
   - Prisma uses `DATABASE_URL` (pooled) at runtime and `DIRECT_URL` for migrations.
3. **Run migrations against prod** before first deploy: `DATABASE_URL/DIRECT_URL=<prod> pnpm db:push` (or `prisma migrate deploy` once you adopt migration files), then `pnpm db:setup-storage` and optionally `pnpm db:seed`.
4. **Supabase Auth → URL config**: add the production origin to allowed redirect URLs, and set `NEXT_PUBLIC_APP_URL` to the production URL.
5. **Razorpay webhook**: in the Razorpay dashboard, add `https://<prod>/api/payments/webhook` with the `RAZORPAY_WEBHOOK_SECRET`. Subscribe to `payment.captured` / `order.paid`.
6. **Providers**: enable Google and Phone (Twilio) in Supabase Auth if you want those login methods (email magic-link works out of the box).

## Scheduled jobs

- `pnpm db:mature-commissions` should run on a schedule (daily) to move delivered, past-return-window reseller commissions from PENDING → PAID. Use a Vercel Cron hitting a small protected route, a Supabase scheduled function, or any external scheduler.

## Security posture (implemented)

- **Auth**: Supabase JWT verified server-side via `getUser()`; role/ownership guards on every mutating route (`authorizeApi`, `authorizeApprovedSeller`, `authorizeReseller`, owner checks).
- **Banned users**: soft-deleted users resolve to "logged out" everywhere (`getCurrentUser` filters `deletedAt`), so a ban immediately revokes access.
- **Payments**: Razorpay order/webhook signatures verified with HMAC + timing-safe compare; the webhook is the source of truth.
- **Storage**: `kyc` bucket is private — admins view docs via short-lived signed URLs; product-image upload signing requires an approved seller.
- **Headers**: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS; `poweredByHeader` disabled.
- **Health**: `GET /api/health` checks DB connectivity for uptime monitors.

## Pre-launch checklist (still to do)

- [ ] Add a tested **Content-Security-Policy** (must allow Razorpay `checkout.razorpay.com` and Supabase origins).
- [ ] **Rate limiting** on abuse-prone endpoints (auth, coupon validation, reseller link clicks) — use Vercel/Upstash rate limiting (in-memory won't work on serverless).
- [ ] Consider **Supabase RLS** policies as defense-in-depth (the app already gates via API, but RLS protects against direct PostgREST access if exposed).
- [ ] Rotate any secrets that were shared during development.
- [ ] Set up error monitoring (e.g. Sentry) and structured logging.
- [ ] Load-test checkout and the order lifecycle.
