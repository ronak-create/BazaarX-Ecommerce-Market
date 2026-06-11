import { NextResponse } from "next/server";
import { prisma } from "@bazaarx/db";
import { getCurrentUser } from "@/lib/auth";
import { forbidden, notFound, unauthorized } from "@/lib/api";

/** DELETE /api/addresses/:id — remove one of the caller's addresses. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const address = await prisma.address.findUnique({ where: { id: params.id } });
  if (!address) return notFound("Address not found");
  if (address.userId !== user.id) return forbidden();

  await prisma.address.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
