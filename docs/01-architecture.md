# 01 — Architecture

## Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Monorepo | **Turborepo** | Shared packages, cached/parallel builds |
| Web frontend | **Next.js 14** | App Router, TypeScript, Tailwind CSS |
| Mobile app | **Expo (React Native)** | TypeScript, EAS Build — *Phase 5* |
| Backend | **Next.js API Routes** | REST, colocated in `apps/web` |
| Database | **PostgreSQL** | Hosted on Supabase |
| ORM | **Prisma** | Schema in `packages/db` |
| Auth | **Supabase Auth** | Email/phone OTP, Google OAuth, JWT sessions |
| File storage | **Supabase Storage** | Product images, KYC documents |
| Payments | **Razorpay + COD** | UPI, cards, net banking, wallets, cash on delivery |
| Real-time | **Supabase Realtime** | Order status updates, in-app notifications |
| Search | **PostgreSQL FTS + `pg_trgm`** | Fuzzy matching, autocomplete |
| Email | **Resend** | Transactional email |
| SMS / OTP | **Twilio** | OTP and SMS notifications |
| State (client) | **Zustand** | UI/client state |
| State (server) | **TanStack Query (React Query)** | Server cache, mutations |
| UI primitives | **shadcn/ui** | Base for `packages/ui` |
| Deploy | **Vercel / Expo EAS / Supabase** | Web / mobile / DB+Storage |

## Monorepo structure

```
bazaarx/
├── apps/
│   ├── web/                          # Next.js 14 — buyer storefront + seller + admin + API
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (storefront)/      # buyer-facing route group
│   │   │   │   │   ├── page.tsx               # homepage
│   │   │   │   │   ├── search/page.tsx
│   │   │   │   │   ├── category/[slug]/page.tsx
│   │   │   │   │   ├── product/[slug]/page.tsx
│   │   │   │   │   ├── cart/page.tsx
│   │   │   │   │   ├── checkout/page.tsx
│   │   │   │   │   ├── orders/[id]/page.tsx
│   │   │   │   │   ├── wishlist/page.tsx
│   │   │   │   │   └── account/...
│   │   │   │   ├── (seller)/seller/   # seller dashboard route group
│   │   │   │   │   ├── page.tsx               # overview
│   │   │   │   │   ├── products/...
│   │   │   │   │   ├── orders/...
│   │   │   │   │   ├── earnings/page.tsx
│   │   │   │   │   └── onboarding/page.tsx
│   │   │   │   ├── (admin)/admin/     # admin dashboard route group
│   │   │   │   │   ├── page.tsx               # analytics
│   │   │   │   │   ├── users/...
│   │   │   │   │   ├── kyc/...
│   │   │   │   │   ├── disputes/...
│   │   │   │   │   ├── commissions/page.tsx
│   │   │   │   │   └── banners/page.tsx
│   │   │   │   ├── (reseller)/reseller/
│   │   │   │   │   ├── page.tsx               # earnings dashboard
│   │   │   │   │   └── links/...
│   │   │   │   ├── auth/              # login, otp, callback
│   │   │   │   └── api/               # REST API routes — see docs/03
│   │   │   │       ├── products/
│   │   │   │       ├── categories/
│   │   │   │       ├── cart/
│   │   │   │       ├── wishlist/
│   │   │   │       ├── orders/
│   │   │   │       ├── payments/
│   │   │   │       ├── reviews/
│   │   │   │       ├── seller/
│   │   │   │       ├── admin/
│   │   │   │       ├── reseller/
│   │   │   │       ├── notifications/
│   │   │   │       ├── upload/
│   │   │   │       └── auth/sync/
│   │   │   ├── lib/
│   │   │   │   ├── supabase/          # browser + server clients, middleware
│   │   │   │   ├── prisma.ts          # singleton Prisma client
│   │   │   │   ├── razorpay.ts        # SDK init + signature verify
│   │   │   │   ├── auth.ts            # session + role guards
│   │   │   │   └── api/               # route handler helpers (validation, pagination)
│   │   │   ├── stores/               # Zustand stores (cart UI, filters)
│   │   │   └── hooks/                # React Query hooks
│   │   ├── middleware.ts             # Supabase session refresh + route protection
│   │   ├── next.config.js
│   │   └── tailwind.config.ts
│   └── mobile/                       # Expo React Native — PLACEHOLDER (Phase 5)
│       └── (scaffolded later; buyer + seller apps — see docs/04)
├── packages/
│   ├── db/                           # Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # see docs/02
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── index.ts                   # exports PrismaClient + types
│   ├── types/                        # shared TS interfaces (API DTOs, enums mirror)
│   ├── utils/                        # currency, date, validation (zod), slug helpers
│   ├── ui/                           # shared web UI components (shadcn/ui base)
│   └── config/                       # eslint-config, tailwind-config, tsconfig presets
├── .env.example                      # see docs/07
├── turbo.json
├── package.json                      # workspaces + turbo scripts
└── pnpm-workspace.yaml
```

**Notes**
- Backend lives **inside `apps/web`** as Next.js API routes — no separate server app.
- Route groups (`(storefront)`, `(seller)`, `(admin)`, `(reseller)`) let each persona have its own layout shell while sharing one Next.js app and one auth session.
- `packages/db` is the single source of truth for the schema; both API routes and the seed script import the generated client from it.
- `packages/ui` is **web-only**; mobile builds its own React Native components in Phase 5.

## System diagram (text-based)

```
                          ┌──────────────────────────────────────────┐
                          │                CLIENTS                    │
                          │  Next.js web (browser)   Expo mobile (P5) │
                          └───────────────┬──────────────────────────┘
                                          │ HTTPS (REST + React Query)
                                          ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                  apps/web — Next.js 14                       │
        │                                                             │
        │   App Router pages ──▶ /api/* route handlers                │
        │                          │                                  │
        │                          ▼                                  │
        │                    lib/auth (role guard)                    │
        │                          │                                  │
        │                          ▼                                  │
        │                   Prisma Client (packages/db)               │
        └───────────┬─────────────────────────────────┬──────────────┘
                    │ SQL                              │ SDK calls
                    ▼                                  ▼
        ┌────────────────────┐        ┌──────────────────────────────────────┐
        │  Supabase Postgres │        │   Supabase side channels             │
        │  (pg_trgm, FTS)    │        │   • Auth   (OTP, Google OAuth, JWT)   │
        └────────────────────┘        │   • Storage(product imgs, KYC docs)   │
                                       │   • Realtime (order status, notifs)  │
                                       └──────────────────────────────────────┘

  Outbound:  Resend (email) · Twilio (SMS/OTP) · Razorpay (create order, payout)
  Inbound :  Razorpay webhook ──▶ /api/payments/webhook (verify signature ──▶ mark PAID)
```

- **Auth**: the client talks to Supabase Auth directly for OTP/OAuth; on first login an API route (`/api/auth/sync`) upserts the Supabase user into the Prisma `User` table.
- **Session protection**: `middleware.ts` refreshes the Supabase session cookie and gates `/seller`, `/admin`, `/reseller` routes by role.
- **Realtime**: clients subscribe to Supabase Realtime channels for order tracking and the notification bell; the API writes the rows that trigger those broadcasts.
- **Search**: handled inside Postgres (`pg_trgm` + full-text), queried through Prisma raw queries from `/api/products`.
