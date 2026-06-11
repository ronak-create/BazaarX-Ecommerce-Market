import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireApprovedSellerPage } from "@/lib/auth";
import { toProductDTO } from "@/lib/product-schema";
import { ProductForm } from "@/components/seller/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const seller = await requireApprovedSellerPage();

  const product = await prisma.product.findFirst({
    where: { id: params.id, sellerId: seller.id, deletedAt: null },
    include: { variants: true, images: true },
  });
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/seller/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-brand-700"
        >
          <ArrowLeft size={14} /> Products
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink-900">Edit product</h1>
      </div>
      <ProductForm initial={toProductDTO(product)} />
    </div>
  );
}
