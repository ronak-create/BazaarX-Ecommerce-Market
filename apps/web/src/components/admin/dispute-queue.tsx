"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@bazaarx/ui";
import { formatINR, formatDateTime } from "@bazaarx/utils";
import type { DisputeDTO } from "@bazaarx/types";

const KEY = ["admin", "disputes"] as const;

function DisputeCard({ d }: { d: DisputeDTO }) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const resolve = useMutation({
    mutationFn: async (resolution: "REFUND" | "REJECT") => {
      const res = await fetch(`/api/admin/disputes/${d.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution, adminNote: note.trim() || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message ?? "Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">{d.reason}</div>
          <div className="text-sm text-slate-600">{d.description}</div>
          <div className="mt-1 text-xs text-slate-400">
            {d.raisedByName ?? "Buyer"} · order {formatINR(d.orderTotal)} ·{" "}
            <Link href={`/orders/${d.orderId}`} className="hover:underline">view order</Link> ·{" "}
            {formatDateTime(d.createdAt)}
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Resolution note (optional)"
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <div className="flex gap-2">
          <Button disabled={resolve.isPending} onClick={() => resolve.mutate("REFUND")}>
            Refund buyer
          </Button>
          <Button variant="outline" disabled={resolve.isPending} onClick={() => resolve.mutate("REJECT")}>
            Reject
          </Button>
        </div>
        {resolve.isError && <p className="text-sm text-red-600">{(resolve.error as Error).message}</p>}
      </div>
    </div>
  );
}

export function DisputeQueue() {
  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<DisputeDTO[]> => {
      const res = await fetch("/api/admin/disputes", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No open disputes.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((d) => (
        <DisputeCard key={d.id} d={d} />
      ))}
    </div>
  );
}
