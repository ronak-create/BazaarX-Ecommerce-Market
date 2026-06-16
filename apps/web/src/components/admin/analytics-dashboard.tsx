"use client";

import { InlineLoader } from "@/components/loading-screen";

import { useQuery } from "@tanstack/react-query";
import { formatINR } from "@bazaarx/utils";
import type { AnalyticsDTO } from "@bazaarx/types";

export function AnalyticsDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: async (): Promise<AnalyticsDTO> => {
      const res = await fetch("/api/admin/analytics", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  if (isLoading || !data) return <InlineLoader />;

  const maxRev = Math.max(1, ...data.revenueSeries.map((p) => Number(p.revenue)));
  const cards = [
    { label: "GMV (paid)", value: formatINR(data.gmv) },
    { label: "Paid orders", value: String(data.paidOrders) },
    { label: "Total orders", value: String(data.totalOrders) },
    { label: "Active buyers (30d)", value: String(data.activeBuyers) },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-slate-200 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">{c.label}</div>
            <div className="mt-1 text-xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Revenue (last 14 days)</h2>
        <div className="flex h-40 items-end gap-1">
          {data.revenueSeries.map((p) => (
            <div key={p.date} className="flex flex-1 flex-col items-center gap-1" title={`${p.date}: ${formatINR(p.revenue)}`}>
              <div
                className="w-full rounded-t bg-brand"
                style={{ height: `${(Number(p.revenue) / maxRev) * 100}%`, minHeight: Number(p.revenue) > 0 ? 2 : 0 }}
              />
              <span className="text-[9px] text-slate-400">{p.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-medium">Top sellers</h2>
          {data.topSellers.length === 0 ? (
            <p className="text-sm text-slate-500">No sales yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.topSellers.map((s, i) => (
                <li key={i} className="flex justify-between border-b border-slate-100 py-1">
                  <span>{s.name}</span>
                  <span className="font-medium">{formatINR(s.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="mb-3 text-lg font-medium">Top products</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-slate-500">No sales yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.topProducts.map((p, i) => (
                <li key={i} className="flex justify-between border-b border-slate-100 py-1">
                  <span>{p.name}</span>
                  <span className="font-medium">{p.units} units</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
