"use client";

import { InlineLoader } from "@/components/loading-screen";

import { formatINR } from "@bazaarx/utils";
import { useResellerDashboard } from "@/hooks/use-reseller";

export function ResellerDashboard() {
  const { data, isLoading } = useResellerDashboard();
  if (isLoading || !data) return <InlineLoader />;

  const cards = [
    { label: "Total earned", value: formatINR(data.totalEarnings) },
    { label: "Pending", value: formatINR(data.pendingEarnings) },
    { label: "Links", value: String(data.linkCount) },
    { label: "Conversions", value: String(data.totalConversions) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-slate-200 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">{c.label}</div>
          <div className="mt-1 text-xl font-semibold">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
