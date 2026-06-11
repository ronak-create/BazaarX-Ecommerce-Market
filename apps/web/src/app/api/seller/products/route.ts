import { NextResponse } from "next/server";
import { prisma, type Prisma, ProductStatus } from "@bazaarx/db";
import { authorizeApprovedSeller } from "@/lib/auth";
import { forbidden, unauthorized } from "@/lib/api";
import type { Paginated, ProductCard } from "@bazaarx/types";

/** GET /api/seller/products — the caller's own products, including drafts. */
export async function GET(req: Request) {
  const auth = await authorizeApprovedSeller();
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden("Approved seller account required");

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam && statusParam in ProductStatus ? (statusParam as ProductStatus) : undefined;

  const where: Prisma.ProductWhereInput = {
    sellerId: auth.seller.id,
    deletedAt: null,
    ...(status ? { status } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
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
