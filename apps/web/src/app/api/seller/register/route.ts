import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, SellerStatus, UserRole } from "@bazaarx/db";
import { gstinSchema, panSchema } from "@bazaarx/utils";
import { getCurrentUser } from "@/lib/auth";
import { apiError, unauthorized, validationError } from "@/lib/api";
import type { SellerProfileDTO } from "@bazaarx/types";

const ifscSchema = z
  .string()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC")
  .optional();

const bodySchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required").max(120),
  gstin: gstinSchema,
  panNumber: panSchema,
  bankAccount: z.string().trim().regex(/^\d{9,18}$/, "Invalid bank account").optional(),
  ifsc: ifscSchema,
  documents: z.array(z.string()).max(10).default([]),
});

/**
 * POST /api/seller/register
 * Creates (or re-submits) the caller's SellerProfile in PENDING and promotes
 * their role to SELLER so they can reach the seller dashboard while awaiting KYC.
 */
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
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const existing = await prisma.sellerProfile.findUnique({
    where: { userId: user.id },
  });

  // Only a previously rejected application may be resubmitted.
  if (existing && existing.status !== SellerStatus.REJECTED) {
    return apiError(
      "ALREADY_REGISTERED",
      `Seller application already ${existing.status.toLowerCase()}`,
      409,
    );
  }

  const profile = await prisma.$transaction(async (tx) => {
    const sp = await tx.sellerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        businessName: input.businessName,
        gstin: input.gstin,
        panNumber: input.panNumber,
        bankAccount: input.bankAccount,
        ifsc: input.ifsc,
        documents: input.documents,
        status: SellerStatus.PENDING,
      },
      update: {
        businessName: input.businessName,
        gstin: input.gstin,
        panNumber: input.panNumber,
        bankAccount: input.bankAccount,
        ifsc: input.ifsc,
        documents: input.documents,
        status: SellerStatus.PENDING,
        rejectionReason: null,
      },
    });

    if (user.role === UserRole.BUYER) {
      await tx.user.update({
        where: { id: user.id },
        data: { role: UserRole.SELLER },
      });
    }

    return sp;
  });

  const dto: SellerProfileDTO = {
    id: profile.id,
    businessName: profile.businessName,
    gstin: profile.gstin,
    panNumber: profile.panNumber,
    bankAccount: profile.bankAccount,
    ifsc: profile.ifsc,
    status: profile.status,
    rejectionReason: profile.rejectionReason,
    documents: profile.documents,
    createdAt: profile.createdAt.toISOString(),
  };

  return NextResponse.json(dto, { status: existing ? 200 : 201 });
}
