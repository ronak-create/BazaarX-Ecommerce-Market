import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@bazaarx/db";
import { getCurrentUser } from "@/lib/auth";
import { apiError, forbidden, notFound, unauthorized } from "@/lib/api";
import { recomputeProductRating } from "@/lib/reviews";

const patchSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  title: z.string().trim().max(120).nullish(),
  body: z.string().trim().max(2000).nullish(),
});

/** PATCH /api/reviews/:id — edit your own review. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) return notFound("Review not found");
  if (review.buyerId !== user.id) return forbidden();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return apiError("VALIDATION", "Invalid input", 422);

  await prisma.$transaction(async (tx) => {
    await tx.review.update({
      where: { id: params.id },
      data: {
        rating: parsed.data.rating ?? undefined,
        title: parsed.data.title === undefined ? undefined : parsed.data.title,
        body: parsed.data.body === undefined ? undefined : parsed.data.body,
      },
    });
    if (parsed.data.rating != null) await recomputeProductRating(tx, review.productId);
  });

  return NextResponse.json({ ok: true });
}

/** DELETE /api/reviews/:id — remove your own review. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) return notFound("Review not found");
  if (review.buyerId !== user.id) return forbidden();

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: params.id } });
    await recomputeProductRating(tx, review.productId);
  });

  return NextResponse.json({ ok: true });
}
