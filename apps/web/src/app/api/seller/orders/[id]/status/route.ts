import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, OrderStatus, PaymentMethod, PaymentStatus } from "@bazaarx/db";
import { authorizeApprovedSeller } from "@/lib/auth";
import { apiError, forbidden, notFound, unauthorized } from "@/lib/api";
import { addTracking, sellerCanTransition, toOrderDetail, orderInclude } from "@/lib/orders";
import { notify } from "@/lib/notify";

const bodySchema = z.object({
  status: z.enum(["OUT_FOR_DELIVERY", "DELIVERED", "RETURNED"]),
  message: z.string().trim().max(200).optional(),
});

const BUYER_MESSAGE: Record<string, { title: string; body: string }> = {
  OUT_FOR_DELIVERY: { title: "Out for delivery", body: "Your order is out for delivery." },
  DELIVERED: { title: "Delivered", body: "Your order has been delivered." },
  RETURNED: { title: "Return completed", body: "Your return has been processed." },
};

/** POST /api/seller/orders/:id/status — advance OUT_FOR_DELIVERY / DELIVERED / RETURNED. */
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
  if (!parsed.success) return apiError("VALIDATION", "Invalid status", 422);
  const to = parsed.data.status as OrderStatus;

  const order = await prisma.order.findFirst({
    where: { id: params.id, sellerId: auth.seller.id, deletedAt: null },
    include: { items: true, payment: true },
  });
  if (!order) return notFound("Order not found");
  if (!sellerCanTransition(order.status, to)) {
    return apiError("INVALID_STATE", `Cannot move from ${order.status} to ${to}`, 409);
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: to } });
    await addTracking(tx, order.id, parsed.data.status, { message: parsed.data.message });

    // COD is collected on delivery.
    if (
      to === OrderStatus.DELIVERED &&
      order.paymentMethod === PaymentMethod.COD &&
      order.payment &&
      order.payment.status === PaymentStatus.PENDING
    ) {
      await tx.payment.update({
        where: { id: order.payment.id },
        data: { status: PaymentStatus.PAID, paidAt: new Date() },
      });
    }

    // A completed return restocks and refunds.
    if (to === OrderStatus.RETURNED) {
      for (const i of order.items) {
        await tx.productVariant.update({
          where: { id: i.variantId },
          data: { stock: { increment: i.quantity } },
        });
      }
      if (order.payment && order.payment.status === PaymentStatus.PAID) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: PaymentStatus.REFUNDED },
        });
      }
    }

    const msg = BUYER_MESSAGE[parsed.data.status]!;
    await notify({
      tx,
      userId: order.buyerId,
      type: `ORDER_${parsed.data.status}`,
      title: msg.title,
      body: msg.body,
      data: { orderId: order.id },
    });
  });

  const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
  return NextResponse.json(toOrderDetail(updated));
}
