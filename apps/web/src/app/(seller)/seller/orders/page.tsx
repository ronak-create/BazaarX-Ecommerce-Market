import { requireApprovedSellerPage } from "@/lib/auth";
import { SellerOrdersList } from "@/components/seller/seller-orders-list";

export const dynamic = "force-dynamic";

export default async function SellerOrdersPage() {
  await requireApprovedSellerPage();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink-900">Orders</h1>
        <p className="mt-1 text-sm text-ink-500">Fulfil and track your customer orders.</p>
      </header>
      <SellerOrdersList />
    </div>
  );
}
