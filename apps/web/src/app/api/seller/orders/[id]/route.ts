import { NextResponse } from "next/server";
import { prisma } from "@bazaarx/db";
import { authorizeApprovedSeller } from "@/lib/auth";
import { forbidden, notFound, unauthorized } from "@/lib/api";
import { toOrderDetail, orderInclude } from "@/lib/orders";

/** GET /api/seller/orders/:id — detail for one of the caller's store orders. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await authorizeApprovedSeller();
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  const order = await prisma.order.findFirst({
    where: { id: params.id, sellerId: auth.seller.id, deletedAt: null },
    include: orderInclude,
  });
  if (!order) return notFound("Order not found");
  return NextResponse.json(toOrderDetail(order));
}
