import { NextResponse } from "next/server";
import { prisma } from "@bazaarx/db";
import { getCurrentUser } from "@/lib/auth";
import { notFound, unauthorized } from "@/lib/api";
import { toOrderDetail, orderInclude } from "@/lib/orders";

/** GET /api/orders/:id — buyer's own order detail. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const order = await prisma.order.findFirst({
    where: { id: params.id, buyerId: user.id, deletedAt: null },
    include: orderInclude,
  });
  if (!order) return notFound("Order not found");
  return NextResponse.json(toOrderDetail(order));
}
