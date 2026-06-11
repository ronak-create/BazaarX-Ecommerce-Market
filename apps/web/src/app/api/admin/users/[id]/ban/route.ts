import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, UserRole } from "@bazaarx/db";
import { authorizeApi } from "@/lib/auth";
import { apiError, forbidden, notFound, unauthorized } from "@/lib/api";

const bodySchema = z.object({ banned: z.boolean() });

/** POST /api/admin/users/:id/ban — ban (soft delete) or unban a user. */
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
  if (!parsed.success) return apiError("VALIDATION", "banned is required", 422);

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return notFound("User not found");
  if (user.role === UserRole.ADMIN) return apiError("FORBIDDEN", "Cannot ban an admin", 403);

  await prisma.user.update({
    where: { id: params.id },
    data: { deletedAt: parsed.data.banned ? new Date() : null },
  });
  return NextResponse.json({ ok: true });
}
