# 03 — API Routes

All endpoints are Next.js API route handlers under `apps/web/src/app/api/`. REST, JSON. Auth via Supabase session cookie; the role column shows the minimum role required.

**Conventions**
- List endpoints accept `?page=`, `?limit=` (default 20, max 100) and return `{ data: T[], page, limit, total }`.
- Money is returned as a string (Decimal) in INR.
- Errors: `{ error: { code, message } }` with appropriate HTTP status.
- `Auth` column: `public` = no login; `buyer` = any logged-in user; `seller`/`admin`/`reseller` = that role; `owner` = resource owner.

---

## Auth profile sync

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/auth/sync` | buyer | `{}` (reads Supabase JWT) | `User` — upserts Supabase user into Prisma, returns profile |
| GET | `/api/auth/me` | buyer | — | `User` with role + profile flags |

> OTP, Google OAuth, and session issuance are handled by Supabase Auth on the client; `/api/auth/*` only mirrors the user into Postgres and exposes the merged profile.

---

## Products `/api/products`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | `/api/products` | public | — | `{ data: ProductCard[], page, limit, total }` |
| GET | `/api/products/:slug` | public | — | `ProductDetail` (variants, images, seller, reviews summary) |
| POST | `/api/products` | seller | `CreateProductInput` | `Product` |
| PATCH | `/api/products/:id` | seller(owner) | `Partial<CreateProductInput>` | `Product` |
| DELETE | `/api/products/:id` | seller(owner) | — | `{ ok: true }` (soft delete) |
| POST | `/api/products/bulk` | seller | `{ csvUrl }` | `{ created, failed, errors[] }` (CSV upload) |
| GET | `/api/products/search` | public | — | `{ data: ProductCard[], ... }` (pg_trgm fuzzy) |
| GET | `/api/products/autocomplete` | public | — | `{ suggestions: string[] }` (debounced) |

**Query params** (GET `/api/products` and `/search`): `q`, `categoryId`, `minPrice`, `maxPrice`, `minRating`, `brand`, `pincode`, `codAvailable`, `sort` (`relevance|price_asc|price_desc|newest|rating`).

```ts
CreateProductInput {
  categoryId: string; name: string; description: string;
  basePrice: string; discountedPrice?: string; brand?: string; tags?: string[];
  status?: "DRAFT" | "ACTIVE" | "PAUSED";
  variants: { label: string; attributes: Record<string,string>; price: string; stock: number; sku: string }[];
  images: { url: string; altText?: string; position: number; isPrimary: boolean }[];
}
```

---

## Categories `/api/categories`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | `/api/categories` | public | — | `CategoryTree[]` (nested, up to 3 levels) |
| GET | `/api/categories/:slug` | public | — | `Category` + breadcrumb + children |
| POST | `/api/categories` | admin | `{ name, parentId?, imageUrl? }` | `Category` |
| PATCH | `/api/categories/:id` | admin | `{ name?, imageUrl? }` | `Category` |
| DELETE | `/api/categories/:id` | admin | — | `{ ok: true }` |

---

## Cart `/api/cart`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | `/api/cart` | buyer | — | `Cart` with items, grouped by seller, totals |
| POST | `/api/cart/items` | buyer | `{ productId, variantId, quantity }` | `Cart` |
| PATCH | `/api/cart/items/:id` | buyer(owner) | `{ quantity }` | `Cart` |
| DELETE | `/api/cart/items/:id` | buyer(owner) | — | `Cart` |
| DELETE | `/api/cart` | buyer | — | `{ ok: true }` (clear) |

---

## Wishlist `/api/wishlist`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | `/api/wishlist` | buyer | — | `{ data: ProductCard[], ... }` |
| POST | `/api/wishlist` | buyer | `{ productId }` | `{ ok: true }` |
| DELETE | `/api/wishlist/:productId` | buyer(owner) | — | `{ ok: true }` |

---

## Orders `/api/orders`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/orders` | buyer | `CreateOrderInput` | `{ orders: Order[], payment?: RazorpayOrder }` |
| GET | `/api/orders` | buyer | — | `{ data: OrderSummary[], ... }` (own orders) |
| GET | `/api/orders/:id` | buyer(owner) | — | `OrderDetail` (items, tracking, payment) |
| POST | `/api/orders/:id/cancel` | buyer(owner) | `{ reason? }` | `Order` (only if status < SHIPPED) |
| POST | `/api/orders/:id/return` | buyer(owner) | `{ reason, evidence?[] }` | `Order` (within 7 days of DELIVERED) |

```ts
CreateOrderInput {
  addressId: string;
  paymentMethod: "RAZORPAY" | "COD";
  couponCode?: string;
  resellerSlug?: string;           // attribution if bought via reseller link
  // items pulled from the buyer's cart server-side; checkout splits per seller
}
```

> Checkout **splits the cart into one Order per seller**, computes `platformFee`/`sellerAmount` per order, and (for RAZORPAY) returns a Razorpay order to open the client checkout. See [docs/05-flows.md](05-flows.md).

---

## Payments `/api/payments`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/payments/create` | buyer | `{ orderIds: string[] }` | `{ razorpayOrderId, amount, currency, key }` |
| POST | `/api/payments/verify` | buyer | `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }` | `{ ok: true }` (client-side confirm) |
| POST | `/api/payments/webhook` | public (signed) | Razorpay event | `200 OK` — **source of truth**; verifies signature, marks `PAID` |
| POST | `/api/payments/refund` | admin | `{ orderId, amount?, reason }` | `{ refundId, status }` |

> The webhook is authoritative for marking payments `PAID`; `/verify` only gives the client immediate feedback. Signature verification uses `RAZORPAY_WEBHOOK_SECRET`.

---

## Reviews `/api/reviews`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | `/api/reviews?productId=` | public | — | `{ data: Review[], ... }` |
| POST | `/api/reviews` | buyer | `{ productId, orderId, rating, title?, body?, images?[] }` | `Review` (must own a DELIVERED order for the product) |
| PATCH | `/api/reviews/:id` | buyer(owner) | `{ rating?, title?, body? }` | `Review` |
| DELETE | `/api/reviews/:id` | buyer(owner) | — | `{ ok: true }` |
| POST | `/api/reviews/:id/helpful` | buyer | — | `{ helpfulCount }` |

> Creating/updating a review recomputes `Product.avgRating` and `totalReviews`.

---

## Seller `/api/seller/*`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/seller/register` | buyer | `{ businessName, gstin?, panNumber?, bankAccount?, ifsc?, documents[] }` | `SellerProfile` (status PENDING) |
| GET | `/api/seller/dashboard` | seller | — | `{ revenue, orderCount, topProducts, avgRating }` |
| GET | `/api/seller/products` | seller | — | `{ data: Product[], ... }` (own, incl. drafts) |
| GET | `/api/seller/orders` | seller | — | `{ data: OrderSummary[], ... }` (filter `?status=`) |
| POST | `/api/seller/orders/:id/confirm` | seller(owner) | — | `Order` → CONFIRMED |
| POST | `/api/seller/orders/:id/ship` | seller(owner) | `{ trackingNumber, carrier }` | `Order` → SHIPPED |
| POST | `/api/seller/orders/:id/status` | seller(owner) | `{ status, message? }` | `Order` (OUT_FOR_DELIVERY / DELIVERED) |
| GET | `/api/seller/earnings` | seller | — | `{ available, pending, payouts: Payout[] }` |
| GET | `/api/seller/inventory/alerts` | seller | — | `{ lowStock: ProductVariant[] }` |

---

## Admin `/api/admin/*`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | `/api/admin/users` | admin | — | `{ data: User[], ... }` (filter `?role=`, `?q=`) |
| POST | `/api/admin/users/:id/suspend` | admin | `{ reason }` | `User` |
| POST | `/api/admin/users/:id/ban` | admin | `{ reason }` | `User` (soft delete) |
| GET | `/api/admin/kyc` | admin | — | `{ data: SellerProfile[], ... }` (PENDING) |
| POST | `/api/admin/kyc/:id/approve` | admin | — | `SellerProfile` → APPROVED |
| POST | `/api/admin/kyc/:id/reject` | admin | `{ rejectionReason }` | `SellerProfile` → REJECTED |
| POST | `/api/admin/products/:id/moderate` | admin | `{ action: "FLAG"|"REMOVE", note? }` | `Product` |
| GET | `/api/admin/disputes` | admin | — | `{ data: Dispute[], ... }` |
| POST | `/api/admin/disputes/:id/resolve` | admin | `{ resolution: "REFUND"|"REJECT", adminNote, amount? }` | `Dispute` |
| GET | `/api/admin/commissions` | admin | — | `{ data: CategoryFee[] }` (platform fee % per category) |
| PUT | `/api/admin/commissions` | admin | `{ categoryId, feePercent }` | `CategoryFee` |
| GET | `/api/admin/banners` | admin | — | `{ data: Banner[] }` |
| POST | `/api/admin/banners` | admin | `{ imageUrl, linkUrl?, position, priority }` | `Banner` |
| PATCH | `/api/admin/banners/:id` | admin | `Partial<Banner>` | `Banner` |
| DELETE | `/api/admin/banners/:id` | admin | — | `{ ok: true }` |
| GET | `/api/admin/analytics` | admin | — | `{ gmv, dau, topSellers[], topProducts[], revenueSeries[] }` |
| GET | `/api/admin/payouts` | admin | — | `{ data: Payout[], ... }` |
| POST | `/api/admin/payouts/:id/process` | admin | `{ utr? }` | `Payout` → PROCESSING/COMPLETED |

---

## Reseller `/api/reseller/*`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/reseller/register` | buyer | `{}` | `ResellerProfile` (instant, no approval) |
| GET | `/api/reseller/dashboard` | reseller | — | `{ totalEarnings, pendingEarnings, sharedProducts, conversions }` |
| GET | `/api/reseller/links` | reseller | — | `{ data: ResellerLink[], ... }` |
| POST | `/api/reseller/links` | reseller | `{ productId, margin }` | `ResellerLink` (generates slug) |
| DELETE | `/api/reseller/links/:id` | reseller(owner) | — | `{ ok: true }` |
| POST | `/api/reseller/links/:slug/click` | public | — | `{ ok: true }` (increments clicks) |
| GET | `/api/reseller/earnings` | reseller | — | `{ available, pending, commissions: Commission[] }` |

---

## Notifications `/api/notifications`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | `/api/notifications` | buyer | — | `{ data: Notification[], unread: number, ... }` |
| POST | `/api/notifications/:id/read` | buyer(owner) | — | `{ ok: true }` |
| POST | `/api/notifications/read-all` | buyer | — | `{ ok: true }` |

> The bell subscribes to Supabase Realtime on the `Notification` table for the current user; this REST surface backfills history and marks read.

---

## Upload `/api/upload`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/upload/sign` | buyer | `{ bucket: "products"|"kyc"|"reviews", contentType, fileName }` | `{ signedUrl, path }` |

> Returns a Supabase Storage signed upload URL; the client PUTs the file directly, then sends back the returned `path` when creating the product/review/KYC record.

---

## Feature → endpoint coverage

| Spec feature | Primary endpoints |
|--------------|-------------------|
| Auth & onboarding | `/auth/*`, `/seller/register`, `/reseller/register` |
| Product management | `/products*`, `/upload/sign` |
| Buyer experience | `/products`, `/categories`, `/cart*`, `/wishlist*`, `/orders` |
| Payments | `/payments/*` |
| Order management | `/orders*`, `/seller/orders/*` |
| Reseller | `/reseller/*` |
| Seller dashboard | `/seller/*` |
| Admin dashboard | `/admin/*` |
| Search & discovery | `/products/search`, `/products/autocomplete` |
| Notifications | `/notifications*` + Realtime |
