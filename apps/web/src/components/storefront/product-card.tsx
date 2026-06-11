import Link from "next/link";
import { Star, Image } from "@phosphor-icons/react/dist/ssr";
import { formatINR } from "@bazaarx/utils";
import type { ProductCard as ProductCardData } from "@bazaarx/types";

/** Compact product tile used on the homepage, listings, and wishlist. */
export function ProductCard({ product }: { product: ProductCardData }) {
  const price = product.discountedPrice ?? product.basePrice;
  const hasDiscount = product.discountedPrice != null;
  const off = hasDiscount
    ? Math.round((1 - Number(product.discountedPrice) / Number(product.basePrice)) * 100)
    : 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover"
    >
      <div className="relative aspect-square overflow-hidden bg-ink-100">
        {product.primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primaryImage}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-ink-300">
            <Image size={28} />
            <span className="text-xs">No image</span>
          </div>
        )}

        {off > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-fg shadow-sm">
            {off}% off
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="line-clamp-2 text-sm font-medium leading-snug text-ink-800 transition-colors group-hover:text-brand-700">
          {product.name}
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-base font-semibold text-ink-900">{formatINR(price)}</span>
          {hasDiscount && (
            <span className="text-xs text-ink-400 line-through">{formatINR(product.basePrice)}</span>
          )}
        </div>

        {product.avgRating > 0 && (
          <div className="mt-2 inline-flex w-fit items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
            <Star size={12} weight="fill" />
            {product.avgRating.toFixed(1)}
          </div>
        )}
      </div>
    </Link>
  );
}
