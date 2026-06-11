"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@bazaarx/ui";
import type { CategoryFeeDTO } from "@bazaarx/types";

const KEY = ["admin", "commissions"] as const;

export function CommissionSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<CategoryFeeDTO[]> => {
      const res = await fetch("/api/admin/commissions", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const save = useMutation({
    mutationFn: async ({ categoryId, feePercent }: { categoryId: string; feePercent: number | null }) => {
      const res = await fetch("/api/admin/commissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, feePercent }),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const [edits, setEdits] = useState<Record<string, string>>({});

  if (isLoading || !data) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
          <th className="py-2">Category</th>
          <th>Effective fee</th>
          <th>Override %</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {data.map((c) => {
          const value = edits[c.id] ?? (c.commissionPercent != null ? String(c.commissionPercent) : "");
          return (
            <tr key={c.id} className="border-b border-slate-100">
              <td className="py-2" style={{ paddingLeft: `${(c.level - 1) * 16}px` }}>{c.name}</td>
              <td>{c.effectivePercent}%</td>
              <td>
                <input
                  value={value}
                  placeholder="default"
                  onChange={(e) => setEdits((s) => ({ ...s, [c.id]: e.target.value }))}
                  className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                />
              </td>
              <td className="text-right">
                <Button
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  disabled={save.isPending}
                  onClick={() =>
                    save.mutate({
                      categoryId: c.id,
                      feePercent: value.trim() === "" ? null : Number(value),
                    })
                  }
                >
                  Save
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
