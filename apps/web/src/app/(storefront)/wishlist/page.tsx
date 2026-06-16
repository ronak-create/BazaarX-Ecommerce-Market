"use client";

import { InlineLoader } from "@/components/loading-screen";

import Link from "next/link";
import { Button } from "@bazaarx/ui";
import { formatINR } from "@bazaarx/utils";
import { useWishlist, useRemoveWishlist } from "@/hooks/use-wishlist";

export default function WishlistPage() {
  const { data: items, isLoading } = useWishlist();
  const remove = useRemoveWishlist();

  if (isLoading) return <InlineLoader />;

  if (!items || items.length === 0) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-slate-500">Your wishlist is empty.</p>
        <Link href="/search">
          <Button>Browse products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Wishlist</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <div key={p.productId} className="overflow-hidden rounded-lg border border-slate-200">
            <Link
              href={`/product/${p.slug}`}
              data-product-card
              data-card-image={p.image ?? ""}
              className="block aspect-square bg-white"
            >
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt={p.name} className="h-full w-full object-contain p-3" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-300">
                  No image
                </div>
              )}
            </Link>
            <div className="p-3">
              <Link href={`/product/${p.slug}`} className="line-clamp-2 text-sm font-medium hover:underline">
                {p.name}
              </Link>
              <div className="mt-1 font-semibold">
                {formatINR(p.discountedPrice ?? p.basePrice)}
              </div>
              <button
                className="mt-2 text-xs text-red-500 hover:underline"
                disabled={remove.isPending}
                onClick={() => remove.mutate(p.productId)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
