"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Package, WarningCircle } from "@phosphor-icons/react";
import { formatINR } from "@bazaarx/utils";
import {
  useSellerOrder,
  useConfirmOrder,
  useShipOrder,
  useUpdateOrderStatus,
} from "@/hooks/use-seller-orders";
import { StatusBadge } from "@/components/orders/status-badge";
import { TrackingTimeline } from "@/components/orders/tracking-timeline";

const primaryBtn =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg shadow-pop transition hover:bg-brand-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
const fieldCls =
  "w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

export function SellerOrderDetail({ id }: { id: string }) {
  const { data: order, isLoading } = useSellerOrder(id);
  const confirm = useConfirmOrder();
  const ship = useShipOrder();
  const status = useUpdateOrderStatus();

  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="skeleton h-6 w-24 rounded-lg" />
        <div className="skeleton h-20 rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="skeleton h-48 rounded-2xl" />
          <div className="skeleton h-48 rounded-2xl" />
        </div>
      </div>
    );
  }
  if (!order) return <p className="text-sm font-medium text-accent">Order not found.</p>;

  const busy = confirm.isPending || ship.isPending || status.isPending;
  const err = (confirm.error || ship.error || status.error) as Error | null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/seller/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-brand-700"
      >
        <ArrowLeft size={14} /> All orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Order</h1>
          <p className="mt-1 text-sm text-ink-500">
            {order.paymentMethod} · payment {order.paymentStatus.toLowerCase()} · you earn{" "}
            <span className="font-semibold text-ink-700 tabular-nums">{formatINR(order.sellerAmount)}</span>{" "}
            <span className="text-ink-400">(fee {formatINR(order.platformFee)})</span>
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink-900">
            <Package size={18} weight="bold" className="text-brand-700" /> Items
          </h2>
          <div className="space-y-2">
            {order.items.map((i) => (
              <div key={i.id} className="flex justify-between gap-3 text-sm">
                <span className="text-ink-700">
                  {i.productName} · {i.variantLabel} × {i.quantity}
                </span>
                <span className="font-medium tabular-nums text-ink-900">{formatINR(i.totalPrice)}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-3 text-sm">
            <div className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
              <MapPin size={13} /> Ship to
            </div>
            <div className="mt-1 font-medium text-ink-900">{order.address.fullName} · {order.address.phone}</div>
            <div className="text-ink-600">
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city},{" "}
              {order.address.state} {order.address.pincode}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="font-display text-base font-semibold text-ink-900">Tracking</h2>
          <TrackingTimeline tracking={order.tracking} />

          <div className="space-y-2 border-t border-ink-100 pt-4">
            {order.status === "PLACED" && (
              <button className={primaryBtn} disabled={busy} onClick={() => confirm.mutate({ id })}>
                {confirm.isPending ? "Confirming…" : "Confirm order"}
              </button>
            )}

            {(order.status === "PLACED" || order.status === "CONFIRMED") && (
              <div className="space-y-2 rounded-xl border border-ink-200 bg-ink-50/60 p-3">
                <div className="text-sm font-medium text-ink-700">Ship order</div>
                <input placeholder="Tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} className={fieldCls} />
                <input placeholder="Carrier (e.g. Delhivery)" value={carrier} onChange={(e) => setCarrier(e.target.value)} className={fieldCls} />
                <button
                  className={primaryBtn}
                  disabled={busy || !tracking.trim() || !carrier.trim()}
                  onClick={() => ship.mutate({ id, body: { trackingNumber: tracking.trim(), carrier: carrier.trim() } })}
                >
                  {ship.isPending ? "Marking shipped…" : "Mark shipped"}
                </button>
              </div>
            )}

            {order.status === "SHIPPED" && (
              <button className={primaryBtn} disabled={busy} onClick={() => status.mutate({ id, body: { status: "OUT_FOR_DELIVERY" } })}>
                Mark out for delivery
              </button>
            )}
            {order.status === "OUT_FOR_DELIVERY" && (
              <button className={primaryBtn} disabled={busy} onClick={() => status.mutate({ id, body: { status: "DELIVERED" } })}>
                Mark delivered
              </button>
            )}
            {order.status === "RETURN_REQUESTED" && (
              <button className={primaryBtn} disabled={busy} onClick={() => status.mutate({ id, body: { status: "RETURNED" } })}>
                Approve return
              </button>
            )}

            {err && (
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                <WarningCircle size={15} weight="fill" /> {err.message}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
