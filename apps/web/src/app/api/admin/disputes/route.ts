import { NextResponse } from "next/server";
import { prisma, UserRole, DisputeStatus } from "@bazaarx/db";
import { authorizeApi } from "@/lib/auth";
import { forbidden, unauthorized } from "@/lib/api";
import type { DisputeDTO } from "@bazaarx/types";

/** GET /api/admin/disputes?status= — dispute queue (defaults to OPEN). */
export async function GET(req: Request) {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam && statusParam in DisputeStatus ? (statusParam as DisputeStatus) : DisputeStatus.OPEN;

  const disputes = await prisma.dispute.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
    include: {
      raisedBy: { select: { name: true } },
      order: { select: { totalAmount: true } },
    },
  });

  const data: DisputeDTO[] = disputes.map((d) => ({
    id: d.id,
    orderId: d.orderId,
    reason: d.reason,
    description: d.description,
    status: d.status,
    adminNote: d.adminNote,
    raisedByName: d.raisedBy.name,
    orderTotal: d.order.totalAmount.toString(),
    createdAt: d.createdAt.toISOString(),
  }));
  return NextResponse.json(data);
}
