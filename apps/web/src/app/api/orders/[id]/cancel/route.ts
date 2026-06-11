import { NextResponse } from "next/server";
import { prisma, OrderStatus, PaymentStatus } from "@bazaarx/db";
import { getCurrentUser } from "@/lib/auth";
import { apiError, notFound, unauthorized } from "@/lib/api";
import { addTracking, toOrderDetail, orderInclude } from "@/lib/orders";
import { notify } from "@/lib/notify";
import { razorpay } from "@/lib/razorpay";

const CANCELLABLE: OrderStatus[] = [OrderStatus.PLACED, OrderStatus.CONFIRMED];

/** POST /api/orders/:id/cancel — buyer cancels before the order ships. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const order = await prisma.order.findFirst({
    where: { id: params.id, buyerId: user.id, deletedAt: null },
    include: { items: true, payment: true, seller: true },
  });
  if (!order) return notFound("Order not found");
  if (!CANCELLABLE.includes(order.status)) {
    return apiError("NOT_CANCELLABLE", "Order can no longer be cancelled", 409);
  }

  const refundPaymentId =
    order.payment?.status === PaymentStatus.PAID ? order.payment.razorpayPaymentId : null;

  await prisma.$transaction(async (tx) => {
    // Restock.
    for (const i of order.items) {
      await tx.productVariant.update({
        where: { id: i.variantId },
        data: { stock: { increment: i.quantity } },
      });
    }
    await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.CANCELLED } });
    await addTracking(tx, order.id, "CANCELLED", { message: "Cancelled by buyer" });

    if (order.payment && order.payment.status === PaymentStatus.PAID) {
      await tx.payment.update({
        where: { id: order.payment.id },
        data: { status: PaymentStatus.REFUNDED },
      });
    }

    // Void any pending reseller commission for this order.
    const commission = await tx.commission.findUnique({ where: { orderId: order.id } });
    if (commission && commission.status === "PENDING") {
      await tx.resellerProfile.update({
        where: { id: commission.resellerId },
        data: { pendingEarnings: { decrement: commission.amount } },
      });
      await tx.commission.delete({ where: { id: commission.id } });
    }

    await notify({
      tx,
      userId: order.seller.userId,
      type: "ORDER_CANCELLED",
      title: "Order cancelled",
      body: "A buyer cancelled an order.",
      data: { orderId: order.id },
    });
  });

  // Best-effort Razorpay refund (outside the DB tx).
  if (refundPaymentId) {
    try {
      await razorpay().payments.refund(refundPaymentId, {});
    } catch {
      // Refund can be retried from the admin/payouts tooling later.
    }
  }

  const updated = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: orderInclude,
  });
  return NextResponse.json(toOrderDetail(updated));
}
