import { Wallet, ClockCounterClockwise, ChartLineUp, CheckCircle } from "@phosphor-icons/react/dist/ssr";

type IconCmp = typeof Wallet;
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

  const cards: { label: string; value: string; icon: IconCmp; tint: string; primary?: boolean }[] = [
    { label: "Available to pay out", value: formatINR(available), icon: Wallet, tint: "bg-brand-50 text-brand-700", primary: true },
    { label: "Pending (in transit)", value: formatINR(pending), icon: ClockCounterClockwise, tint: "bg-amber-50 text-amber-700" },
    { label: "Lifetime earned", value: formatINR(lifetime), icon: ChartLineUp, tint: "bg-emerald-50 text-emerald-700" },
    { label: "Paid out", value: formatINR(paidOut), icon: CheckCircle, tint: "bg-ink-100 text-ink-600" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink-900">Earnings</h1>
        <p className="mt-1 text-sm text-ink-500">
          Order totals minus the platform fee. Amounts move from pending to available once an order is delivered and the return window passes.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`rounded-2xl border p-5 shadow-card ${
                c.primary ? "border-brand-200 bg-brand-50/40" : "border-ink-200 bg-white"
              }`}
            >
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
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">Payout history</h2>
        {payouts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-white p-10 text-center">
            <Wallet size={28} className="mx-auto text-ink-300" />
            <p className="mt-3 text-sm text-ink-500">No payouts yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">UTR</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-ink-100 last:border-b-0">
                    <td className="px-4 py-3 text-ink-500">{formatDateTime(p.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-ink-900">{formatINR(p.amount.toString())}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-600">{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-500">{p.utr ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
