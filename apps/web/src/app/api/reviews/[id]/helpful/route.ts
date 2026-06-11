import { NextResponse } from "next/server";
import { prisma } from "@bazaarx/db";
import { getCurrentUser } from "@/lib/auth";
import { notFound, unauthorized } from "@/lib/api";

/** POST /api/reviews/:id/helpful — mark a review helpful (increments the count). */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) return notFound("Review not found");

  const updated = await prisma.review.update({
    where: { id: params.id },
    data: { helpfulCount: { increment: 1 } },
    select: { helpfulCount: true },
  });
  return NextResponse.json({ helpfulCount: updated.helpfulCount });
}
