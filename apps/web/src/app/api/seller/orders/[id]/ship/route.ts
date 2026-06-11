import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, OrderStatus } from "@bazaarx/db";
import { authorizeApprovedSeller } from "@/lib/auth";
import { apiError, forbidden, notFound, unauthorized } from "@/lib/api";
import { addTracking, sellerCanTransition, toOrderDetail, orderInclude } from "@/lib/orders";
import { notify } from "@/lib/notify";

const bodySchema = z.object({
  trackingNumber: z.string().trim().min(1).max(80),
  carrier: z.string().trim().min(1).max(60),
});

/** POST /api/seller/orders/:id/ship — PLACED/CONFIRMED -> SHIPPED with tracking. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await authorizeApprovedSeller();
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiError("VALIDATION", "Tracking number and carrier are required", 422);

  const order = await prisma.order.findFirst({
    where: { id: params.id, sellerId: auth.seller.id, deletedAt: null },
  });
  if (!order) return notFound("Order not found");
  if (!sellerCanTransition(order.status, OrderStatus.SHIPPED)) {
    return apiError("INVALID_STATE", "Order cannot be shipped from its current state", 409);
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.SHIPPED } });
    await addTracking(tx, order.id, "SHIPPED", {
      message: "Shipped",
      trackingNumber: parsed.data.trackingNumber,
      carrier: parsed.data.carrier,
    });
    await notify({
      tx,
      userId: order.buyerId,
      type: "ORDER_SHIPPED",
      title: "Order shipped",
      body: `Your order shipped via ${parsed.data.carrier} (${parsed.data.trackingNumber}).`,
      data: { orderId: order.id },
    });
  });

  const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
  return NextResponse.json(toOrderDetail(updated));
}
