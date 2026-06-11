import { NextResponse } from "next/server";
import { prisma } from "@bazaarx/db";
import { authorizeReseller } from "@/lib/auth";
import { forbidden, unauthorized } from "@/lib/api";
import type { ResellerDashboardDTO } from "@bazaarx/types";

/** GET /api/reseller/dashboard — earnings and activity summary. */
export async function GET() {
  const auth = await authorizeReseller();
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden("Become a reseller first");

  const [linkCount, agg] = await Promise.all([
    prisma.resellerLink.count({ where: { resellerId: auth.reseller.id } }),
    prisma.resellerLink.aggregate({
      where: { resellerId: auth.reseller.id },
      _sum: { conversions: true },
    }),
  ]);

  const body: ResellerDashboardDTO = {
    totalEarnings: auth.reseller.totalEarnings.toString(),
    pendingEarnings: auth.reseller.pendingEarnings.toString(),
    linkCount,
    totalConversions: agg._sum.conversions ?? 0,
  };
  return NextResponse.json(body);
}
