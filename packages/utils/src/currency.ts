/** INR formatting and money math. Amounts are handled as numbers of rupees. */

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

/** Format a rupee amount, e.g. formatINR(580) -> "₹580.00". */
export function formatINR(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return INR.format(Number.isFinite(n) ? n : 0);
}

/** Round to 2 decimal places to avoid float drift before persisting. */
export function toMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Platform fee for a base amount given a percent (e.g. 10 => 10%). */
export function platformFee(baseAmount: number, feePercent: number): number {
  return toMoney((baseAmount * feePercent) / 100);
}
