# BazaarX

A production-grade **multi-vendor e-commerce platform** (Amazon + Meesho model) for web and mobile. Sellers list and fulfil products, buyers shop and track orders, resellers earn margins by sharing products, and admins run the platform.

> **Status:** Design phase. This repository currently contains design documentation only — no application code has been scaffolded yet. These docs are written so Phase 1 scaffolding can execute directly from them.

## User roles

| Role | What they do |
|------|--------------|
| **Buyer** | Browse, cart, checkout, track orders, review, wishlist |
| **Seller** | Register a business (KYC), list products, manage orders, view earnings |
| **Reseller** | Share products via referral links and earn margin on sales (no approval needed) |
| **Admin** | User management, KYC approval, dispute resolution, commissions, analytics |

## Stack at a glance

- **Monorepo:** Turborepo
- **Web:** Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **Mobile:** Expo (React Native, TypeScript) — *deferred to Phase 5*
- **Backend:** Next.js API Routes (REST), inside the web app
- **Database:** PostgreSQL via Supabase, **Prisma** ORM
- **Auth:** Supabase Auth (email/phone OTP, Google OAuth)
- **Storage:** Supabase Storage (product images, KYC docs)
- **Payments:** Razorpay (UPI/cards/net banking) + COD
- **Real-time:** Supabase Realtime (order status, notifications)
- **Search:** PostgreSQL full-text + `pg_trgm`
- **Email/SMS:** Resend (email) + Twilio (SMS/OTP)
- **State:** Zustand + TanStack Query (React Query)
- **Deploy:** Vercel (web), Expo EAS (mobile), Supabase (DB + Storage)

## Documentation index

| Doc | Contents |
|-----|----------|
| [docs/01-architecture.md](docs/01-architecture.md) | Tech stack, monorepo folder structure, system diagram |
| [docs/02-database-schema.md](docs/02-database-schema.md) | Complete `schema.prisma` (24 models, enums, indexes) + design decisions |
| [docs/03-api-routes.md](docs/03-api-routes.md) | All REST endpoints with request/response shapes |
| [docs/04-component-tree.md](docs/04-component-tree.md) | Web component tree + mobile screen list |
| [docs/05-flows.md](docs/05-flows.md) | Auth, order lifecycle, payment, and reseller commission flows |
| [docs/06-roadmap.md](docs/06-roadmap.md) | 6-phase build roadmap with exit criteria |
| [docs/07-env.md](docs/07-env.md) | `.env.example` reference |

## Where to start building

Follow [docs/06-roadmap.md](docs/06-roadmap.md). Phase 1 (Foundation) scaffolds the Turborepo, applies the Prisma schema from [docs/02-database-schema.md](docs/02-database-schema.md), and wires Supabase auth.
