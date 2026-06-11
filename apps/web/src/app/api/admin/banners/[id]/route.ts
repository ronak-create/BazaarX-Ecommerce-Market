import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, UserRole } from "@bazaarx/db";
import { authorizeApi } from "@/lib/auth";
import { apiError, forbidden, notFound, unauthorized } from "@/lib/api";

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
});

/** PATCH /api/admin/banners/:id — toggle active / set priority. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return apiError("VALIDATION", "Invalid input", 422);

  const banner = await prisma.banner.findUnique({ where: { id: params.id } });
  if (!banner) return notFound("Banner not found");

  await prisma.banner.update({
    where: { id: params.id },
    data: { isActive: parsed.data.isActive, priority: parsed.data.priority },
  });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/banners/:id — remove a banner. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  const banner = await prisma.banner.findUnique({ where: { id: params.id } });
  if (!banner) return notFound("Banner not found");

  await prisma.banner.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
