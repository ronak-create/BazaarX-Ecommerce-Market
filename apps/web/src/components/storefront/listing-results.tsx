import Link from "next/link";
import { CaretLeft, CaretRight, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
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

const pageBtn =
  "inline-flex items-center gap-1.5 rounded-full border border-ink-300 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-ink-400 hover:bg-ink-50";

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
    <div className="space-y-5">
      <FilterBar />

      <p className="text-sm text-ink-500">
        <span className="font-semibold text-ink-700 tabular-nums">{result.total}</span> products
      </p>

      {result.data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-white p-12 text-center">
          <MagnifyingGlass size={28} className="mx-auto text-ink-300" />
          <p className="mt-3 text-sm text-ink-500">No products match these filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {result.data.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4 text-sm">
          {result.page > 1 ? (
            <Link href={pageHref(basePath, query, result.page - 1)} className={pageBtn}>
              <CaretLeft size={14} weight="bold" /> Previous
            </Link>
          ) : (
            <span className={`${pageBtn} cursor-not-allowed opacity-40`}>
              <CaretLeft size={14} weight="bold" /> Previous
            </span>
          )}
          <span className="text-ink-500 tabular-nums">
            Page {result.page} of {totalPages}
          </span>
          {result.page < totalPages ? (
            <Link href={pageHref(basePath, query, result.page + 1)} className={pageBtn}>
              Next <CaretRight size={14} weight="bold" />
            </Link>
          ) : (
            <span className={`${pageBtn} cursor-not-allowed opacity-40`}>
              Next <CaretRight size={14} weight="bold" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
