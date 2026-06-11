import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import type { AuthProfile } from "@bazaarx/types";

/**
 * GET /api/auth/me
 * Returns the merged auth profile for the current session, or 401.
 */
export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "No active session" } },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: { sellerProfile: true, resellerProfile: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: { code: "NOT_SYNCED", message: "Call /api/auth/sync first" } },
      { status: 404 },
    );
  }

  const profile: AuthProfile = {
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    isVerified: user.isVerified,
    isSeller: Boolean(user.sellerProfile),
    isReseller: Boolean(user.resellerProfile),
  };

  return NextResponse.json(profile);
}
