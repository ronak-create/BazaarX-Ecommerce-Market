import { prisma, ProductStatus, type Prisma } from "@bazaarx/db";
import { toProductCard } from "@/lib/product-card";
import type { Paginated, ProductCard } from "@bazaarx/types";

export type ListSort = "relevance" | "newest" | "price_asc" | "price_desc" | "rating";

export interface ListParams {
  q?: string;
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: ListSort;
  page?: number;
  limit?: number;
}

const ORDER: Record<ListSort, Prisma.ProductOrderByWithRelationInput> = {
  relevance: { createdAt: "desc" },
  newest: { createdAt: "desc" },
  price_asc: { basePrice: "asc" },
  price_desc: { basePrice: "desc" },
  rating: { avgRating: "desc" },
};

/** Shared public product query for the search and category listings. */
export async function listProducts(params: ListParams): Promise<Paginated<ProductCard>> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(60, Math.max(1, params.limit ?? 24));

  const price: Prisma.DecimalFilter = {};
  if (params.minPrice != null) price.gte = params.minPrice;
  if (params.maxPrice != null) price.lte = params.maxPrice;

  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE,
    deletedAt: null,
    ...(params.categoryIds?.length ? { categoryId: { in: params.categoryIds } } : {}),
    ...(params.q ? { name: { contains: params.q, mode: "insensitive" } } : {}),
    ...(Object.keys(price).length ? { basePrice: price } : {}),
    ...(params.minRating != null ? { avgRating: { gte: params.minRating } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: ORDER[params.sort ?? "relevance"],
      skip: (page - 1) * limit,
      take: limit,
      include: { images: true, variants: { select: { stock: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return { data: rows.map(toProductCard), page, limit, total };
}

/** A category plus all its descendant ids (for scoping listings to a subtree). */
export async function categorySubtreeIds(rootId: string): Promise<string[]> {
  const all = await prisma.category.findMany({ select: { id: true, parentId: true } });
  const childrenOf = new Map<string, string[]>();
  all.forEach((c) => {
    if (c.parentId) {
      const arr = childrenOf.get(c.parentId) ?? [];
      arr.push(c.id);
      childrenOf.set(c.parentId, arr);
    }
  });
  const ids: string[] = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    ids.push(id);
    stack.push(...(childrenOf.get(id) ?? []));
  }
  return ids;
}
