import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, UserRole, DiscountType } from "@bazaarx/db";
import { authorizeApi } from "@/lib/auth";
import { apiError, forbidden, unauthorized, validationError } from "@/lib/api";
import type { CouponDTO } from "@bazaarx/types";

function toDTO(c: {
  id: string; code: string; discountType: DiscountType; discountValue: { toString(): string };
  minOrderAmount: { toString(): string }; maxUses: number | null; usedCount: number;
  expiresAt: Date | null; isActive: boolean;
}): CouponDTO {
  return {
    id: c.id,
    code: c.code,
    discountType: c.discountType,
    discountValue: c.discountValue.toString(),
    minOrderAmount: c.minOrderAmount.toString(),
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    expiresAt: c.expiresAt?.toISOString() ?? null,
    isActive: c.isActive,
  };
}

/** GET /api/admin/coupons — all coupons. */
export async function GET() {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(coupons.map(toDTO));
}

const createSchema = z.object({
  code: z.string().trim().min(3).max(24),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.string().regex(/^\d+(\.\d{1,2})?$/),
  minOrderAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

/** POST /api/admin/coupons — create a coupon. */
export async function POST(req: Request) {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);
  const d = parsed.data;

  const code = d.code.toUpperCase();
  if (await prisma.coupon.findUnique({ where: { code } })) {
    return apiError("DUPLICATE", "Coupon code already exists", 409);
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      discountType: d.discountType as DiscountType,
      discountValue: d.discountValue,
      minOrderAmount: d.minOrderAmount ?? "0",
      maxUses: d.maxUses ?? null,
      expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
    },
  });
  return NextResponse.json(toDTO(coupon), { status: 201 });
}
