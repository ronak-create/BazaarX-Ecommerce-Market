import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, OrderStatus, DisputeStatus } from "@bazaarx/db";
import { getCurrentUser } from "@/lib/auth";
import { apiError, notFound, unauthorized } from "@/lib/api";

const ELIGIBLE: OrderStatus[] = [
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.RETURN_REQUESTED,
  OrderStatus.RETURNED,
];

const bodySchema = z.object({
  reason: z.string().trim().min(3).max(120),
  description: z.string().trim().min(5).max(1000),
});

/** POST /api/orders/:id/dispute — buyer raises a dispute on a fulfilled order. */
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
  if (!parsed.success) return apiError("VALIDATION", "Reason and description are required", 422);

  const order = await prisma.order.findFirst({
    where: { id: params.id, buyerId: user.id, deletedAt: null },
    include: { dispute: true },
  });
  if (!order) return notFound("Order not found");
  if (!ELIGIBLE.includes(order.status)) {
    return apiError("NOT_ELIGIBLE", "This order is not eligible for a dispute", 409);
  }
  if (order.dispute) return apiError("DUPLICATE", "A dispute already exists for this order", 409);

  await prisma.dispute.create({
    data: {
      orderId: order.id,
      raisedById: user.id,
      reason: parsed.data.reason,
      description: parsed.data.description,
      evidence: [],
      status: DisputeStatus.OPEN,
    },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
