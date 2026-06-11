import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@bazaarx/db";
import { indianPhoneSchema, pincodeSchema } from "@bazaarx/utils";
import { getCurrentUser } from "@/lib/auth";
import { apiError, unauthorized, validationError } from "@/lib/api";
import type { AddressDTO } from "@bazaarx/types";

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: indianPhoneSchema,
  line1: z.string().trim().min(3).max(160),
  line2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  pincode: pincodeSchema,
  isDefault: z.boolean().optional(),
});

function toDTO(a: {
  id: string; fullName: string; phone: string; line1: string; line2: string | null;
  city: string; state: string; pincode: string; isDefault: boolean;
}): AddressDTO {
  return { ...a, line2: a.line2 ?? "" };
}

/** GET /api/addresses — the caller's saved addresses. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const rows = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(rows.map(toDTO));
}

/** POST /api/addresses — add an address (first one, or isDefault, becomes default). */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = addressSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const count = await prisma.address.count({ where: { userId: user.id } });
  const makeDefault = input.isDefault || count === 0;

  const address = await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    return tx.address.create({
      data: {
        userId: user.id,
        fullName: input.fullName,
        phone: input.phone,
        line1: input.line1,
        line2: input.line2,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        isDefault: makeDefault,
      },
    });
  });

  return NextResponse.json(toDTO(address), { status: 201 });
}
