import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, UserRole, SellerStatus } from "@bazaarx/db";
import { authorizeApi } from "@/lib/auth";
import { apiError, forbidden, notFound, unauthorized } from "@/lib/api";

const bodySchema = z.object({ suspended: z.boolean() });

/** POST /api/admin/users/:id/suspend — suspend or reinstate a seller account. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiError("VALIDATION", "suspended is required", 422);

  const seller = await prisma.sellerProfile.findUnique({ where: { userId: params.id } });
  if (!seller) return notFound("Seller profile not found");

  await prisma.sellerProfile.update({
    where: { id: seller.id },
    data: { status: parsed.data.suspended ? SellerStatus.SUSPENDED : SellerStatus.APPROVED },
  });
  return NextResponse.json({ ok: true });
}
