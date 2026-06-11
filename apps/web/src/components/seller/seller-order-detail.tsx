"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@bazaarx/ui";
import { formatINR } from "@bazaarx/utils";
import {
  useSellerOrder,
  useConfirmOrder,
  useShipOrder,
  useUpdateOrderStatus,
} from "@/hooks/use-seller-orders";
import { StatusBadge } from "@/components/orders/status-badge";
import { TrackingTimeline } from "@/components/orders/tracking-timeline";

export function SellerOrderDetail({ id }: { id: string }) {
  const { data: order, isLoading } = useSellerOrder(id);
  const confirm = useConfirmOrder();
  const ship = useShipOrder();
  const status = useUpdateOrderStatus();

  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");

  if (isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!order) return <p className="text-sm text-red-600">Order not found.</p>;

  const busy = confirm.isPending || ship.isPending || status.isPending;
  const err = (confirm.error || ship.error || status.error) as Error | null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/seller/orders" className="text-sm text-slate-500 hover:underline">
        ← All orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Order</h1>
          <p className="text-sm text-slate-500">
            {order.paymentMethod} · payment {order.paymentStatus.toLowerCase()} · you earn{" "}
            {formatINR(order.sellerAmount)} (fee {formatINR(order.platformFee)})
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500">Items</h2>
          {order.items.map((i) => (
            <div key={i.id} className="flex justify-between text-sm">
              <span>
                {i.productName} · {i.variantLabel} × {i.quantity}
              </span>
              <span className="font-medium">{formatINR(i.totalPrice)}</span>
            </div>
          ))}
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <div className="text-xs text-slate-500">Ship to</div>
            <div className="font-medium">{order.address.fullName} · {order.address.phone}</div>
            <div className="text-slate-600">
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city},{" "}
              {order.address.state} {order.address.pincode}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500">Tracking</h2>
          <TrackingTimeline tracking={order.tracking} />

          <div className="space-y-2 border-t border-slate-100 pt-4">
            {order.status === "PLACED" && (
              <Button disabled={busy} onClick={() => confirm.mutate({ id })}>
                {confirm.isPending ? "Confirming…" : "Confirm order"}
              </Button>
            )}

            {(order.status === "PLACED" || order.status === "CONFIRMED") && (
              <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                <div className="text-sm font-medium">Ship order</div>
                <input
                  placeholder="Tracking number"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="Carrier (e.g. Delhivery)"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
                <Button
                  disabled={busy || !tracking.trim() || !carrier.trim()}
                  onClick={() => ship.mutate({ id, body: { trackingNumber: tracking.trim(), carrier: carrier.trim() } })}
                >
                  {ship.isPending ? "Marking shipped…" : "Mark shipped"}
                </Button>
              </div>
            )}

            {order.status === "SHIPPED" && (
              <Button disabled={busy} onClick={() => status.mutate({ id, body: { status: "OUT_FOR_DELIVERY" } })}>
                Mark out for delivery
              </Button>
            )}
            {order.status === "OUT_FOR_DELIVERY" && (
              <Button disabled={busy} onClick={() => status.mutate({ id, body: { status: "DELIVERED" } })}>
                Mark delivered
              </Button>
            )}
            {order.status === "RETURN_REQUESTED" && (
              <Button disabled={busy} onClick={() => status.mutate({ id, body: { status: "RETURNED" } })}>
                Approve return
              </Button>
            )}

            {err && <p className="text-sm text-red-600">{err.message}</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
