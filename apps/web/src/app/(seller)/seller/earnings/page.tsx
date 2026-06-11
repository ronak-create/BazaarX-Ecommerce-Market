import { prisma, OrderStatus, PayoutStatus } from "@bazaarx/db";
import { formatINR, formatDateTime, toMoney } from "@bazaarx/utils";
import { requireApprovedSellerPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

const IN_TRANSIT: OrderStatus[] = [
  OrderStatus.PLACED,
  OrderStatus.CONFIRMED,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
];

export default async function SellerEarningsPage() {
  const seller = await requireApprovedSellerPage();
  const sellerId = seller.id;

  const [deliveredAgg, transitAgg, payoutAgg, payouts] = await Promise.all([
    prisma.order.aggregate({ where: { sellerId, status: OrderStatus.DELIVERED }, _sum: { sellerAmount: true } }),
    prisma.order.aggregate({ where: { sellerId, status: { in: IN_TRANSIT } }, _sum: { sellerAmount: true } }),
    prisma.payout.aggregate({ where: { sellerId, status: PayoutStatus.COMPLETED }, _sum: { amount: true } }),
    prisma.payout.findMany({ where: { sellerId }, orderBy: { createdAt: "desc" } }),
  ]);

  const lifetime = Number(deliveredAgg._sum.sellerAmount ?? 0);
  const paidOut = Number(payoutAgg._sum.amount ?? 0);
  const available = toMoney(Math.max(0, lifetime - paidOut));
  const pending = Number(transitAgg._sum.sellerAmount ?? 0);

  const cards = [
    { label: "Available to pay out", value: formatINR(available) },
    { label: "Pending (in transit)", value: formatINR(pending) },
    { label: "Lifetime earned", value: formatINR(lifetime) },
    { label: "Paid out", value: formatINR(paidOut) },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Earnings</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-slate-200 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">{c.label}</div>
            <div className="mt-1 text-xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-500">
        Earnings are your order totals minus the platform fee. Amounts move from “pending” to
        “available” once an order is delivered and the return window passes.
      </p>

      <section>
        <h2 className="mb-3 text-lg font-medium">Payout history</h2>
        {payouts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No payouts yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="py-2">Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>UTR</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">{formatDateTime(p.createdAt)}</td>
                  <td className="font-medium">{formatINR(p.amount.toString())}</td>
                  <td>{p.status}</td>
                  <td className="text-slate-500">{p.utr ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
