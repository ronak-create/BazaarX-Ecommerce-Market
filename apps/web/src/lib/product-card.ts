import type { Product, ProductImage } from "@bazaarx/db";
import type { ProductCard } from "@bazaarx/types";

type WithCardRelations = Product & {
  images: ProductImage[];
  variants: { stock: number }[];
};

/** Map a Prisma product (with images + variant stock) to the listing card DTO. */
export function toProductCard(p: WithCardRelations): ProductCard {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    basePrice: p.basePrice.toString(),
    discountedPrice: p.discountedPrice?.toString() ?? null,
    status: p.status,
    primaryImage: (p.images.find((i) => i.isPrimary) ?? p.images[0])?.url ?? null,
    totalStock: p.variants.reduce((s, v) => s + v.stock, 0),
    avgRating: p.avgRating,
  };
}
