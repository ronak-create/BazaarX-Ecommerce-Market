# 05 — Flows

Text-based diagrams and logic specs for auth, order lifecycle, payments, and reseller commission.

---

## 1. Auth & onboarding

```
                         ┌─────────────────────────────┐
                         │  Client (web / mobile)      │
                         └──────────────┬──────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            ▼                           ▼                           ▼
   Email/Phone OTP               Google OAuth                 (existing session)
   (Supabase Auth)              (Supabase Auth)
            │                           │
            └───────────┬───────────────┘
                        ▼
              Supabase issues JWT + session cookie
                        │
                        ▼
          POST /api/auth/sync  ── upsert into Prisma User
          (match by supabase user id → email/phone)
                        │
            ┌───────────┴────────────┐
            ▼                        ▼
     role = BUYER             user picks "Sell on BazaarX"
     (quick: done)                   │
                                     ▼
                        POST /api/seller/register
                        (businessName, GSTIN, PAN, bank, KYC docs)
                                     │
                                     ▼
                        SellerProfile.status = PENDING
```

**Seller KYC state machine**

```
        register
   ─────────────────▶  PENDING
                          │
        admin review      │
      ┌───────────────────┼────────────────────┐
      ▼                   ▼                     ▼
  APPROVED            REJECTED              (admin later)
  (can list)      (rejectionReason set,     SUSPENDED
                   may resubmit)            (listings hidden)
```

- Buyers need only a verified email/phone. Sellers must clear KYC before `status=APPROVED`; until then seller routes show a `<StatusBanner/>` and product creation is blocked.
- Reseller onboarding is instant (`POST /api/reseller/register`, no approval).
- `middleware.ts` refreshes the Supabase session and enforces role on `/seller`, `/admin`, `/reseller`.

---

## 2. Order lifecycle state machine

```
                 buyer checkout (per-seller order created)
                              │
                              ▼
                           PLACED ───────────────┐ buyer cancel
                              │ seller confirm    │ (allowed < SHIPPED)
                              ▼                   ▼
                         CONFIRMED ──────────▶ CANCELLED ──▶ refund (if PAID)
                              │ seller ship        ▲
                              │ (tracking#)        │ buyer cancel
                              ▼                    │
                          SHIPPED ─────────────────┘
                              │ seller update
                              ▼
                      OUT_FOR_DELIVERY
                              │ seller / courier
                              ▼
                          DELIVERED
                              │ buyer return request (≤ 7 days)
                              ▼
                      RETURN_REQUESTED
                              │ seller/admin approve + pickup
                              ▼
                          RETURNED ──▶ refund
```

**Transition rules**

| From | To | Triggered by | Guard |
|------|----|--------------|-------|
| PLACED | CONFIRMED | seller | — |
| PLACED / CONFIRMED | SHIPPED | seller | tracking number + carrier required |
| SHIPPED | OUT_FOR_DELIVERY | seller | — |
| OUT_FOR_DELIVERY | DELIVERED | seller / courier | — |
| PLACED / CONFIRMED | CANCELLED | buyer | status must be `< SHIPPED` |
| DELIVERED | RETURN_REQUESTED | buyer | within 7 days of DELIVERED |
| RETURN_REQUESTED | RETURNED | seller / admin | — |

