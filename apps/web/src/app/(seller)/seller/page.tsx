import Link from "next/link";
import {
  CurrencyInr,
  Receipt,
  Package,
  Star,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";

type IconCmp = typeof Receipt;
import { prisma, OrderStatus, ProductStatus } from "@bazaarx/db";
import { formatINR, formatDateTime } from "@bazaarx/utils";
import { requireApprovedSellerPage } from "@/lib/auth";
import { toOrderSummary, orderInclude } from "@/lib/orders";
import { StatusBadge } from "@/components/orders/status-badge";

export const dynamic = "force-dynamic";

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
  const cards: { label: string; value: string; icon: IconCmp; tint: string }[] = [
    {
      label: "Revenue (delivered)",
      value: formatINR((deliveredAgg._sum.sellerAmount ?? 0).toString()),
      icon: CurrencyInr,
      tint: "bg-emerald-50 text-emerald-700",
    },
    { label: "Orders", value: String(orderCount), icon: Receipt, tint: "bg-brand-50 text-brand-700" },
    { label: "Active products", value: String(productCount), icon: Package, tint: "bg-sky-50 text-sky-700" },
    {
      label: "Avg rating",
      value: ratingAgg._count > 0 ? `${(ratingAgg._avg.rating ?? 0).toFixed(1)} (${ratingAgg._count})` : "—",
      icon: Star,
      tint: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink-900">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">An overview of your store.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${c.tint}`}>
                <Icon size={20} weight="bold" />
              </span>
              <div className="mt-4 font-display text-2xl font-bold tabular-nums text-ink-900">{c.value}</div>
              <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-ink-400">{c.label}</div>
            </div>
          );
        })}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900">Recent orders</h2>
          <Link href="/seller/orders" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
            View all <CaretRight size={13} weight="bold" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-white p-10 text-center">
            <Receipt size={28} className="mx-auto text-ink-300" />
            <p className="mt-3 text-sm text-ink-500">No orders yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
            {recent.map((o) => (
              <Link
                key={o.id}
                href={`/seller/orders/${o.id}`}
                className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3.5 text-sm transition-colors last:border-b-0 hover:bg-ink-50"
              >
                <div className="min-w-0">
                  <div className="font-medium text-ink-900">{o.buyerName ?? "Buyer"}</div>
                  <div className="text-xs text-ink-500">
                    {o.itemCount} item{o.itemCount > 1 ? "s" : ""} · {formatDateTime(o.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums text-ink-900">{formatINR(o.totalAmount)}</span>
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
