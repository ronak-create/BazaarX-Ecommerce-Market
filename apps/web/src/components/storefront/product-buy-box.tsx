"use client";

import { useState } from "react";
import { Button } from "@bazaarx/ui";
import { formatINR } from "@bazaarx/utils";
import { useAddToCart } from "@/hooks/use-cart";
import { useWishlist, useAddWishlist, useRemoveWishlist } from "@/hooks/use-wishlist";
import type { ProductVariantDTO } from "@bazaarx/types";

export function ProductBuyBox({
  productId,
  variants,
}: {
  productId: string;
  variants: ProductVariantDTO[];
}) {
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const add = useAddToCart();

  const wishlist = useWishlist();
  const addWish = useAddWishlist();
  const removeWish = useRemoveWishlist();
  const saved = wishlist.data?.some((w) => w.productId === productId) ?? false;

  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const inStock = (variant?.stock ?? 0) > 0;

  return (
    <div className="space-y-4">
      <div className="text-2xl font-semibold">{variant ? formatINR(variant.price) : "—"}</div>

      {variants.length > 1 && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Variant</label>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  v.id === variantId ? "border-brand text-brand" : "border-slate-300"
                } ${v.stock === 0 ? "opacity-40" : ""}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-sm text-slate-500">
        {inStock ? `${variant!.stock} in stock` : "Out of stock"}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-md border border-slate-300">
          <button className="px-3 py-1.5" onClick={() => setQty((q) => Math.max(1, q - 1))}>
            −
          </button>
          <span className="w-8 text-center text-sm">{qty}</span>
          <button
            className="px-3 py-1.5"
            onClick={() => setQty((q) => Math.min(variant?.stock ?? 1, q + 1))}
          >
            +
          </button>
        </div>

        <Button
          disabled={!inStock || !variantId || add.isPending}
          onClick={() => add.mutate({ productId, variantId, quantity: qty })}
        >
          {add.isPending ? "Adding…" : "Add to cart"}
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            saved ? removeWish.mutate(productId) : addWish.mutate(productId)
          }
        >
          {saved ? "♥ Saved" : "♡ Save"}
        </Button>
      </div>

      {add.isError && <p className="text-sm text-red-600">{(add.error as Error).message}</p>}
      {add.isSuccess && <p className="text-sm text-green-600">Added to cart.</p>}
      {(addWish.isError || removeWish.isError) && (
        <p className="text-sm text-red-600">
          {((addWish.error || removeWish.error) as Error).message}
        </p>
      )}
    </div>
  );
}
