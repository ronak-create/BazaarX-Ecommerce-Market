import { redirect } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  prisma,
  SellerStatus,
  type ResellerProfile,
  type SellerProfile,
  type User,
  type UserRole,
} from "@bazaarx/db";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the Supabase auth user for the current request, or null.
 * Use getUser() (not getSession()) so the JWT is verified server-side.
 */
export async function getAuthUser(): Promise<SupabaseUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns the merged Prisma User row for the current Supabase session, or null.
 * Matches on Supabase user id stored as the Prisma User.id (set during sync).
 * Banned (soft-deleted) users resolve to null so they cannot act anywhere.
 */
export async function getCurrentUser(): Promise<User | null> {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  return prisma.user.findFirst({ where: { id: authUser.id, deletedAt: null } });
}

/** Guard for server components/layouts: redirects to login if unauthenticated. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  return user;
}

/** Guard requiring a specific role; redirects home if the role doesn't match. */
export async function requireRole(role: UserRole): Promise<User> {
  const user = await requireUser();
  if (user.role !== role) redirect("/");
  return user;
}

/**
 * API-route guard: returns the user if they hold `role`, otherwise an object
 * describing the failure so the handler can return the right JSON status.
 * (Route handlers must not call redirect().)
 */
export async function authorizeApi(
  role?: UserRole,
): Promise<
  | { ok: true; user: User }
  | { ok: false; status: 401 | 403 }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401 };
  if (role && user.role !== role) return { ok: false, status: 403 };
  return { ok: true, user };
}

/**
 * API-route guard requiring the caller to be an APPROVED seller. Returns their
 * SellerProfile so handlers can scope by sellerId. 403 if not approved.
 */
export async function authorizeApprovedSeller(): Promise<
  | { ok: true; user: User; seller: SellerProfile }
  | { ok: false; status: 401 | 403 }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401 };
  const seller = await prisma.sellerProfile.findUnique({ where: { userId: user.id } });
  if (!seller || seller.status !== SellerStatus.APPROVED) {
    return { ok: false, status: 403 };
  }
  return { ok: true, user, seller };
}

/** Server-component helper: the caller's seller profile, or null. */
export async function getSellerProfile(): Promise<SellerProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return prisma.sellerProfile.findUnique({ where: { userId: user.id } });
}

/**
 * Server-component guard for seller product pages: requires an APPROVED seller,
 * otherwise sends them to onboarding. Returns the profile.
 */
export async function requireApprovedSellerPage(): Promise<SellerProfile> {
  await requireUser();
  const seller = await getSellerProfile();
  if (!seller || seller.status !== SellerStatus.APPROVED) redirect("/seller/onboarding");
  return seller;
}

/** Reseller status is additive (any user can opt in); gated by profile existence. */
export async function getResellerProfile(): Promise<ResellerProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return prisma.resellerProfile.findUnique({ where: { userId: user.id } });
}

/** API guard: caller must have a reseller profile. */
export async function authorizeReseller(): Promise<
  | { ok: true; user: User; reseller: ResellerProfile }
  | { ok: false; status: 401 | 403 }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401 };
  const reseller = await prisma.resellerProfile.findUnique({ where: { userId: user.id } });
  if (!reseller) return { ok: false, status: 403 };
  return { ok: true, user, reseller };
}

/** Server-component guard for reseller pages; redirects non-resellers to opt-in. */
export async function requireResellerPage(): Promise<ResellerProfile> {
  await requireUser();
  const reseller = await getResellerProfile();
  if (!reseller) redirect("/reseller/join");
  return reseller;
}
