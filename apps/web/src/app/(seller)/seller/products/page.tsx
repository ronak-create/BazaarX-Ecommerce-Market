import Link from "next/link";
import { Button } from "@bazaarx/ui";
import { requireApprovedSellerPage } from "@/lib/auth";
import { ProductTable } from "@/components/seller/product-table";
import { BulkUpload } from "@/components/seller/bulk-upload";

export const dynamic = "force-dynamic";

export default async function SellerProductsPage() {
  await requireApprovedSellerPage();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your listings.</p>
        </div>
        <div className="flex items-center gap-2">
          <BulkUpload />
          <Link href="/seller/products/new">
            <Button>New product</Button>
          </Link>
        </div>
      </header>
      <ProductTable />
    </div>
  );
}
