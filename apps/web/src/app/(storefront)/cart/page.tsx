"use client";

import Link from "next/link";
import { Button } from "@bazaarx/ui";
import { formatINR } from "@bazaarx/utils";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/hooks/use-cart";

export default function CartPage() {
  const { data: cart, isLoading } = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();

  if (isLoading) return <p className="text-sm text-slate-500">Loading cart…</p>;

  if (!cart || cart.itemCount === 0) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-slate-500">Your cart is empty.</p>
        <Link href="/search">
          <Button>Browse products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <h1 className="text-2xl font-semibold">Cart</h1>
        {cart.groups.map((g) => (
          <div key={g.sellerId} className="rounded-lg border border-slate-200">
            <div className="border-b border-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
              {g.sellerName}
            </div>
            {g.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="h-16 w-16 rounded object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded bg-slate-100" />
                )}
                <div className="flex-1">
                  <Link href={`/product/${item.productSlug}`} className="text-sm font-medium hover:underline">
                    {item.productName}
                  </Link>
                  <div className="text-xs text-slate-500">{item.variantLabel}</div>
                  <div className="text-sm">{formatINR(item.unitPrice)}</div>
                </div>
                <div className="flex items-center rounded-md border border-slate-300">
                  <button
                    className="px-2 py-1"
                    disabled={update.isPending || item.quantity <= 1}
                    onClick={() => update.mutate({ id: item.id, quantity: item.quantity - 1 })}
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    className="px-2 py-1"
                    disabled={update.isPending || item.quantity >= item.stock}
                    onClick={() => update.mutate({ id: item.id, quantity: item.quantity + 1 })}
                  >
                    +
                  </button>
                </div>
                <div className="w-20 text-right text-sm font-medium">{formatINR(item.lineTotal)}</div>
                <button
                  className="text-xs text-red-500 hover:underline"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <aside className="h-fit rounded-lg border border-slate-200 p-5">
        <h2 className="mb-3 text-lg font-medium">Summary</h2>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Items</span>
          <span>{cart.itemCount}</span>
        </div>
        <div className="mt-1 flex justify-between font-semibold">
          <span>Subtotal</span>
          <span>{formatINR(cart.subtotal)}</span>
        </div>
        <Link href="/checkout">
          <Button className="mt-4 w-full">Proceed to checkout</Button>
        </Link>
        <p className="mt-2 text-center text-xs text-slate-400">
          Taxes and delivery calculated at checkout.
        </p>
      </aside>
    </div>
  );
}
