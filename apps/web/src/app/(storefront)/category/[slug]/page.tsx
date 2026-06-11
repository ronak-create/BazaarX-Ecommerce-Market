import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listProducts, categorySubtreeIds, type ListSort } from "@/lib/list-products";
import { ListingResults } from "@/components/storefront/listing-results";

export const dynamic = "force-dynamic";

const num = (v?: string) => (v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : undefined);

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Record<string, string | undefined>;
}) {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const categoryIds = await categorySubtreeIds(category.id);
  const result = await listProducts({
    categoryIds,
    q: searchParams.q,
    minPrice: num(searchParams.minPrice),
    maxPrice: num(searchParams.maxPrice),
    minRating: num(searchParams.minRating),
    sort: (searchParams.sort as ListSort) || undefined,
    page: num(searchParams.page),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{category.name}</h1>
      <ListingResults result={result} basePath={`/category/${params.slug}`} query={searchParams} />
    </div>
  );
}
