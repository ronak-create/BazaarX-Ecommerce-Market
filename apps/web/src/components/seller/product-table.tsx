"use client";

import Link from "next/link";
import { PencilSimple, Trash, Package } from "@phosphor-icons/react";
import { formatINR } from "@bazaarx/utils";
import { useSellerProducts, useDeleteProduct } from "@/hooks/use-products";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-ink-100 text-ink-600",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  PAUSED: "bg-amber-50 text-amber-700",
  REMOVED: "bg-accent/10 text-accent",
};

export function ProductTable() {
  const { data, isLoading, isError, error } = useSellerProducts();
  const del = useDeleteProduct();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-16 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (isError) return <p className="text-sm font-medium text-accent">{(error as Error).message}</p>;

  const rows = data?.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-300 bg-white p-12 text-center">
        <Package size={28} className="mx-auto text-ink-300" />
        <p className="mt-3 text-sm text-ink-500">No products yet. Create your first one.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
            <th className="px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Stock</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-b border-ink-100 last:border-b-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {p.primaryImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.primaryImage} alt="" className="h-11 w-11 rounded-lg border border-ink-200 object-cover" />
                  ) : (
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-ink-100 text-ink-300">
                      <Package size={18} />
                    </div>
                  )}
                  <span className="font-medium text-ink-900">{p.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 tabular-nums text-ink-700">{formatINR(p.discountedPrice ?? p.basePrice)}</td>
              <td className="px-4 py-3 tabular-nums text-ink-700">{p.totalStock}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status] ?? "bg-ink-100 text-ink-600"}`}>
                  {p.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Link
                    href={`/seller/products/${p.id}`}
                    aria-label="Edit"
                    className="grid h-9 w-9 place-items-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 hover:text-brand-700"
                  >
                    <PencilSimple size={16} />
                  </Link>
                  <button
                    aria-label="Delete"
                    className="grid h-9 w-9 place-items-center rounded-full text-ink-400 transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-40"
                    disabled={del.isPending}
                    onClick={() => del.mutate(p.id)}
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
