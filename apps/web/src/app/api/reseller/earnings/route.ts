import { NextResponse } from "next/server";
import { prisma } from "@bazaarx/db";
import { authorizeReseller } from "@/lib/auth";
import { forbidden, unauthorized } from "@/lib/api";
import type { CommissionDTO } from "@bazaarx/types";

/** GET /api/reseller/earnings — the caller's commissions. */
export async function GET() {
  const auth = await authorizeReseller();
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden("Become a reseller first");

  const commissions = await prisma.commission.findMany({
    where: { resellerId: auth.reseller.id },
    orderBy: { createdAt: "desc" },
    include: { resellerLink: { include: { product: { select: { name: true } } } } },
  });

  const data: CommissionDTO[] = commissions.map((c) => ({
    id: c.id,
    orderId: c.orderId,
    amount: c.amount.toString(),
    status: c.status,
    productName: c.resellerLink.product.name,
    createdAt: c.createdAt.toISOString(),
  }));
  return NextResponse.json(data);
}
