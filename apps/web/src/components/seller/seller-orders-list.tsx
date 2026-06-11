"use client";

import { useState } from "react";
import Link from "next/link";
import { formatINR, formatDateTime } from "@bazaarx/utils";
import { useSellerOrders } from "@/hooks/use-seller-orders";
import { StatusBadge } from "@/components/orders/status-badge";

const FILTERS = ["", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "RETURN_REQUESTED"];

export function SellerOrdersList() {
  const [status, setStatus] = useState("");
  const { data, isLoading } = useSellerOrders(status || undefined);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-sm">
        {FILTERS.map((f) => (
          <button
            key={f || "all"}
            onClick={() => setStatus(f)}
            className={`rounded-full px-3 py-1 ${
              status === f ? "bg-brand text-brand-fg" : "bg-slate-100 text-slate-600"
            }`}
          >
            {f ? f.replace(/_/g, " ").toLowerCase() : "all"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (data?.data.length ?? 0) === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No orders.
        </div>
      ) : (
        <div className="space-y-3">
          {data!.data.map((o) => (
            <Link
              key={o.id}
              href={`/seller/orders/${o.id}`}
              className="flex items-center gap-4 rounded-lg border border-slate-200 p-4 hover:shadow-sm"
            >
              {o.primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.primaryImage} alt="" className="h-12 w-12 rounded object-cover" />
              ) : (
                <div className="h-12 w-12 rounded bg-slate-100" />
              )}
              <div className="flex-1 text-sm">
                <div className="font-medium">{o.buyerName ?? "Buyer"}</div>
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
      )}
    </div>
  );
}
