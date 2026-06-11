import { NextResponse } from "next/server";
import { prisma, SellerStatus, UserRole } from "@bazaarx/db";
import { authorizeApi } from "@/lib/auth";
import { apiError, forbidden, notFound, unauthorized } from "@/lib/api";

/**
 * POST /api/admin/kyc/:id/approve
 * Moves a PENDING seller application to APPROVED.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  const profile = await prisma.sellerProfile.findUnique({ where: { id: params.id } });
  if (!profile) return notFound("Seller application not found");
  if (profile.status !== SellerStatus.PENDING) {
    return apiError("INVALID_STATE", `Cannot approve a ${profile.status.toLowerCase()} application`, 409);
  }

  const updated = await prisma.sellerProfile.update({
    where: { id: params.id },
    data: { status: SellerStatus.APPROVED, rejectionReason: null },
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
