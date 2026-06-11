import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, SellerStatus, UserRole } from "@bazaarx/db";
import { authorizeApi } from "@/lib/auth";
import { apiError, forbidden, notFound, unauthorized, validationError } from "@/lib/api";

const bodySchema = z.object({
  rejectionReason: z.string().trim().min(3, "A reason is required").max(500),
});

/**
 * POST /api/admin/kyc/:id/reject
 * Moves a PENDING seller application to REJECTED with a reason the seller sees.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);

  const profile = await prisma.sellerProfile.findUnique({ where: { id: params.id } });
  if (!profile) return notFound("Seller application not found");
  if (profile.status !== SellerStatus.PENDING) {
    return apiError("INVALID_STATE", `Cannot reject a ${profile.status.toLowerCase()} application`, 409);
  }

  const updated = await prisma.sellerProfile.update({
    where: { id: params.id },
    data: {
      status: SellerStatus.REJECTED,
      rejectionReason: parsed.data.rejectionReason,
    },
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
