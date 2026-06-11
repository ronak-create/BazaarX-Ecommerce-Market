import { prisma, type Coupon } from "@bazaarx/db";
import { toMoney } from "@bazaarx/utils";

export type CouponCheck =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; message: string };

/**
 * Validate a coupon for a user against a base subtotal and compute the discount.
 * Enforces active/expiry/min-order/max-uses and one-use-per-user.
 */
export async function validateCoupon(
  code: string,
  userId: string,
  baseSubtotal: number,
): Promise<CouponCheck> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.isActive) return { ok: false, message: "Invalid coupon code" };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { ok: false, message: "Coupon has expired" };
  if (baseSubtotal < Number(coupon.minOrderAmount)) {
    return { ok: false, message: `Minimum order ₹${coupon.minOrderAmount} for this coupon` };
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, message: "Coupon fully redeemed" };
  }
  const priorUse = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId } });
  if (priorUse > 0) return { ok: false, message: "You have already used this coupon" };

  let discount =
    coupon.discountType === "PERCENTAGE"
      ? (baseSubtotal * Number(coupon.discountValue)) / 100
      : Number(coupon.discountValue);
  discount = toMoney(Math.min(discount, baseSubtotal));

  return { ok: true, coupon, discount };
}
