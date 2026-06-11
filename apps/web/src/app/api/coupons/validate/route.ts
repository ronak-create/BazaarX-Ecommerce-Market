import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, unauthorized } from "@/lib/api";
import { validateCoupon } from "@/lib/coupon";
import type { ValidateCouponResult } from "@bazaarx/types";

const bodySchema = z.object({
  code: z.string().trim().min(1),
  subtotal: z.coerce.number().nonnegative(),
});

/** POST /api/coupons/validate — preview a coupon discount for the given subtotal. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiError("VALIDATION", "Invalid input", 422);

  const check = await validateCoupon(parsed.data.code, user.id, parsed.data.subtotal);
  if (!check.ok) return apiError("COUPON_INVALID", check.message, 422);

  const result: ValidateCouponResult = {
    code: check.coupon.code,
    discount: check.discount.toFixed(2),
  };
  return NextResponse.json(result);
}
