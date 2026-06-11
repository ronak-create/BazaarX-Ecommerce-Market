# 06 — Build Roadmap

Six phases, ~14 weeks. Each phase lists concrete tasks and an exit criterion that must hold before moving on.

---

## Phase 1 — Foundation (Week 1–2)

**Goal:** a runnable monorepo with schema, auth, and CI.

- [ ] Initialise Turborepo + pnpm workspaces (`apps/web`, `packages/db|types|utils|ui|config`)
- [ ] Create Supabase project; capture URL + keys into `.env` (see [docs/07-env.md](07-env.md))
- [ ] Author `packages/db/prisma/schema.prisma` from [docs/02](02-database-schema.md); run first migration
- [ ] Wire Supabase Auth: email/phone OTP + Google OAuth; browser + server clients in `lib/supabase`
- [ ] `middleware.ts` session refresh + role-based route guards
- [ ] `POST /api/auth/sync` + `GET /api/auth/me` (Prisma user mirror)
- [ ] `packages/types` (API DTOs) + `packages/utils` (currency, date, zod validators, slug)
- [ ] `packages/config` shared ESLint / Tailwind / tsconfig presets
- [ ] CI/CD: lint + typecheck + build on PR; Vercel preview deploys; seed script

**Exit:** a user can sign up via OTP/Google, a `User` row is created, and protected routes redirect by role. `pnpm build` and `pnpm lint` pass in CI.

---

## Phase 2 — Seller Onboarding + Products (Week 3–4)

**Goal:** approved sellers can list real products.

- [ ] Seller registration + KYC form with document upload (`/api/upload/sign` → Supabase Storage)
- [ ] Admin KYC queue: approve / reject with reason (`/api/admin/kyc/*`)
- [ ] Category management (admin CRUD, 3-level tree)
- [ ] Product CRUD with up to 8 images and variants (`/api/products`, `/api/seller/products`)
- [ ] Bulk CSV product upload
- [ ] Low-stock alert computation

**Exit:** a seller goes PENDING → APPROVED, creates a product with variants and images, and it appears in `status=ACTIVE`.

---

## Phase 3 — Buyer Experience (Week 5–6)

**Goal:** browse to checkout (without payment capture yet).

- [ ] Homepage: banners, category grid, trending/featured carousels
- [ ] Listing + filters (category, price, rating, brand, COD) + sort
- [ ] Search & autocomplete via `pg_trgm` / full-text (`/api/products/search`)
- [ ] Product detail: gallery, variant selector, reviews summary, seller card
- [ ] DB-backed cart (`/api/cart`) and wishlist (`/api/wishlist`)
- [ ] Address book + checkout UI (address, payment method, coupon, summary)

**Exit:** a buyer searches, filters, adds multi-seller items to cart, and reaches a checkout summary that correctly splits per seller and applies a coupon.

---

## Phase 4 — Payments + Orders (Week 7–8)

**Goal:** money moves; orders progress with live tracking.

- [ ] Razorpay create-order + client checkout (`/api/payments/create`)
- [ ] Webhook with signature verification → mark `PAID` (`/api/payments/webhook`)
- [ ] COD path
- [ ] Order creation splitting cart per seller; commission split computed
- [ ] Full order lifecycle transitions + guards (seller confirm/ship/status; buyer cancel/return)
- [ ] Supabase Realtime order tracking timeline
- [ ] Email (Resend) + SMS (Twilio) on each transition
- [ ] Refund flow; seller payout aggregation

**Exit:** a buyer pays via Razorpay (confirmed by webhook), the seller ships with tracking, the buyer sees live status updates, and a cancellation issues a refund.

---

## Phase 5 — Reseller + Reviews + Mobile (Week 9–11)

**Goal:** reseller economics, reviews, and the Expo app.

- [ ] Reseller registration, link generation, click/conversion tracking
- [ ] Commission creation on attributed orders; PENDING → PAID after return window
- [ ] Buyer reviews + ratings; `avgRating`/`totalReviews` recompute
- [ ] Scaffold `apps/mobile` (Expo + TS) into Turborepo
- [ ] Mobile buyer flow (Home → Search → Detail → Cart → Checkout → Tracking) + seller flow
- [ ] Expo push notifications; mobile Razorpay checkout

**Exit:** a reseller link drives an attributed purchase that creates a maturing commission, a delivered buyer leaves a review, and the mobile app completes a checkout end-to-end.

---

## Phase 6 — Admin + Polish + Launch (Week 12–14)

**Goal:** operable platform, production-ready.

- [ ] Admin analytics (GMV, DAU, top sellers/products, revenue chart)
- [ ] Dispute resolution (view both sides, refund or reject)
- [ ] Coupons + banner/promotion management
- [ ] Performance: query indexes review, image CDN, caching, bundle size
- [ ] Security audit: RLS/role checks, webhook verification, rate limits, input validation
- [ ] Production deploy: Vercel (web), Expo EAS (mobile), Supabase prod

**Exit:** an admin resolves a dispute and views accurate analytics; security checklist passes; production URLs are live.
