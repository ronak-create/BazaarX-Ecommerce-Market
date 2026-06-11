# Running BazaarX locally

Commands to set up, run, and **see the app work** end to end. Run everything from the repo root (`C:\Ecom template`).

> Already done on this machine: dependencies installed, `.env` filled in, database schema pushed, seed + storage buckets created. If you just want to run it, jump to **[2. Start the app](#2-start-the-app)**.

---

## 1. One-time setup (only if starting fresh)

```bash
pnpm install                 # install all workspaces
cp .env.example .env         # then fill in real values (Supabase, Razorpay, etc.)

pnpm db:generate             # generate the Prisma client
pnpm db:push                 # create all tables in the database
pnpm db:setup-storage        # create the products / kyc / reviews storage buckets
pnpm db:seed                 # seed an admin row, 4 categories, and a home banner
```

---

## 2. Start the app

```bash
pnpm dev
```

Open **http://localhost:3000**. Quick health check: **http://localhost:3000/api/health** should return `{"status":"ok","db":true}`.

Other useful scripts:

```bash
pnpm build         # production build of everything
pnpm typecheck     # type-check all packages
pnpm lint          # lint all packages
pnpm db:studio     # open Prisma Studio to browse/edit the database
```

---

## 3. See it work — full walkthrough

This takes you through every major feature. **Email login works out of the box**; phone and Google need a Supabase dashboard toggle (see Troubleshooting).

### a. Sign in
1. Click **Sign in** (top right) → enter your email → **Send magic link**.
2. Open the email and click the link. You land back on the site signed in.
   - The first sign-in creates your user record automatically.

### b. Become an admin (to manage the platform)
Admins are made from the CLI. After signing in once:

```bash
pnpm db:make-admin your@email.com
```

Refresh the page — you'll see an **Admin** link in the header → opens the admin console (`/admin`).

### c. Set up the catalogue (as admin)
- **Admin → Categories**: the seed added 4 top-level categories; add a sub-category if you like.
- **Admin → Commissions**: optionally override the platform fee % for a category (default is 10%).
- **Admin → Coupons**: create a coupon, e.g. code `SAVE10`, 10% off.
- **Admin → Banners**: paste an image URL to add a homepage banner.

### d. Become a seller and list a product
1. Header → **Sell on BazaarX** → fill the KYC form (business name is enough to submit) → **Submit for review**.
2. Approve yourself: **Admin → Seller KYC** → **Approve** your application.
3. Refresh → **Seller** → **Products** → **New product**: add a name, description, category, price, at least one variant (label/SKU/price/stock), and an image → set status **Active** → **Create product**.
   - Or use **Bulk CSV** with `samples/products-sample.csv`.

### e. Shop (as a buyer)
- Your product now shows on the **homepage** ("New arrivals"), in **/search**, and under its **category**.
- Open the product → pick a variant → **Add to cart** (and try **♡ Save** for the wishlist).
- **Cart** → **Proceed to checkout** → add a delivery address → apply your coupon → choose **Cash on Delivery** → **Place order**.

### f. Track and fulfil the order
- Buyer view: header → **Orders** → open the order to see the **tracking timeline**; you can **Cancel** (before it ships).
- Seller view: **Seller → Orders** → open the order → **Confirm** → **Mark shipped** (tracking number + carrier) → **Out for delivery** → **Delivered**.
  - On delivery, a COD order's payment flips to paid. The buyer can then **Request return** (7-day window) or **Report a problem** (dispute).

### g. Reviews
- After an order is **Delivered**, open the product as that buyer → a **Write a review** form appears → submit. The product's star rating updates.

### h. Reseller (Meesho-style)
1. On any product, use **Share & earn** → **Become a reseller** → set a per-unit margin → **Create link**.
2. Copy the `/r/...` link, open it (ideally in a different browser/incognito as another buyer) → it redirects to the product with the margin applied.
3. Buy through that link → the reseller earns the margin as a **pending commission** (header → **Reseller** → dashboard/earnings).

### i. Admin oversight
- **Admin → Analytics**: GMV, orders, active buyers, top sellers/products, 14-day revenue chart.
- **Admin → Disputes**: resolve a buyer's dispute with a refund or rejection.
- **Admin → Users**: ban a user or suspend a seller.

---

## 4. Handy database scripts

```bash
pnpm db:make-admin <email>        # promote a signed-in account to ADMIN
pnpm db:mature-commissions        # move delivered+past-window reseller commissions to PAID (run on a schedule)
pnpm db:seed                      # re-run the idempotent seed
pnpm db:studio                    # visual DB browser
```

---

## 5. Troubleshooting

- **Magic-link email doesn't arrive**: Supabase's built-in email is rate-limited and may land in spam. For phone OTP or Google sign-in, enable those providers in **Supabase Dashboard → Authentication → Providers** (Phone needs your Twilio creds; Google needs an OAuth client + `http://localhost:3000/auth/callback` as a redirect URI).
- **Razorpay online payment**: COD works fully offline. The card/UPI flow opens Razorpay Checkout with your test key; the webhook that confirms payment needs a public URL (e.g. an ngrok tunnel to `/api/payments/webhook`) registered in the Razorpay dashboard. See `docs/08-deploy.md`.
- **Database connection errors**: locally we use the direct host (`db.<ref>.supabase.co`), which is IPv6-only — fine on this machine. For deploys, use the region pooler string (see `docs/08-deploy.md`).
- **Port 3000 in use**: stop the other process, or run `pnpm --filter @bazaarx/web dev -- -p 3001`.
- **Changed the Prisma schema**: re-run `pnpm db:push` (or `pnpm db:generate` if you only need the client regenerated).
