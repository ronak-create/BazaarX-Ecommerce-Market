"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@bazaarx/ui";
import { formatINR } from "@bazaarx/utils";
import { useOrder, useCancelOrder, useReturnOrder } from "@/hooks/use-orders";
import { StatusBadge } from "@/components/orders/status-badge";
import { TrackingTimeline } from "@/components/orders/tracking-timeline";

const CANCELLABLE = ["PLACED", "CONFIRMED"];

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { data: order, isLoading } = useOrder(params.id);
  const cancel = useCancelOrder();
  const ret = useReturnOrder();
  const [reason, setReason] = useState("");
  const [showReturn, setShowReturn] = useState(false);

  if (isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!order) return <p className="text-sm text-red-600">Order not found.</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/orders" className="text-sm text-slate-500 hover:underline">
        ← All orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Order</h1>
          <p className="text-sm text-slate-500">
            {order.sellerName} · {order.paymentMethod} · payment {order.paymentStatus.toLowerCase()}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500">Items</h2>
          {order.items.map((i) => (
            <div key={i.id} className="flex gap-3">
              {i.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.image} alt="" className="h-14 w-14 rounded object-cover" />
              ) : (
                <div className="h-14 w-14 rounded bg-slate-100" />
              )}
              <div className="flex-1 text-sm">
                <Link href={`/product/${i.productSlug}`} className="font-medium hover:underline">
                  {i.productName}
                </Link>
                <div className="text-xs text-slate-500">
                  {i.variantLabel} · Qty {i.quantity}
                </div>
              </div>
              <div className="text-sm font-medium">{formatINR(i.totalPrice)}</div>
            </div>
          ))}
          <div className="flex justify-between border-t border-slate-100 pt-3 font-semibold">
            <span>Total</span>
            <span>{formatINR(order.totalAmount)}</span>
          </div>

          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <div className="text-xs text-slate-500">Deliver to</div>
            <div className="font-medium">{order.address.fullName}</div>
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
            {CANCELLABLE.includes(order.status) && (
              <Button
                variant="outline"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate({ id: order.id })}
              >
                {cancel.isPending ? "Cancelling…" : "Cancel order"}
              </Button>
            )}

            {order.status === "DELIVERED" && !showReturn && (
              <Button variant="outline" onClick={() => setShowReturn(true)}>
                Request return
              </Button>
            )}

            {showReturn && (
              <div className="space-y-2">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for return"
                  rows={3}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <Button
                  variant="outline"
                  disabled={ret.isPending || reason.trim().length < 3}
                  onClick={() => ret.mutate({ id: order.id, reason: reason.trim() }, { onSuccess: () => setShowReturn(false) })}
                >
                  {ret.isPending ? "Submitting…" : "Submit return request"}
                </Button>
              </div>
            )}

            {(cancel.isError || ret.isError) && (
              <p className="text-sm text-red-600">{((cancel.error || ret.error) as Error).message}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
