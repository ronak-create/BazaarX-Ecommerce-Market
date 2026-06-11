import { NextResponse } from "next/server";
import { prisma } from "@bazaarx/db";
import { authorizeReseller } from "@/lib/auth";
import { forbidden, notFound, unauthorized } from "@/lib/api";

/** DELETE /api/reseller/links/:id — remove one of the caller's links. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await authorizeReseller();
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  const link = await prisma.resellerLink.findUnique({ where: { id: params.id } });
  if (!link) return notFound("Link not found");
  if (link.resellerId !== auth.reseller.id) return forbidden();

  await prisma.resellerLink.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
