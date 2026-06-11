import type { Prisma } from "@bazaarx/db";

/** Recompute and persist a product's denormalised rating from its reviews. */
export async function recomputeProductRating(
  db: Prisma.TransactionClient,
  productId: string,
): Promise<void> {
  const agg = await db.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: true,
  });
  await db.product.update({
    where: { id: productId },
    data: {
      avgRating: agg._avg.rating ?? 0,
      totalReviews: agg._count,
    },
  });
}
