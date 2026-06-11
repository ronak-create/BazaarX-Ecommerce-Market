import { NextResponse } from "next/server";
import { prisma } from "@bazaarx/db";
import { getCurrentUser } from "@/lib/auth";
import { unauthorized } from "@/lib/api";

/** POST /api/reseller/register — opt in as a reseller (instant, idempotent). */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const reseller = await prisma.resellerProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  return NextResponse.json({ id: reseller.id }, { status: 201 });
}
