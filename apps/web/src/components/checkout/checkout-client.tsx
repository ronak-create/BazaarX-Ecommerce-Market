"use client";

/* Hallmark · component: checkout · genre: modern-minimal · system: BazaarX tokens
 * pre-emit critique: P4 H5 E4 S5 R4 V4 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Money,
  CreditCard,
  Tag,
  CheckCircle,
  Plus,
} from "@phosphor-icons/react";
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

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

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

  if (cartLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="skeleton h-40 rounded-2xl" />
          <div className="skeleton h-28 rounded-2xl" />
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }
  if (!cart || cart.itemCount === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-ink-300 bg-white py-16 text-center">
        <p className="text-ink-500">Nothing to check out.</p>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg shadow-pop transition hover:bg-brand-800 active:scale-[0.98]"
        >
          Browse products
        </Link>
      </div>
    );
  }

  async function applyCoupon() {
    setCouponError(null);
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponInput.trim(), subtotal: cart!.subtotal }),
    });
    const json = await res.json();
    if (!res.ok) {
      setCoupon(null);
      setCouponError(json.error?.message ?? "Invalid coupon");
      return;
    }
    setCoupon(json);
  }

  async function placeOrder() {
    setError(null);
    try {
      const result = await place.mutateAsync({
        addressId,
        paymentMethod: method,
        couponCode: coupon?.code,
      });
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
  const total = Math.max(0, Number(cart.subtotal) - Number(coupon?.discount ?? 0));

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <MapPin size={18} weight="bold" className="text-brand-700" /> Delivery address
            </h2>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 transition-colors hover:text-brand-800"
            >
              {showAddForm ? "Cancel" : (<><Plus size={14} weight="bold" /> Add new</>)}
            </button>
          </div>

          {showAddForm && (
            <div className="mb-4 rounded-2xl border border-ink-200 bg-white p-4">
              <AddressForm onCreated={() => setShowAddForm(false)} />
            </div>
          )}

          <div className="space-y-2">
            {(addresses ?? []).map((a) => (
              <label
                key={a.id}
                className={`flex cursor-pointer gap-3 rounded-2xl border bg-white p-4 text-sm transition-colors ${
                  addressId === a.id ? "border-brand-500 ring-2 ring-brand-100" : "border-ink-200 hover:border-ink-300"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={addressId === a.id}
                  onChange={() => setAddressId(a.id)}
                  className="mt-1 accent-brand"
                />
                <span className="text-ink-700">
                  <span className="font-semibold text-ink-900">{a.fullName}</span> · {a.phone}
                  <br />
                  {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                </span>
              </label>
            ))}
            {(!addresses || addresses.length === 0) && !showAddForm && (
              <p className="text-sm text-ink-500">Add a delivery address to continue.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Payment</h2>
          <div className="space-y-2">
            {(["COD", "RAZORPAY"] as PaymentMethodDTO[]).map((m) => (
              <label
                key={m}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border bg-white p-4 text-sm transition-colors ${
                  method === m ? "border-brand-500 ring-2 ring-brand-100" : "border-ink-200 hover:border-ink-300"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={method === m}
                  onChange={() => setMethod(m)}
                  className="accent-brand"
                />
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-700">
                  {m === "COD" ? <Money size={18} weight="bold" /> : <CreditCard size={18} weight="bold" />}
                </span>
                <span className="text-ink-700">
                  {m === "COD" ? "Cash on Delivery" : "Pay online (Razorpay: UPI / cards / netbanking)"}
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-ink-200 bg-white p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Order total</h2>

        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Coupon code"
                className="w-full rounded-full border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm uppercase text-ink-900 placeholder:normal-case placeholder:text-ink-400 outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />
            </div>
            <button
              onClick={applyCoupon}
              className="rounded-full border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-400 hover:bg-ink-50"
            >
              Apply
            </button>
          </div>
          {couponError && <p className="text-xs font-medium text-accent">{couponError}</p>}
          {coupon && (
            <p className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <CheckCircle size={14} weight="fill" /> {coupon.code} applied · {formatINR(coupon.discount)} off
            </p>
          )}
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-ink-500">Subtotal</span>
          <span className="tabular-nums">{formatINR(cart.subtotal)}</span>
        </div>
        {coupon && (
          <div className="mt-1 flex justify-between text-sm text-emerald-600">
            <span>Discount</span>
            <span className="tabular-nums">− {formatINR(coupon.discount)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-ink-100 pt-3 text-base font-semibold text-ink-900">
          <span>Total</span>
          <span className="tabular-nums">{formatINR(total)}</span>
        </div>
        {cart.groups.length > 1 && (
          <p className="mt-2 text-xs text-ink-400">
            Your items ship from {cart.groups.length} sellers, so separate orders will be created.
          </p>
        )}
        <button
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-fg shadow-pop transition hover:bg-brand-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!addressId || busy}
          onClick={placeOrder}
        >
          {busy ? "Placing…" : method === "COD" ? "Place order" : "Pay & place order"}
        </button>
        {error && <p className="mt-2 text-sm font-medium text-accent">{error}</p>}
      </aside>
    </div>
  );
}
