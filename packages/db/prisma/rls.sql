-- Row Level Security lockdown for BazaarX.
--
-- All application DB access goes through Prisma, which connects as the database
-- OWNER role and therefore BYPASSES RLS. Enabling RLS here (without FORCE) does
-- not touch Prisma at all -- it locks down the `anon` and `authenticated` roles
-- that Supabase exposes through its auto-generated PostgREST API. With RLS on and
-- no permissive policy, those roles can read/write zero rows, so the public REST
-- surface for these tables is effectively closed.
--
-- Idempotent: safe to run repeatedly. Apply with `pnpm db:apply-rls`.

DO $$
DECLARE
  t text;
  app_tables text[] := ARRAY[
    'User','SellerProfile','Address','Category','Product','ProductVariant',
    'ProductImage','Cart','CartItem','Wishlist','Order','OrderItem',
    'OrderTracking','Payment','Review','Coupon','CouponUsage','Notification',
    'Payout','ResellerProfile','ResellerLink','Commission','Banner','Dispute'
  ];
BEGIN
  -- 1. Enable (not FORCE) RLS on every app table. Owner/Prisma still bypasses.
  FOREACH t IN ARRAY app_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
  END LOOP;

  -- 2. Storage: product and review images are public-read; KYC stays private
  --    (served only via service-role signed URLs). Uploads run server-side with
  --    the service role, which bypasses these policies.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'BazaarX public read products/reviews'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "BazaarX public read products/reviews"
        ON storage.objects FOR SELECT TO anon, authenticated
        USING (bucket_id IN ('products','reviews'));
    $pol$;
  END IF;
END $$;
