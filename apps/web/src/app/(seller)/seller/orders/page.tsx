import { requireApprovedSellerPage } from "@/lib/auth";
import { SellerOrdersList } from "@/components/seller/seller-orders-list";

export const dynamic = "force-dynamic";

export default async function SellerOrdersPage() {
  await requireApprovedSellerPage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <SellerOrdersList />
    </div>
  );
}
