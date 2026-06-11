import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, ProductStatus } from "@bazaarx/db";
import { toProductDTO } from "@/lib/product-schema";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductBuyBox } from "@/components/storefront/product-buy-box";
import { ResellerShare } from "@/components/reseller/reseller-share";
import { ReviewsSection } from "@/components/storefront/reviews-section";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findFirst({
    where: { slug: params.slug, deletedAt: null, status: ProductStatus.ACTIVE },
    include: {
      variants: true,
      images: true,
      category: { select: { name: true, slug: true } },
      seller: { select: { businessName: true } },
    },
  });
  if (!product) notFound();

  const dto = toProductDTO(product);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:underline">Home</Link>
        {" / "}
        <Link href={`/category/${product.category.slug}`} className="hover:underline">
          {product.category.name}
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={dto.images} name={dto.name} />

        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">{dto.name}</h1>

          <div className="flex items-center gap-3 text-sm">
            {dto.totalReviews > 0 ? (
              <span className="text-amber-600">
                ★ {dto.avgRating.toFixed(1)} ({dto.totalReviews})
              </span>
            ) : (
              <span className="text-slate-400">No reviews yet</span>
            )}
            {dto.brand && <span className="text-slate-500">· {dto.brand}</span>}
          </div>

          <ProductBuyBox productId={dto.id} variants={dto.variants} />

          <div className="rounded-lg border border-slate-200 p-4 text-sm">
            <div className="text-slate-500">Sold by</div>
            <div className="font-medium">{product.seller.businessName}</div>
          </div>

          <ResellerShare productId={dto.id} />

          <div className="prose-sm">
            <h2 className="mb-1 text-sm font-semibold">Description</h2>
            <p className="whitespace-pre-line text-sm text-slate-600">{dto.description}</p>
          </div>
        </div>
      </div>

      <ReviewsSection productId={dto.id} />
    </div>
  );
}
