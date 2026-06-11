import Link from "next/link";
import { formatINR } from "@bazaarx/utils";
import type { ProductCard as ProductCardData } from "@bazaarx/types";

/** Compact product tile used on the homepage, listings, and wishlist. */
export function ProductCard({ product }: { product: ProductCardData }) {
  const price = product.discountedPrice ?? product.basePrice;
  const hasDiscount = product.discountedPrice != null;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-lg border border-slate-200 transition hover:shadow-md"
    >
      <div className="aspect-square bg-slate-50">
        {product.primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primaryImage}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-300">
            No image
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="line-clamp-2 text-sm font-medium">{product.name}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-semibold">{formatINR(price)}</span>
          {hasDiscount && (
            <span className="text-xs text-slate-400 line-through">{formatINR(product.basePrice)}</span>
          )}
        </div>
        {product.avgRating > 0 && (
          <div className="mt-1 text-xs text-amber-600">★ {product.avgRating.toFixed(1)}</div>
        )}
      </div>
    </Link>
  );
}
