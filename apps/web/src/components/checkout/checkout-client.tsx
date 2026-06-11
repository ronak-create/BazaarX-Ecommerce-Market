"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@bazaarx/ui";
import { formatINR } from "@bazaarx/utils";
import { useCart } from "@/hooks/use-cart";
import { useAddresses } from "@/hooks/use-addresses";
import { usePlaceOrder } from "@/hooks/use-orders";
import { AddressForm } from "@/components/account/address-form";
import { payWithRazorpay } from "@/lib/razorpay-checkout";
import type { AuthProfile, PaymentMethodDTO } from "@bazaarx/types";

export function CheckoutClient() {
  const router = useRouter();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses } = useAddresses();
  const place = usePlaceOrder();

  const [addressId, setAddressId] = useState("");
  const [method, setMethod] = useState<PaymentMethodDTO>("COD");
  const [showAddForm, setShowAddForm] = useState(false);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setProfile)
      .catch(() => {});
  }, []);

  // Default to the default/first address once loaded.
  useEffect(() => {
    if (!addressId && addresses && addresses.length > 0) {
      const preferred = addresses.find((a) => a.isDefault) ?? addresses[0];
      if (preferred) setAddressId(preferred.id);
    }
  }, [addresses, addressId]);

  if (cartLoading) return <p className="text-sm text-slate-500">Loading…</p>;
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

  async function placeOrder() {
    setError(null);
    try {
      const result = await place.mutateAsync({ addressId, paymentMethod: method });
      if (method === "RAZORPAY" && result.razorpay) {
        const ok = await payWithRazorpay(result.razorpay, {
          name: profile?.name,
          email: profile?.email,
          phone: profile?.phone,
        });
        if (!ok) {
          setError("Payment was not completed. You can retry from your orders.");
          router.push(`/orders/${result.orderIds[0]}`);
          return;
        }
      }
      router.push(result.orderIds.length === 1 ? `/orders/${result.orderIds[0]}` : "/orders");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place order");
    }
  }

  const busy = place.isPending;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Delivery address</h2>
            <button onClick={() => setShowAddForm((v) => !v)} className="text-sm text-brand hover:underline">
              {showAddForm ? "Cancel" : "+ Add new"}
            </button>
          </div>

          {showAddForm && (
            <div className="mb-4 rounded-lg border border-slate-200 p-4">
              <AddressForm onCreated={() => setShowAddForm(false)} />
            </div>
          )}

          <div className="space-y-2">
            {(addresses ?? []).map((a) => (
              <label
                key={a.id}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${
                  addressId === a.id ? "border-brand" : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={addressId === a.id}
                  onChange={() => setAddressId(a.id)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">{a.fullName}</span> · {a.phone}
                  <br />
                  {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                </span>
              </label>
            ))}
            {(!addresses || addresses.length === 0) && !showAddForm && (
              <p className="text-sm text-slate-500">Add a delivery address to continue.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium">Payment</h2>
          <div className="space-y-2 text-sm">
            {(["COD", "RAZORPAY"] as PaymentMethodDTO[]).map((m) => (
              <label
                key={m}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                  method === m ? "border-brand" : "border-slate-200"
                }`}
              >
                <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} />
                {m === "COD" ? "Cash on Delivery" : "Pay online (Razorpay — UPI/cards/netbanking)"}
              </label>
            ))}
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-lg border border-slate-200 p-5">
        <h2 className="mb-3 text-lg font-medium">Order total</h2>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Items</span>
          <span>{cart.itemCount}</span>
        </div>
        <div className="mt-1 flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatINR(cart.subtotal)}</span>
        </div>
        {cart.groups.length > 1 && (
          <p className="mt-2 text-xs text-slate-400">
            Your items ship from {cart.groups.length} sellers — separate orders will be created.
          </p>
        )}
        <Button className="mt-4 w-full" disabled={!addressId || busy} onClick={placeOrder}>
          {busy ? "Placing…" : method === "COD" ? "Place order" : "Pay & place order"}
        </Button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </aside>
    </div>
  );
}
