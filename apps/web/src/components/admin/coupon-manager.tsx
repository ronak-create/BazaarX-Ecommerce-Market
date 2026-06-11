"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@bazaarx/ui";
import { formatINR, formatDateTime } from "@bazaarx/utils";
import type { CouponDTO, CreateCouponInput } from "@bazaarx/types";

const KEY = ["admin", "coupons"] as const;

export function CouponManager() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<CouponDTO[]> => {
      const res = await fetch("/api/admin/coupons", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const create = useMutation({
    mutationFn: async (input: CreateCouponInput) => {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message ?? "Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      {
        code: code.trim(),
        discountType: type,
        discountValue: value.trim(),
        minOrderAmount: minOrder.trim() || undefined,
      },
      { onSuccess: () => { setCode(""); setValue(""); setMinOrder(""); } },
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section>
        <h2 className="mb-3 text-lg font-medium">New coupon</h2>
        <form onSubmit={submit} className="space-y-3">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODE" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm uppercase" />
          <div className="flex gap-2">
            <select value={type} onChange={(e) => setType(e.target.value as "PERCENTAGE" | "FIXED")} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="PERCENTAGE">% off</option>
              <option value="FIXED">₹ off</option>
            </select>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "PERCENTAGE" ? "10" : "100.00"} className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <input value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="Min order (optional)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {create.isError && <p className="text-sm text-red-600">{(create.error as Error).message}</p>}
          <Button type="submit" disabled={create.isPending || !code.trim() || !value.trim()}>
            {create.isPending ? "Creating…" : "Create coupon"}
          </Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Coupons</h2>
        {isLoading || !data ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-slate-500">No coupons yet.</p>
        ) : (
          <div className="space-y-2">
            {data.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
                <div>
                  <span className="font-medium">{c.code}</span>{" "}
                  <span className="text-slate-500">
                    {c.discountType === "PERCENTAGE" ? `${c.discountValue}% off` : `${formatINR(c.discountValue)} off`}
                    {Number(c.minOrderAmount) > 0 ? ` · min ${formatINR(c.minOrderAmount)}` : ""} · used {c.usedCount}
                  </span>
                </div>
                <button
                  onClick={() => toggle.mutate({ id: c.id, isActive: !c.isActive })}
                  className={`rounded px-2 py-1 text-xs ${c.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
                >
                  {c.isActive ? "Active" : "Inactive"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
