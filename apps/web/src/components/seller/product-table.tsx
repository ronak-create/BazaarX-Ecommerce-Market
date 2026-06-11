"use client";

import Link from "next/link";
import { Button } from "@bazaarx/ui";
import { formatINR } from "@bazaarx/utils";
import { useSellerProducts, useDeleteProduct } from "@/hooks/use-products";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-amber-100 text-amber-700",
  REMOVED: "bg-red-100 text-red-700",
};

export function ProductTable() {
  const { data, isLoading, isError, error } = useSellerProducts();
  const del = useDeleteProduct();

  if (isLoading) return <p className="text-sm text-slate-500">Loading products…</p>;
  if (isError) return <p className="text-sm text-red-600">{(error as Error).message}</p>;

  const rows = data?.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No products yet. Create your first one.
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
          <th className="py-2">Product</th>
          <th>Price</th>
          <th>Stock</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id} className="border-b border-slate-100">
            <td className="flex items-center gap-3 py-2">
              {p.primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.primaryImage} alt="" className="h-10 w-10 rounded object-cover" />
              ) : (
                <div className="h-10 w-10 rounded bg-slate-100" />
              )}
              <span className="font-medium">{p.name}</span>
            </td>
            <td>{formatINR(p.discountedPrice ?? p.basePrice)}</td>
            <td>{p.totalStock}</td>
            <td>
              <span className={`rounded px-2 py-0.5 text-xs ${STATUS_STYLE[p.status] ?? ""}`}>
                {p.status}
              </span>
            </td>
            <td className="text-right">
              <div className="flex justify-end gap-2">
                <Link href={`/seller/products/${p.id}`}>
                  <Button variant="ghost" className="h-8 px-2 text-xs">
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="h-8 px-2 text-xs text-red-500"
                  disabled={del.isPending}
                  onClick={() => del.mutate(p.id)}
                >
                  Delete
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
