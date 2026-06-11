import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, ProductStatus } from "@bazaarx/db";
import { getCurrentUser } from "@/lib/auth";
import { loadCart } from "@/lib/cart";
import { apiError, unauthorized } from "@/lib/api";

/** GET /api/cart — the caller's cart, grouped by seller. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return NextResponse.json(await loadCart(user.id));
}

const addSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

/** POST /api/cart — add an item (or increment if the variant is already in the cart). */
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
  if (!parsed.success) return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid", 422);
  const { productId, variantId, quantity } = parsed.data;

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
    include: { product: true },
  });
  if (!variant || variant.product.deletedAt || variant.product.status !== ProductStatus.ACTIVE) {
    return apiError("UNAVAILABLE", "Product is not available", 422);
  }
  if (variant.stock < quantity) return apiError("OUT_OF_STOCK", "Not enough stock", 409);

  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });

  const nextQty = (existing?.quantity ?? 0) + quantity;
  if (nextQty > variant.stock) return apiError("OUT_OF_STOCK", "Not enough stock", 409);

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, productId, variantId, quantity },
    update: { quantity: nextQty },
  });

  return NextResponse.json(await loadCart(user.id), { status: 201 });
}
