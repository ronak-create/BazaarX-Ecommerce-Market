import Link from "next/link";
import { ProductCard } from "@/components/storefront/product-card";
import { FilterBar } from "@/components/storefront/filter-bar";
import type { Paginated, ProductCard as ProductCardData } from "@bazaarx/types";

function pageHref(basePath: string, query: Record<string, string | undefined>, page: number) {
  const sp = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v && k !== "page" && k !== "slug") sp.set(k, v);
  });
  sp.set("page", String(page));
  return `${basePath}?${sp.toString()}`;
}

export function ListingResults({
  result,
  basePath,
  query,
}: {
  result: Paginated<ProductCardData>;
  basePath: string;
  query: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  return (
    <div className="space-y-4">
      <FilterBar />

      <p className="text-sm text-slate-500">{result.total} products</p>

      {result.data.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          No products match these filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {result.data.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4 text-sm">
          {result.page > 1 && (
            <Link href={pageHref(basePath, query, result.page - 1)} className="rounded border px-3 py-1 hover:bg-slate-50">
              Previous
            </Link>
          )}
          <span className="text-slate-500">
            Page {result.page} of {totalPages}
          </span>
          {result.page < totalPages && (
            <Link href={pageHref(basePath, query, result.page + 1)} className="rounded border px-3 py-1 hover:bg-slate-50">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
