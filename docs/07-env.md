# 07 — Environment Variables

Copy to `.env` at the repo root (and `apps/web/.env.local` for Next.js). **All values below are placeholders.** Never commit real secrets — commit only `.env.example`.

`NEXT_PUBLIC_*` variables are exposed to the browser; everything else is server-only.

## .env.example

```bash
# ─────────────── App ───────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"        # base URL for links, reseller share URLs, OAuth redirect
NODE_ENV="development"

# ─────────────── Supabase ───────────────
# Project URL + keys — Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"   # client + server Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"           # public client (browser) auth
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"       # server-only: admin ops, storage signing (NEVER expose)

# ─────────────── Database (Prisma) ───────────────
# Supabase → Project Settings → Database → Connection string
DATABASE_URL="postgresql://postgres.YOUR_REF:PASSWORD@aws-region.pooler.supabase.com:6543/postgres?pgbouncer=true"  # pooled — used by app at runtime
DIRECT_URL="postgresql://postgres.YOUR_REF:PASSWORD@aws-region.pooler.supabase.com:5432/postgres"                   # direct — used by Prisma migrate

# ─────────────── Razorpay ───────────────
# Razorpay Dashboard → Settings → API Keys
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_YOUR_KEY_ID"   # client checkout init (public key id)
RAZORPAY_KEY_SECRET="YOUR_RAZORPAY_KEY_SECRET"       # server: create orders, refunds
RAZORPAY_WEBHOOK_SECRET="YOUR_RAZORPAY_WEBHOOK_SECRET"  # server: verify /api/payments/webhook signatures

# ─────────────── Email (Resend) ───────────────
RESEND_API_KEY="re_YOUR_RESEND_API_KEY"              # server: transactional email
RESEND_FROM_EMAIL="BazaarX <orders@bazaarx.app>"     # verified sender

# ─────────────── SMS / OTP (Twilio) ───────────────
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # server: SMS send
TWILIO_AUTH_TOKEN="YOUR_TWILIO_AUTH_TOKEN"              # server
TWILIO_PHONE_NUMBER="+1XXXXXXXXXX"                      # sender number / messaging service

# ─────────────── Mobile (Phase 5, Expo) ───────────────
EXPO_PUBLIC_API_URL="http://localhost:3000"          # mobile → web API base
EXPO_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

## Where each group is used

| Group | Used by |
|-------|---------|
| `NEXT_PUBLIC_APP_URL` | OAuth redirects, reseller share links, email link building |
| Supabase URL + anon | browser & server Supabase clients (`lib/supabase`), auth, Realtime |
| Service role key | server-only: admin operations, signed Storage upload URLs (`/api/upload/sign`) |
| `DATABASE_URL` / `DIRECT_URL` | Prisma — pooled for runtime, direct for `migrate`/`db push` |
| Razorpay keys | `/api/payments/*` — create order, verify webhook, refund |
| Resend | order/payout/OTP transactional email |
| Twilio | OTP + SMS order notifications |
| `EXPO_PUBLIC_*` | mobile app (Phase 5) |

## Notes

- **Two database URLs** are required: Prisma uses `DIRECT_URL` for migrations (bypasses the pooler) and `DATABASE_URL` (pgbouncer) at runtime — both already declared in `schema.prisma`'s `datasource`.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, and `TWILIO_AUTH_TOKEN` server-only — they must never appear in a `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` variable.
- In Vercel, set these under Project → Settings → Environment Variables; for Expo, use EAS secrets.
