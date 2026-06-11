import { NextResponse } from "next/server";
import { prisma, OrderStatus } from "@bazaarx/db";
import { authorizeApprovedSeller } from "@/lib/auth";
import { apiError, forbidden, notFound, unauthorized } from "@/lib/api";
import { addTracking, toOrderDetail, orderInclude } from "@/lib/orders";
import { notify } from "@/lib/notify";

/** POST /api/seller/orders/:id/confirm — PLACED -> CONFIRMED. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await authorizeApprovedSeller();
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  const order = await prisma.order.findFirst({
    where: { id: params.id, sellerId: auth.seller.id, deletedAt: null },
  });
  if (!order) return notFound("Order not found");
  if (order.status !== OrderStatus.PLACED) {
    return apiError("INVALID_STATE", "Only placed orders can be confirmed", 409);
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.CONFIRMED } });
    await addTracking(tx, order.id, "CONFIRMED", { message: "Order confirmed by seller" });
    await notify({
      tx,
      userId: order.buyerId,
      type: "ORDER_CONFIRMED",
      title: "Order confirmed",
      body: "Your order has been confirmed and is being prepared.",
      data: { orderId: order.id },
    });
  });

  const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
  return NextResponse.json(toOrderDetail(updated));
}
