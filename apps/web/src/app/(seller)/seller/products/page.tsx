import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { requireApprovedSellerPage } from "@/lib/auth";
import { ProductTable } from "@/components/seller/product-table";
import { BulkUpload } from "@/components/seller/bulk-upload";

export const dynamic = "force-dynamic";

export default async function SellerProductsPage() {
  await requireApprovedSellerPage();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Products</h1>
          <p className="mt-1 text-sm text-ink-500">Manage your listings.</p>
        </div>
        <div className="flex items-center gap-2">
          <BulkUpload />
          <Link
            href="/seller/products/new"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg shadow-pop transition hover:bg-brand-800 active:scale-[0.98]"
          >
            <Plus size={16} weight="bold" /> New product
          </Link>
        </div>
      </header>
      <ProductTable />
    </div>
  );
}
