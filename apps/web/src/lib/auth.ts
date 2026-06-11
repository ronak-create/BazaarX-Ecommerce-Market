import { redirect } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma, type User, type UserRole } from "@bazaarx/db";
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
 */
export async function getCurrentUser(): Promise<User | null> {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  return prisma.user.findUnique({ where: { id: authUser.id } });
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
