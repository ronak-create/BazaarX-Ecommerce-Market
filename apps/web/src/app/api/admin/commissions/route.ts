import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, UserRole } from "@bazaarx/db";
import { authorizeApi } from "@/lib/auth";
import { apiError, forbidden, notFound, unauthorized, validationError } from "@/lib/api";
import { DEFAULT_PLATFORM_FEE_PERCENT } from "@/lib/config";
import type { CategoryFeeDTO } from "@bazaarx/types";

/** GET /api/admin/commissions — per-category platform fee settings. */
export async function GET() {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  const categories = await prisma.category.findMany({
    orderBy: [{ level: "asc" }, { name: "asc" }],
    select: { id: true, name: true, level: true, commissionPercent: true },
  });

  const data: CategoryFeeDTO[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    level: c.level,
    commissionPercent: c.commissionPercent,
    effectivePercent: c.commissionPercent ?? DEFAULT_PLATFORM_FEE_PERCENT,
  }));
  return NextResponse.json(data);
}

const putSchema = z.object({
  categoryId: z.string().min(1),
  feePercent: z.number().min(0).max(100).nullable(),
});

/** PUT /api/admin/commissions — set (or clear with null) a category's fee %. */
export async function PUT(req: Request) {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);

  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) return notFound("Category not found");

  await prisma.category.update({
    where: { id: parsed.data.categoryId },
    data: { commissionPercent: parsed.data.feePercent },
  });
  return NextResponse.json({ ok: true });
}
