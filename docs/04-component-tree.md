# 04 — Component Tree

Web component structure for `apps/web`, organised by the four route-group layout shells. Mobile screens are listed as a Phase 5 appendix (names only).

## Shared primitives — `packages/ui` (shadcn/ui base)

```
ui/
├── Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch
├── Card, Badge, Avatar, Skeleton, Separator
├── Dialog, Sheet, Drawer, Popover, Tooltip, DropdownMenu
├── Tabs, Accordion, Pagination, Breadcrumb
├── Toast (sonner), Spinner
├── Table (sortable, paginated)
├── form/  → FormField, FormError, useZodForm wrapper
└── RatingStars, PriceTag, EmptyState
```

## Storefront shell — `(storefront)`

```
<StorefrontLayout>
├── <TopBar>  → logo, <SearchBar/> (autocomplete), <CategoryNav/>,
│              <CartButton/>, <WishlistButton/>, <NotificationBell/>, <UserMenu/>
├── <Footer>
└── pages
    ├── Home                 → <HeroCarousel/> (banners), <CategoryGrid/>,
    │                          <ProductCarousel title="Trending"/>, <ProductCarousel title="Featured"/>
    ├── Search / Category    → <FilterSidebar/> (category, price, rating, brand, COD),
    │                          <SortDropdown/>, <ProductGrid/> → <ProductCard/>, <Pagination/>
    ├── ProductDetail        → <ImageGallery/>, <VariantSelector/>, <PriceBlock/>,
    │                          <AddToCartBar/>, <SellerCard/>, <ReviewsSection/> → <ReviewCard/>,
    │                          <ReviewForm/>, <RelatedProducts/>
    ├── Cart                 → <CartItemRow/> (per seller group), <OrderSummary/>, <CouponInput/>
    ├── Checkout             → <AddressSelector/> + <AddressForm/>, <PaymentMethodPicker/>,
    │                          <OrderReview/>, <RazorpayButton/>
    ├── OrderTracking        → <OrderHeader/>, <TrackingTimeline/> (Realtime), <OrderItems/>,
    │                          <CancelButton/>, <ReturnButton/>, <RaiseDisputeButton/>
    ├── Wishlist             → <ProductGrid/>
    └── Account              → <ProfileForm/>, <AddressBook/>, <OrderHistory/>, <SettingsPanel/>
```

## Seller shell — `(seller)/seller`

```
<SellerLayout>  (sidebar nav + topbar, guarded: role=SELLER & status=APPROVED)
├── Onboarding        → <KycForm/> (business, GSTIN/PAN, bank), <DocumentUpload/>, <StatusBanner/>
├── Dashboard         → <StatCards/> (revenue, orders, rating), <RevenueChart/>, <TopProductsTable/>
├── Products
│   ├── List          → <ProductTable/> (status filter), <BulkUploadDialog/> (CSV)
│   └── Editor        → <ProductForm/>, <VariantEditor/>, <ImageUploader/> (≤8), <CategoryPicker/>
├── Orders
│   ├── List          → <OrderTable/> (status filter)
│   └── Detail        → <OrderItems/>, <ConfirmButton/>, <ShipForm/> (tracking+carrier), <StatusActions/>
├── Inventory         → <LowStockTable/>
├── Reviews           → <ReviewList/> (received)
└── Earnings          → <EarningsSummary/>, <PayoutHistoryTable/>
```

## Admin shell — `(admin)/admin`

```
<AdminLayout>  (sidebar nav, guarded: role=ADMIN)
├── Analytics         → <KpiCards/> (GMV, DAU), <RevenueChart/>, <TopSellers/>, <TopProducts/>
├── Users             → <UserTable/> (role/search filter), <SuspendDialog/>, <BanDialog/>
├── KYC               → <KycQueue/>, <KycReviewPanel/> (docs viewer), <Approve/RejectActions/>
├── Products          → <ModerationTable/>, <FlagRemoveActions/>
├── Disputes          → <DisputeQueue/>, <DisputePanel/> (both sides, evidence), <ResolveActions/>
├── Commissions       → <CategoryFeeTable/> (editable % per category)
├── Banners           → <BannerList/>, <BannerForm/> (image, position, priority)
└── Payouts           → <PayoutQueue/>, <ProcessPayoutDialog/>
```

## Reseller shell — `(reseller)/reseller`

```
<ResellerLayout>
├── Dashboard         → <EarningsCards/> (total, pending), <SharedProductsTable/>, <ConversionStats/>
├── Links             → <LinkTable/> (clicks, conversions), <CreateLinkDialog/> (product + margin)
└── Earnings          → <CommissionTable/> (PENDING/PAID), <PayoutHistory/>
```

## Cross-cutting

- **Data fetching:** each page uses React Query hooks in `apps/web/src/hooks/` (e.g. `useProducts`, `useCart`, `useOrder`). Mutations invalidate the relevant query keys.
- **Client state:** Zustand stores in `apps/web/src/stores/` for cart drawer open-state, active filters, and checkout draft.
- **Guards:** layout shells call `lib/auth.ts` role guards server-side; `middleware.ts` blocks unauthorised route-group access before render.

---

## Appendix — Mobile screens (Expo, Phase 5)

Names only; designed when Phase 5 begins.

**Buyer app:**
`Splash → Onboarding → Auth (OTP/Google) → Home → Search → ProductDetail → Cart → Checkout → OrderTracking → Profile → Notifications → Wishlist`

**Seller app:**
`Auth → SellerOnboarding → SellerHome → AddProduct → MyProducts → Orders → Earnings`

Mobile reuses `packages/types` and `packages/utils` but builds its own React Native component library (not `packages/ui`, which is web-only). Push notifications via Expo Notifications.
