import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@bazaarx/db";
import { getCurrentUser } from "@/lib/auth";
import { loadCart } from "@/lib/cart";
import { apiError, forbidden, notFound, unauthorized } from "@/lib/api";

const patchSchema = z.object({ quantity: z.coerce.number().int().min(1).max(99) });

/** Confirm the cart item belongs to the caller; returns it with its variant. */
async function ownItem(userId: string, itemId: string) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, variant: true },
  });
  if (!item) return { error: "notfound" as const };
  if (item.cart.userId !== userId) return { error: "forbidden" as const };
  return { item };
}

/** PATCH /api/cart/items/:id — set quantity. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return apiError("VALIDATION", "quantity must be 1–99", 422);

  const owned = await ownItem(user.id, params.id);
  if ("error" in owned) return owned.error === "notfound" ? notFound("Item not found") : forbidden();
  if (parsed.data.quantity > owned.item.variant.stock) {
    return apiError("OUT_OF_STOCK", "Not enough stock", 409);
  }

  await prisma.cartItem.update({
    where: { id: params.id },
    data: { quantity: parsed.data.quantity },
  });
  return NextResponse.json(await loadCart(user.id));
}

/** DELETE /api/cart/items/:id — remove an item. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const owned = await ownItem(user.id, params.id);
  if ("error" in owned) return owned.error === "notfound" ? notFound("Item not found") : forbidden();

  await prisma.cartItem.delete({ where: { id: params.id } });
  return NextResponse.json(await loadCart(user.id));
}
