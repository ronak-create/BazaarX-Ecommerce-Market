import { z } from "zod";
import type { Prisma, Product, ProductImage, ProductVariant } from "@bazaarx/db";
import type { ProductDTO } from "@bazaarx/types";

const money = z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount");

export const variantSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1).max(80),
  attributes: z.record(z.string()).default({}),
  price: money,
  stock: z.coerce.number().int().min(0),
  sku: z.string().trim().min(1).max(64),
});

export const imageSchema = z.object({
  url: z.string().url(),
  altText: z.string().max(160).optional(),
  position: z.coerce.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
});

export const productInputSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(1).max(5000),
  basePrice: money,
  discountedPrice: money.nullish(),
  brand: z.string().trim().max(80).nullish(),
  tags: z.array(z.string().trim().min(1)).max(20).default([]),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).default("DRAFT"),
  variants: z.array(variantSchema).min(1, "Add at least one variant"),
  images: z.array(imageSchema).default([]),
});

export type ProductInputParsed = z.infer<typeof productInputSchema>;
export type VariantParsed = z.infer<typeof variantSchema>;
export type ImageParsed = z.infer<typeof imageSchema>;

type FullProduct = Product & { variants: ProductVariant[]; images: ProductImage[] };

/** Map a Prisma product (with relations) to the API DTO. */
export function toProductDTO(p: FullProduct): ProductDTO {
  return {
    id: p.id,
    categoryId: p.categoryId,
    name: p.name,
    slug: p.slug,
    description: p.description,
    basePrice: p.basePrice.toString(),
    discountedPrice: p.discountedPrice?.toString() ?? null,
    brand: p.brand,
    tags: p.tags,
    status: p.status,
    avgRating: p.avgRating,
    totalReviews: p.totalReviews,
    variants: p.variants.map((v) => ({
      id: v.id,
      label: v.label,
      attributes: (v.attributes as Record<string, string>) ?? {},
      price: v.price.toString(),
      stock: v.stock,
      sku: v.sku,
    })),
    images: p.images
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((i) => ({
        id: i.id,
        url: i.url,
        altText: i.altText,
        position: i.position,
        isPrimary: i.isPrimary,
      })),
    createdAt: p.createdAt.toISOString(),
  };
}

/** Build the nested create payload for variants/images. */
export function nestedCreate(input: {
  variants?: VariantParsed[];
  images?: ImageParsed[];
}): {
  variants: Prisma.ProductVariantCreateWithoutProductInput[];
  images: Prisma.ProductImageCreateWithoutProductInput[];
} {
  return {
    variants: (input.variants ?? []).map((v) => ({
      label: v.label,
      attributes: v.attributes,
      price: v.price,
      stock: v.stock,
      sku: v.sku,
    })),
    images: (input.images ?? []).map((i) => ({
      url: i.url,
      altText: i.altText,
      position: i.position,
      isPrimary: i.isPrimary,
    })),
  };
}
