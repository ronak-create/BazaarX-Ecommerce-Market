"use client";

import Link from "next/link";
import { Button } from "@bazaarx/ui";
import { formatINR } from "@bazaarx/utils";
import { useCart } from "@/hooks/use-cart";

export default function CheckoutPage() {
  const { data: cart, isLoading } = useCart();

  if (isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!cart || cart.itemCount === 0) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-slate-500">Nothing to check out.</p>
        <Link href="/search">
          <Button>Browse products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Checkout</h1>

      <div className="rounded-lg border border-slate-200 p-5">
        <h2 className="mb-3 text-lg font-medium">Order summary</h2>
        {cart.groups.flatMap((g) => g.items).map((item) => (
          <div key={item.id} className="flex justify-between py-1 text-sm">
            <span>
              {item.productName} × {item.quantity}
            </span>
            <span>{formatINR(item.lineTotal)}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-semibold">
          <span>Subtotal</span>
          <span>{formatINR(cart.subtotal)}</span>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
        Address selection and payment (Razorpay + COD) arrive in Phase 4.
      </div>
    </div>
  );
}
