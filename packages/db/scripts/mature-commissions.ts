import { PrismaClient, OrderStatus, CommissionStatus } from "@prisma/client";

/**
 * Mature reseller commissions: PENDING -> PAID once the order has been DELIVERED
 * and the 7-day return window has elapsed (no return). Moves the amount from the
 * reseller's pendingEarnings to totalEarnings. Run on a schedule (e.g. daily).
 */
const prisma = new PrismaClient();
const RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

async function main() {
  const pending = await prisma.commission.findMany({
    where: { status: CommissionStatus.PENDING, order: { status: OrderStatus.DELIVERED } },
    include: { order: { include: { tracking: true } } },
  });

  const now = Date.now();
  let matured = 0;

  for (const c of pending) {
    const deliveredAt = c.order.tracking
      .filter((t) => t.status === OrderStatus.DELIVERED)
      .map((t) => t.timestamp.getTime())
      .sort((a, b) => b - a)[0];
    if (!deliveredAt || now - deliveredAt < RETURN_WINDOW_MS) continue;

    await prisma.$transaction([
      prisma.commission.update({ where: { id: c.id }, data: { status: CommissionStatus.PAID } }),
      prisma.resellerProfile.update({
        where: { id: c.resellerId },
        data: {
          pendingEarnings: { decrement: c.amount },
          totalEarnings: { increment: c.amount },
        },
      }),
    ]);
    matured++;
  }

  console.log(`Matured ${matured} commission(s).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
