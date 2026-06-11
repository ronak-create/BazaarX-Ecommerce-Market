import { NextResponse } from "next/server";
import { prisma, UserRole, PaymentStatus, type Prisma } from "@bazaarx/db";
import { authorizeApi } from "@/lib/auth";
import { forbidden, unauthorized } from "@/lib/api";
import { toMoney } from "@bazaarx/utils";
import type { AnalyticsDTO } from "@bazaarx/types";

const paidWhere: Prisma.OrderWhereInput = { deletedAt: null, payment: { status: PaymentStatus.PAID } };

/** GET /api/admin/analytics — platform KPIs, top sellers/products, 14-day revenue. */
export async function GET() {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const since14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [gmvAgg, paidOrders, totalOrders, activeBuyers, sellerGroups, productGroups, paidRecent] =
    await Promise.all([
      prisma.order.aggregate({ where: paidWhere, _sum: { totalAmount: true } }),
      prisma.order.count({ where: paidWhere }),
      prisma.order.count({ where: { deletedAt: null } }),
      prisma.order.findMany({
        where: { deletedAt: null, createdAt: { gte: since30 } },
        distinct: ["buyerId"],
        select: { buyerId: true },
      }),
      prisma.order.groupBy({
        by: ["sellerId"],
        where: paidWhere,
        _sum: { sellerAmount: true },
        orderBy: { _sum: { sellerAmount: "desc" } },
        take: 5,
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.order.findMany({
        where: { ...paidWhere, createdAt: { gte: since14 } },
        select: { totalAmount: true, createdAt: true },
      }),
    ]);

  const sellerNames = await prisma.sellerProfile.findMany({
    where: { id: { in: sellerGroups.map((s) => s.sellerId) } },
    select: { id: true, businessName: true },
  });
  const sellerName = new Map(sellerNames.map((s) => [s.id, s.businessName]));

  const productNames = await prisma.product.findMany({
    where: { id: { in: productGroups.map((p) => p.productId) } },
    select: { id: true, name: true },
  });
  const productName = new Map(productNames.map((p) => [p.id, p.name]));

  // Bucket revenue by day for the last 14 days.
  const buckets = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    buckets.set(d, 0);
  }
  for (const o of paidRecent) {
    const d = o.createdAt.toISOString().slice(0, 10);
    if (buckets.has(d)) buckets.set(d, toMoney(buckets.get(d)! + Number(o.totalAmount)));
  }

  const body: AnalyticsDTO = {
    gmv: (gmvAgg._sum.totalAmount ?? 0).toString(),
    paidOrders,
    totalOrders,
    activeBuyers: activeBuyers.length,
    topSellers: sellerGroups.map((s) => ({
      name: sellerName.get(s.sellerId) ?? "—",
      revenue: (s._sum.sellerAmount ?? 0).toString(),
    })),
    topProducts: productGroups.map((p) => ({
      name: productName.get(p.productId) ?? "—",
      units: p._sum.quantity ?? 0,
    })),
    revenueSeries: [...buckets.entries()].map(([date, revenue]) => ({
      date,
      revenue: revenue.toFixed(2),
    })),
  };
  return NextResponse.json(body);
}
