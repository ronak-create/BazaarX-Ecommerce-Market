import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, ProductStatus } from "@bazaarx/db";
import { getCurrentUser } from "@/lib/auth";
import { apiError, unauthorized } from "@/lib/api";
import type { WishlistItemDTO } from "@bazaarx/types";

/** GET /api/wishlist — the caller's saved products. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const rows = await prisma.wishlist.findMany({
    where: { userId: user.id, product: { deletedAt: null } },
    orderBy: { createdAt: "desc" },
    include: { product: { include: { images: true } } },
  });

  const data: WishlistItemDTO[] = rows.map((w) => ({
    productId: w.productId,
    name: w.product.name,
    slug: w.product.slug,
    basePrice: w.product.basePrice.toString(),
    discountedPrice: w.product.discountedPrice?.toString() ?? null,
    image: (w.product.images.find((i) => i.isPrimary) ?? w.product.images[0])?.url ?? null,
    avgRating: w.product.avgRating,
  }));
  return NextResponse.json(data);
}

const addSchema = z.object({ productId: z.string().min(1) });

/** POST /api/wishlist — save a product (idempotent). */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = addSchema.safeParse(json);
  if (!parsed.success) return apiError("VALIDATION", "productId is required", 422);

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, deletedAt: null, status: ProductStatus.ACTIVE },
  });
  if (!product) return apiError("UNAVAILABLE", "Product not available", 422);

  await prisma.wishlist.upsert({
    where: { userId_productId: { userId: user.id, productId: parsed.data.productId } },
    create: { userId: user.id, productId: parsed.data.productId },
    update: {},
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
