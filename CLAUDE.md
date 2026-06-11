# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**BazaarX** — a multi-vendor e-commerce platform (Amazon + Meesho model). Turborepo monorepo, web-first (Next.js 14), mobile (Expo) deferred to Phase 5. Currently at **Phase 1 (Foundation)**: monorepo, Prisma schema, Supabase auth wiring, and the web shell exist; feature work begins at Phase 2.

The full design lives in `docs/` (architecture, schema, API routes, flows, roadmap, env). Read `docs/06-roadmap.md` for what each phase delivers and `docs/02-database-schema.md` for the data model rationale.

## Commands

Run from the repo root (pnpm + Turborepo):

```bash
pnpm install            # install all workspaces
pnpm dev                # run web app in dev (turbo)
pnpm build              # build all packages + web (also runs db:generate)
pnpm typecheck          # tsc --noEmit across all packages
pnpm lint               # eslint across all packages

# Database (Prisma, in packages/db)
pnpm db:generate        # regenerate Prisma client (run after schema edits)
pnpm db:migrate         # prisma migrate dev (needs a reachable DATABASE_URL/DIRECT_URL)
pnpm db:push            # prisma db push
pnpm db:seed            # run prisma/seed.ts (admin user, categories, banner)
pnpm db:studio          # Prisma Studio
```

Single-package scripts: `pnpm --filter @bazaarx/web <script>` (e.g. `pnpm --filter @bazaarx/web dev`).

There is no test runner yet — verification is `pnpm build` + `pnpm typecheck`.

## Environment

Copy `.env.example` to `.env` at the repo root before building. All values are placeholders; `pnpm build`/`typecheck` work without a live database, but `db:migrate`/`db:seed`/runtime need real Supabase credentials. `turbo.json` lists every env var under `globalEnv` — add new vars there or Turborepo won't pass them through.

## Architecture

- **Backend lives inside `apps/web`** as Next.js API route handlers under `src/app/api/` — there is no separate server app. REST, role-guarded.
- **Route groups** in `apps/web/src/app/` give each persona its own layout shell on one shared auth session: `(storefront)` buyer, `(seller)/seller`, `(admin)/admin`, `(reseller)/reseller`.
- **`packages/db` is the single source of truth for the schema.** App code imports the Prisma singleton via `@/lib/prisma` (which re-exports `@bazaarx/db`). After editing `schema.prisma`, run `pnpm db:generate`.
- **Auth = Supabase, identity mirrored to Postgres.** The client authenticates with Supabase (OTP/Google); `POST /api/auth/sync` upserts that user into the Prisma `User` table keyed by the Supabase user id. `GET /api/auth/me` returns the merged profile. Server code reads the session via `getAuthUser()`/`getCurrentUser()` and guards routes with `requireUser()`/`requireRole()` in `src/lib/auth.ts`.
- **`middleware.ts`** refreshes the Supabase session cookie on every request and redirects unauthenticated hits to `/seller`, `/admin`, `/reseller`, `/account` to `/auth/login`. Fine-grained role/status checks happen in each route group's server layout, not the middleware.
- **Supabase clients are split by context:** `src/lib/supabase/client.ts` (browser), `server.ts` (Server Components / Route Handlers), `middleware.ts` (session refresh). Use the right one — they differ in how cookies are read/written.

## Workspace packages

- `@bazaarx/db` — Prisma schema, generated client singleton, seed.
- `@bazaarx/types` — shared API DTOs (`ApiError`, `Paginated<T>`, `AuthProfile`) and re-exported Prisma enums. Import enums from here in app code, not directly from `@prisma/client`.
- `@bazaarx/utils` — `currency` (INR formatting, `platformFee`), `date` (`RETURN_WINDOW_DAYS`, `isWithinReturnWindow`), `slug`, `validation` (zod schemas). Reuse these before writing new helpers.
- `@bazaarx/ui` — web-only shared components (shadcn/ui base); `cn()` class merger. Not for mobile.
- `@bazaarx/config` — shared `tsconfig` presets, eslint, tailwind preset. `apps/web/tailwind.config.ts` extends `@bazaarx/config/tailwind`.

## Conventions

- **Money** is `Decimal(10,2)` in Prisma (INR), passed as strings over the API. Use `@bazaarx/utils` `toMoney`/`platformFee` for math; never use floats for currency.
- **Soft delete**: `User`, `Product`, `Order` have `deletedAt`; reads must filter `deletedAt: null`.
- **One Order per seller** — checkout splits a multi-seller cart into separate orders. `OrderItem` never crosses sellers.
- New API routes follow the envelopes in `@bazaarx/types`: list endpoints return `Paginated<T>`, errors return `ApiError` with an HTTP status.
