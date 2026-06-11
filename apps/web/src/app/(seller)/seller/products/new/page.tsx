import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { requireApprovedSellerPage } from "@/lib/auth";
import { ProductForm } from "@/components/seller/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireApprovedSellerPage();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/seller/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-brand-700"
        >
          <ArrowLeft size={14} /> Products
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink-900">New product</h1>
      </div>
      <ProductForm />
    </div>
  );
}
