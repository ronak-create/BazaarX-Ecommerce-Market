import { notFound } from "next/navigation";
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
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <ProductForm initial={toProductDTO(product)} />
    </div>
  );
}
