import { listProducts, type ListSort } from "@/lib/list-products";
import { ListingResults } from "@/components/storefront/listing-results";

export const dynamic = "force-dynamic";

const num = (v?: string) => (v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : undefined);

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const result = await listProducts({
    q: searchParams.q,
    minPrice: num(searchParams.minPrice),
    maxPrice: num(searchParams.maxPrice),
    minRating: num(searchParams.minRating),
    sort: (searchParams.sort as ListSort) || undefined,
    page: num(searchParams.page),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">
        {searchParams.q ? `Results for “${searchParams.q}”` : "All products"}
      </h1>
      <ListingResults result={result} basePath="/search" query={searchParams} />
    </div>
  );
}
