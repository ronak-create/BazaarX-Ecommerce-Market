import Link from "next/link";
import { prisma, OrderStatus, ProductStatus } from "@bazaarx/db";
import { formatINR, formatDateTime } from "@bazaarx/utils";
import { requireApprovedSellerPage } from "@/lib/auth";
import { toOrderSummary, orderInclude } from "@/lib/orders";
import { StatusBadge } from "@/components/orders/status-badge";

export const dynamic = "force-dynamic";

const IN_TRANSIT: OrderStatus[] = [
  OrderStatus.PLACED,
  OrderStatus.CONFIRMED,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
];

export default async function SellerDashboardPage() {
  const seller = await requireApprovedSellerPage();
  const sellerId = seller.id;

  const [orderCount, productCount, deliveredAgg, ratingAgg, recentRows] = await Promise.all([
    prisma.order.count({ where: { sellerId, deletedAt: null } }),
    prisma.product.count({ where: { sellerId, status: ProductStatus.ACTIVE, deletedAt: null } }),
    prisma.order.aggregate({ where: { sellerId, status: OrderStatus.DELIVERED }, _sum: { sellerAmount: true } }),
    prisma.review.aggregate({ where: { product: { sellerId } }, _avg: { rating: true }, _count: true }),
    prisma.order.findMany({
      where: { sellerId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: orderInclude,
    }),
  ]);

  const recent = recentRows.map(toOrderSummary);
  const cards = [
    { label: "Revenue (delivered)", value: formatINR((deliveredAgg._sum.sellerAmount ?? 0).toString()) },
    { label: "Orders", value: String(orderCount) },
    { label: "Active products", value: String(productCount) },
    {
      label: "Avg rating",
      value: ratingAgg._count > 0 ? `★ ${(ratingAgg._avg.rating ?? 0).toFixed(1)} (${ratingAgg._count})` : "—",
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-slate-200 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">{c.label}</div>
            <div className="mt-1 text-xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent orders</h2>
          <Link href="/seller/orders" className="text-sm text-brand hover:underline">View all</Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No orders yet.
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((o) => (
              <Link
                key={o.id}
                href={`/seller/orders/${o.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm hover:shadow-sm"
              >
                <div>
                  <div className="font-medium">{o.buyerName ?? "Buyer"}</div>
                  <div className="text-xs text-slate-500">
                    {o.itemCount} item{o.itemCount > 1 ? "s" : ""} · {formatDateTime(o.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatINR(o.totalAmount)}</span>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
