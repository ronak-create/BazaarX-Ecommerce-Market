"use client";

import { useState } from "react";
import Link from "next/link";
import { Receipt } from "@phosphor-icons/react";
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
            className={`rounded-full px-3.5 py-1.5 font-medium capitalize transition-colors ${
              status === f ? "bg-brand text-brand-fg" : "bg-ink-100 text-ink-600 hover:bg-ink-200"
            }`}
          >
            {f ? f.replace(/_/g, " ").toLowerCase() : "all"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : (data?.data.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-white p-12 text-center">
          <Receipt size={28} className="mx-auto text-ink-300" />
          <p className="mt-3 text-sm text-ink-500">No orders.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data!.data.map((o) => (
            <Link
              key={o.id}
              href={`/seller/orders/${o.id}`}
              className="flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
            >
              {o.primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.primaryImage} alt="" className="h-12 w-12 rounded-xl border border-ink-200 object-cover" />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-ink-100 text-ink-300">
                  <Receipt size={20} />
                </div>
              )}
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-medium text-ink-900">{o.buyerName ?? "Buyer"}</div>
                <div className="text-xs text-ink-500">
                  {o.itemCount} item{o.itemCount > 1 ? "s" : ""} · {formatDateTime(o.createdAt)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold tabular-nums text-ink-900">{formatINR(o.totalAmount)}</div>
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
