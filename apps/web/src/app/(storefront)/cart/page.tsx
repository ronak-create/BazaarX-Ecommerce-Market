"use client";

/* Hallmark · page: cart · genre: modern-minimal · system: BazaarX tokens
 * pre-emit critique: P4 H5 E4 S4 R4 V4 */

import Link from "next/link";
import { Minus, Plus, Trash, ShoppingCart } from "@phosphor-icons/react";
import { formatINR } from "@bazaarx/utils";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/hooks/use-cart";

function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <div className="skeleton h-8 w-32 rounded-lg" />
        {[0, 1].map((i) => (
          <div key={i} className="skeleton h-20 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton h-48 rounded-2xl" />
    </div>
  );
}

export default function CartPage() {
  const { data: cart, isLoading } = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();

  if (isLoading) return <CartSkeleton />;

  if (!cart || cart.itemCount === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-ink-300 bg-white py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-ink-100 text-ink-400">
          <ShoppingCart size={26} />
        </span>
        <p className="text-ink-500">Your cart is empty.</p>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg shadow-pop transition hover:bg-brand-800 active:scale-[0.98]"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <h1 className="font-display text-2xl font-bold text-ink-900">Cart</h1>
        {cart.groups.map((g) => (
          <div key={g.sellerId} className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
            <div className="border-b border-ink-100 px-4 py-2.5 text-sm font-medium text-ink-600">
              {g.sellerName}
            </div>
            {g.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 border-b border-ink-100 px-4 py-3 last:border-b-0">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="h-16 w-16 rounded-xl border border-ink-200 object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-ink-100" />
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.productSlug}`}
                    className="text-sm font-medium text-ink-800 transition-colors hover:text-brand-700"
                  >
                    {item.productName}
                  </Link>
                  <div className="text-xs text-ink-500">{item.variantLabel}</div>
                  <div className="text-sm text-ink-600 tabular-nums">{formatINR(item.unitPrice)}</div>
                </div>
                <div className="flex items-center rounded-full border border-ink-300 bg-white">
                  <button
                    className="grid h-9 w-9 place-items-center rounded-l-full text-ink-600 transition-colors hover:bg-ink-100 disabled:opacity-40"
                    disabled={update.isPending || item.quantity <= 1}
                    onClick={() => update.mutate({ id: item.id, quantity: item.quantity - 1 })}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                  <button
                    className="grid h-9 w-9 place-items-center rounded-r-full text-ink-600 transition-colors hover:bg-ink-100 disabled:opacity-40"
                    disabled={update.isPending || item.quantity >= item.stock}
                    onClick={() => update.mutate({ id: item.id, quantity: item.quantity + 1 })}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="w-20 text-right text-sm font-semibold text-ink-900 tabular-nums">
                  {formatINR(item.lineTotal)}
                </div>
                <button
                  className="grid h-9 w-9 place-items-center rounded-full text-ink-400 transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-40"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(item.id)}
                  aria-label="Remove item"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <aside className="h-fit rounded-2xl border border-ink-200 bg-white p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Summary</h2>
        <div className="flex justify-between text-sm">
          <span className="text-ink-500">Items</span>
          <span className="tabular-nums">{cart.itemCount}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-ink-100 pt-3 text-base font-semibold text-ink-900">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatINR(cart.subtotal)}</span>
        </div>
        <Link
          href="/checkout"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-fg shadow-pop transition hover:bg-brand-800 active:scale-[0.98]"
        >
          Proceed to checkout
        </Link>
        <p className="mt-3 text-center text-xs text-ink-400">
          Taxes and delivery calculated at checkout.
        </p>
      </aside>
    </div>
  );
}
