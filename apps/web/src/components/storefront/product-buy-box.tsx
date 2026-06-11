"use client";

import { useState } from "react";
import {
  ShoppingCart,
  Heart,
  CheckCircle,
  Minus,
  Plus,
  WarningCircle,
} from "@phosphor-icons/react";
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
  const lowStock = inStock && (variant?.stock ?? 0) <= 5;

  return (
    <div className="space-y-5">
      <div className="flex items-end gap-3">
        <span className="font-display text-3xl font-bold text-ink-900">
          {variant ? formatINR(variant.price) : "Unavailable"}
        </span>
        <span className="mb-1 text-xs text-ink-400">Inclusive of all taxes</span>
      </div>

      {variants.length > 1 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-ink-700">Choose a variant</span>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                disabled={v.stock === 0}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  v.id === variantId
                    ? "border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-100"
                    : "border-ink-300 text-ink-700 hover:border-ink-400"
                } ${v.stock === 0 ? "cursor-not-allowed line-through opacity-40" : ""}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-sm">
        {!inStock ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-accent">
            <WarningCircle size={16} weight="fill" /> Out of stock
          </span>
        ) : lowStock ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-amber-600">
            <WarningCircle size={16} weight="fill" /> Only {variant!.stock} left
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
            <CheckCircle size={16} weight="fill" /> In stock
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-ink-300 bg-white">
          <button
            className="grid h-11 w-11 place-items-center rounded-l-full text-ink-600 transition-colors hover:bg-ink-100 disabled:opacity-40"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </button>
          <span className="w-10 text-center text-sm font-semibold tabular-nums">{qty}</span>
          <button
            className="grid h-11 w-11 place-items-center rounded-r-full text-ink-600 transition-colors hover:bg-ink-100 disabled:opacity-40"
            onClick={() => setQty((q) => Math.min(variant?.stock ?? 1, q + 1))}
            disabled={qty >= (variant?.stock ?? 1)}
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </button>
        </div>

        <button
          disabled={!inStock || !variantId || add.isPending}
          onClick={() => add.mutate({ productId, variantId, quantity: qty })}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-brand-fg shadow-pop transition-all hover:bg-brand-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart size={18} weight="bold" />
          {add.isPending ? "Adding…" : "Add to cart"}
        </button>

        <button
          onClick={() => (saved ? removeWish.mutate(productId) : addWish.mutate(productId))}
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          className={`grid h-11 w-11 place-items-center rounded-full border transition-all active:scale-95 ${
            saved
              ? "border-accent bg-accent/10 text-accent"
              : "border-ink-300 text-ink-600 hover:border-accent hover:text-accent"
          }`}
        >
          <Heart size={20} weight={saved ? "fill" : "regular"} />
        </button>
      </div>

      {add.isError && (
        <p className="text-sm font-medium text-accent">{(add.error as Error).message}</p>
      )}
      {add.isSuccess && (
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
          <CheckCircle size={16} weight="fill" /> Added to cart.
        </p>
      )}
      {(addWish.isError || removeWish.isError) && (
        <p className="text-sm font-medium text-accent">
          {((addWish.error || removeWish.error) as Error).message}
        </p>
      )}
    </div>
  );
}
