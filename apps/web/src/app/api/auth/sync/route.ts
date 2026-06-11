import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import type { AuthProfile } from "@bazaarx/types";

/**
 * POST /api/auth/sync
 * Mirrors the authenticated Supabase user into the Prisma User table.
 * Called once after login/signup; idempotent (upsert by Supabase user id).
 */
export async function POST() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "No active session" } },
      { status: 401 },
    );
  }

  // Supabase returns "" (not null) for the unused contact field; normalise to
  // null so the unique constraints don't collide across email-only accounts.
  const email = authUser.email?.trim() || null;
  const phone = authUser.phone?.trim() || null;
  const meta = authUser.user_metadata ?? {};
  const name = ((meta.full_name as string) || (meta.name as string) || "").trim() || null;
  const avatar = (meta.avatar_url as string)?.trim() || null;

  const user = await prisma.user.upsert({
    where: { id: authUser.id },
    update: { email, phone, isVerified: Boolean(authUser.email_confirmed_at || authUser.phone_confirmed_at) },
    create: {
      id: authUser.id,
      email,
      phone,
      name,
      avatar,
      isVerified: Boolean(authUser.email_confirmed_at || authUser.phone_confirmed_at),
    },
    include: { sellerProfile: true, resellerProfile: true },
  });

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
