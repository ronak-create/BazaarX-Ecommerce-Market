"use client";

import { InlineLoader } from "@/components/loading-screen";

import { formatINR, formatDateTime } from "@bazaarx/utils";
import { useResellerEarnings } from "@/hooks/use-reseller";

export function EarningsList() {
  const { data, isLoading } = useResellerEarnings();
  if (isLoading) return <InlineLoader />;
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No commissions yet.
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
          <th className="py-2">Product</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {data.map((c) => (
          <tr key={c.id} className="border-b border-slate-100">
            <td className="py-2">{c.productName}</td>
            <td className="text-slate-500">{formatDateTime(c.createdAt)}</td>
            <td className="font-medium">{formatINR(c.amount)}</td>
            <td>
              <span
                className={`rounded px-2 py-0.5 text-xs ${
                  c.status === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {c.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
