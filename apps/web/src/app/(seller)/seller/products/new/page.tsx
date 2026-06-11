import { requireApprovedSellerPage } from "@/lib/auth";
import { ProductForm } from "@/components/seller/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireApprovedSellerPage();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">New product</h1>
      <ProductForm />
    </div>
  );
}
