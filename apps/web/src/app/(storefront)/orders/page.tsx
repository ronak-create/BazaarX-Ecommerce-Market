"use client";

import Link from "next/link";
import { formatINR, formatDateTime } from "@bazaarx/utils";
import { useOrders } from "@/hooks/use-orders";
import { StatusBadge } from "@/components/orders/status-badge";

export default function OrdersPage() {
  const { data, isLoading, isError } = useOrders();

  if (isLoading) return <p className="text-sm text-slate-500">Loading orders…</p>;
  if (isError) return <p className="text-sm text-red-600">Failed to load orders.</p>;

  const orders = data?.data ?? [];
  if (orders.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        You haven&apos;t placed any orders yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Your orders</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/orders/${o.id}`}
            className="flex items-center gap-4 rounded-lg border border-slate-200 p-4 hover:shadow-sm"
          >
            {o.primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.primaryImage} alt="" className="h-14 w-14 rounded object-cover" />
            ) : (
              <div className="h-14 w-14 rounded bg-slate-100" />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium">{o.sellerName}</div>
              <div className="text-xs text-slate-500">
                {o.itemCount} item{o.itemCount > 1 ? "s" : ""} · {formatDateTime(o.createdAt)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{formatINR(o.totalAmount)}</div>
              <div className="mt-1">
                <StatusBadge status={o.status} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
