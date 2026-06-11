import { CouponManager } from "@/components/admin/coupon-manager";

export const dynamic = "force-dynamic";

export default function AdminCouponsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Coupons</h1>
        <p className="mt-1 text-sm text-slate-500">Create and manage discount codes.</p>
      </header>
      <CouponManager />
    </div>
  );
}
