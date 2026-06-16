import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CaretRight,
  Star,
  Storefront,
  Truck,
  ArrowsCounterClockwise,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { prisma, ProductStatus } from "@bazaarx/db";
import { toProductDTO } from "@/lib/product-schema";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductBuyBox } from "@/components/storefront/product-buy-box";
import { ResellerShare } from "@/components/reseller/reseller-share";
import { ReviewsSection } from "@/components/storefront/reviews-section";
import { RouteReadyBeacon } from "@/components/storefront/route-ready-beacon";

export const dynamic = "force-dynamic";

const BADGES = [
  { icon: Truck, label: "Fast delivery" },
  { icon: ArrowsCounterClockwise, label: "7-day returns" },
  { icon: ShieldCheck, label: "Secure payment" },
];

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
    <div className="space-y-10">
      <nav className="flex items-center gap-1 text-sm text-ink-500">
        <Link href="/" className="transition-colors hover:text-brand-700">Home</Link>
        <CaretRight size={13} className="text-ink-300" />
        <Link href={`/category/${product.category.slug}`} className="transition-colors hover:text-brand-700">
          {product.category.name}
        </Link>
        <CaretRight size={13} className="text-ink-300" />
        <span className="truncate font-medium text-ink-700">{dto.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={dto.images} name={dto.name} />

        <div className="space-y-6">
          <div className="space-y-3">
            {dto.brand && (
              <span className="text-sm font-medium uppercase tracking-wide text-brand-600">{dto.brand}</span>
            )}
            <h1 className="font-display text-2xl font-bold leading-tight text-ink-900 sm:text-3xl">
              {dto.name}
            </h1>
            <div className="flex items-center gap-3 text-sm">
              {dto.totalReviews > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                  <Star size={13} weight="fill" />
                  {dto.avgRating.toFixed(1)}
                  <span className="font-normal text-emerald-600/70">({dto.totalReviews})</span>
                </span>
              ) : (
                <span className="text-ink-400">No reviews yet</span>
              )}
            </div>
          </div>

          <div className="h-px bg-ink-200" />

          <ProductBuyBox productId={dto.id} variants={dto.variants} />

          <div className="flex divide-x divide-ink-200 rounded-xl border border-ink-200 bg-white">
            {BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-1 items-center justify-center gap-2 px-2 py-3">
                <Icon size={18} weight="bold" className="text-brand-700" />
                <span className="text-xs font-medium text-ink-600">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
              <Storefront size={20} weight="fill" />
            </span>
            <div>
              <div className="text-xs text-ink-500">Sold by</div>
              <div className="font-semibold text-ink-900">{product.seller.businessName}</div>
            </div>
          </div>

          <ResellerShare productId={dto.id} />

          <div className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="font-display text-base font-semibold text-ink-900">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-600">
              {dto.description}
            </p>
          </div>
        </div>
      </div>

      <ReviewsSection productId={dto.id} />
      <RouteReadyBeacon />
    </div>
  );
}