**Side effects on every transition**
1. Insert an `OrderTracking` row (status, message, optional tracking#/carrier).
2. Broadcast via Supabase Realtime → buyer's `<TrackingTimeline/>` updates live.
3. Create a `Notification` row + send email (Resend) and/or SMS (Twilio); mobile gets an Expo push.
4. On CANCELLED/RETURNED with a paid order → trigger refund (see §3).
5. On DELIVERED → start the 7-day return clock and the reseller commission maturation clock (see §4).

---

## 3. Payment flows

### Razorpay (online)

```
buyer places order (RAZORPAY)
        │
        ▼
POST /api/orders  ──▶ creates Order(s) status=PLACED, Payment status=PENDING
        │                 computes platformFee & sellerAmount per order
        ▼
POST /api/payments/create  ──▶ Razorpay order (sum of orderIds), returns {razorpayOrderId, amount, key}
        │
        ▼
client opens Razorpay Checkout ──▶ user pays (UPI/card/netbanking/wallet)
        │
   ┌────┴─────────────────────────────┐
   ▼                                   ▼
POST /api/payments/verify        Razorpay ──▶ POST /api/payments/webhook   ★ source of truth
(client-side optimistic confirm)        verify signature (RAZORPAY_WEBHOOK_SECRET)
   │                                   │
   ▼                                   ▼
show "payment received"          Payment.status = PAID, paidAt set,
                                  Order(s) ready for seller confirm,
                                  notifications fired
```

- **Signature verification** uses `RAZORPAY_WEBHOOK_SECRET`; unverified webhooks are rejected with `400`.
- The **webhook is authoritative** — `/verify` only updates the UI; the DB flips to `PAID` on the webhook so a closed browser never loses a payment.

### COD (cash on delivery)

```
buyer places order (COD)
        │
        ▼
POST /api/orders ──▶ Order status=PLACED, Payment method=COD status=PENDING
        │
        ▼
seller fulfils → ... → DELIVERED
        │
        ▼
Payment.status = PAID, paidAt = delivery time (cash collected)
```

### Refunds

```
trigger: order CANCELLED (was PAID)  OR  RETURNED  OR  admin dispute resolution = REFUND
        │
        ▼
POST /api/payments/refund  ──▶ Razorpay refund API (for RAZORPAY)  /  manual note (for COD)
        │
        ▼
Payment.status = REFUNDED ; buyer notified ; any reseller Commission for that order voided
```

### Commission split (computed at order creation)

```
order.totalAmount        = Σ orderItems.totalPrice  (− coupon discount)
order.platformFee        = totalAmount × categoryFeePercent      (admin-set per category)
order.sellerAmount       = totalAmount − platformFee − resellerMargin(if any)
```

Seller payouts (`Payout`) aggregate `sellerAmount` of DELIVERED orders past the return window, paid weekly via Razorpay Route or manual bank transfer.

---

## 4. Reseller commission calculation

```
reseller creates link:  POST /api/reseller/links { productId, margin }
        │  generates unique slug
        ▼
shares  https://bazaarx.app/p/{slug}
        │
buyer clicks ──▶ POST /api/reseller/links/:slug/click  (clicks++)
        │  buyer sees displayPrice = product price + margin
        ▼
buyer checks out with resellerSlug attached
        │
        ▼
POST /api/orders:
   • buyer pays  basePrice + margin
   • Order.sellerAmount excludes the margin (seller still gets their normal cut)
   • Commission row created: amount = margin, status = PENDING
   • ResellerLink.conversions++ ; ResellerProfile.pendingEarnings += margin
        │
        ▼
order reaches DELIVERED  + 7-day return window passes (no return)
        │
        ▼
Commission.status = PAID
ResellerProfile: pendingEarnings −= margin ; totalEarnings += margin
        │
        ▼
reseller payout (Razorpay / bank transfer)
```

**Worked example**

| Item | Value |
|------|-------|
| Product base price | ₹500.00 |
| Reseller margin | ₹80.00 |
| Buyer pays | **₹580.00** |
| Category platform fee | 10% of ₹500 = ₹50.00 |
| Seller receives (`sellerAmount`) | ₹500 − ₹50 = **₹450.00** |
| Platform keeps (`platformFee`) | **₹50.00** |
| Reseller earns (`Commission.amount`) | **₹80.00** (PENDING → PAID after return window) |

Margin is added on top of the product price, so the seller's economics are unchanged and the platform fee is computed on the base price, not the marked-up price. If the order is cancelled or returned, the `Commission` is voided and `pendingEarnings` is reversed.
