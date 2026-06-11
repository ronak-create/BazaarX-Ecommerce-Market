import { NextResponse } from "next/server";
import { prisma } from "@bazaarx/db";
import { getCurrentUser } from "@/lib/auth";
import { unauthorized } from "@/lib/api";

/** DELETE /api/wishlist/:productId — remove a saved product. */
export async function DELETE(_req: Request, { params }: { params: { productId: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  await prisma.wishlist.deleteMany({
    where: { userId: user.id, productId: params.productId },
  });
  return NextResponse.json({ ok: true });
}
