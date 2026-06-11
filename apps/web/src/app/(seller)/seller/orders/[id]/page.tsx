import { requireApprovedSellerPage } from "@/lib/auth";
import { SellerOrderDetail } from "@/components/seller/seller-order-detail";

export const dynamic = "force-dynamic";

export default async function SellerOrderPage({ params }: { params: { id: string } }) {
  await requireApprovedSellerPage();
  return <SellerOrderDetail id={params.id} />;
}
