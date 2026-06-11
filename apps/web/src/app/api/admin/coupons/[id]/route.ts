import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, UserRole } from "@bazaarx/db";
import { authorizeApi } from "@/lib/auth";
import { apiError, forbidden, notFound, unauthorized } from "@/lib/api";

const patchSchema = z.object({ isActive: z.boolean() });

/** PATCH /api/admin/coupons/:id — activate or deactivate a coupon. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return apiError("VALIDATION", "isActive required", 422);

  const coupon = await prisma.coupon.findUnique({ where: { id: params.id } });
  if (!coupon) return notFound("Coupon not found");

  await prisma.coupon.update({ where: { id: params.id }, data: { isActive: parsed.data.isActive } });
  return NextResponse.json({ ok: true });
}
