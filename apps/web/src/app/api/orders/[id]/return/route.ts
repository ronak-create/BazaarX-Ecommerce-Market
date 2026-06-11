import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, OrderStatus } from "@bazaarx/db";
import { isWithinReturnWindow } from "@bazaarx/utils";
import { getCurrentUser } from "@/lib/auth";
import { apiError, notFound, unauthorized } from "@/lib/api";
import { addTracking, toOrderDetail, orderInclude } from "@/lib/orders";
import { notify } from "@/lib/notify";

const bodySchema = z.object({ reason: z.string().trim().min(3).max(500) });

/** POST /api/orders/:id/return — buyer requests a return within the window. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiError("VALIDATION", "A reason is required", 422);

  const order = await prisma.order.findFirst({
    where: { id: params.id, buyerId: user.id, deletedAt: null },
    include: { tracking: true, seller: true },
  });
  if (!order) return notFound("Order not found");
  if (order.status !== OrderStatus.DELIVERED) {
    return apiError("NOT_RETURNABLE", "Only delivered orders can be returned", 409);
  }

  const deliveredAt = order.tracking.find((t) => t.status === OrderStatus.DELIVERED)?.timestamp;
  if (!deliveredAt || !isWithinReturnWindow(deliveredAt)) {
    return apiError("WINDOW_CLOSED", "The return window has closed", 409);
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.RETURN_REQUESTED },
    });
    await addTracking(tx, order.id, "RETURN_REQUESTED", { message: parsed.data.reason });
    await notify({
      tx,
      userId: order.seller.userId,
      type: "RETURN_REQUESTED",
      title: "Return requested",
      body: "A buyer requested a return.",
      data: { orderId: order.id },
    });
  });

  const updated = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: orderInclude,
  });
  return NextResponse.json(toOrderDetail(updated));
}
