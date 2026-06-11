import { NextResponse } from "next/server";
import { prisma, ProductStatus, type Prisma } from "@bazaarx/db";
import { slugify } from "@bazaarx/utils";
import { authorizeApprovedSeller } from "@/lib/auth";
import { apiError, forbidden, unauthorized, validationError } from "@/lib/api";
import { productInputSchema, nestedCreate, toProductDTO } from "@/lib/product-schema";
import type { Paginated, ProductCard } from "@bazaarx/types";

/** Generate a product slug unique across the table. */
async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "product";
  let slug = base;
  for (let i = 2; await prisma.product.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
}

/** GET /api/products — public listing of ACTIVE products. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const q = url.searchParams.get("q") || undefined;

  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE,
    deletedAt: null,
    ...(categoryId ? { categoryId } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { images: true, variants: { select: { stock: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  const data: ProductCard[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    basePrice: p.basePrice.toString(),
    discountedPrice: p.discountedPrice?.toString() ?? null,
    status: p.status,
    primaryImage: (p.images.find((i) => i.isPrimary) ?? p.images[0])?.url ?? null,
    totalStock: p.variants.reduce((s, v) => s + v.stock, 0),
    avgRating: p.avgRating,
  }));

  const body: Paginated<ProductCard> = { data, page, limit, total };
  return NextResponse.json(body);
}

/** POST /api/products — create a product with variants and images (approved seller). */
export async function POST(req: Request) {
  const auth = await authorizeApprovedSeller();
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden("Approved seller account required");

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = productInputSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) return apiError("INVALID_CATEGORY", "Category not found", 422);

  const { variants, images } = nestedCreate(input);
  const slug = await uniqueSlug(input.name);

  try {
    const product = await prisma.product.create({
      data: {
        sellerId: auth.seller.id,
        categoryId: input.categoryId,
        name: input.name,
        slug,
        description: input.description,
        basePrice: input.basePrice,
        discountedPrice: input.discountedPrice ?? null,
        brand: input.brand ?? null,
        tags: input.tags,
        status: input.status as ProductStatus,
        variants: { create: variants },
        images: { create: images },
      },
      include: { variants: true, images: true },
    });
    return NextResponse.json(toProductDTO(product), { status: 201 });
  } catch (e) {
    if (e instanceof Object && "code" in e && (e as { code: string }).code === "P2002") {
      return apiError("DUPLICATE_SKU", "A variant SKU is already in use", 409);
    }
    throw e;
  }
}
