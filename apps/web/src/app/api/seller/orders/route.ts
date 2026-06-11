import { NextResponse } from "next/server";
import { prisma, type Prisma, OrderStatus } from "@bazaarx/db";
import { authorizeApprovedSeller } from "@/lib/auth";
import { forbidden, unauthorized } from "@/lib/api";
import { toOrderSummary, orderInclude } from "@/lib/orders";
import type { Paginated, OrderSummaryDTO } from "@bazaarx/types";

/** GET /api/seller/orders?status= — orders for the caller's store. */
export async function GET(req: Request) {
  const auth = await authorizeApprovedSeller();
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden("Approved seller account required");

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam && statusParam in OrderStatus ? (statusParam as OrderStatus) : undefined;

  const where: Prisma.OrderWhereInput = {
    sellerId: auth.seller.id,
    deletedAt: null,
    ...(status ? { status } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: orderInclude,
    }),
    prisma.order.count({ where }),
  ]);

  const body: Paginated<OrderSummaryDTO> = {
    data: rows.map(toOrderSummary),
    page,
    limit,
    total,
  };
  return NextResponse.json(body);
}
