import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, OrderStatus } from "@bazaarx/db";
import { getCurrentUser } from "@/lib/auth";
import { apiError, validationError } from "@/lib/api";
import { recomputeProductRating } from "@/lib/reviews";
import type { ReviewDTO, ReviewSummaryDTO } from "@bazaarx/types";

/** GET /api/reviews?productId= — reviews, summary, and the caller's eligibility. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  if (!productId) return apiError("VALIDATION", "productId is required", 422);

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { avgRating: true, totalReviews: true },
  });
  if (!product) return apiError("NOT_FOUND", "Product not found", 404);

  const reviews = await prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    include: { buyer: { select: { id: true, name: true } } },
  });

  const user = await getCurrentUser();

  // Eligible if the caller has a DELIVERED order containing this product with no review yet.
  let eligibleOrderId: string | null = null;
  if (user) {
    const order = await prisma.order.findFirst({
      where: {
        buyerId: user.id,
        status: OrderStatus.DELIVERED,
        items: { some: { productId } },
        review: { none: { productId, buyerId: user.id } },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    eligibleOrderId = order?.id ?? null;
  }

  const data: ReviewDTO[] = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    images: r.images,
    helpfulCount: r.helpfulCount,
    authorName: r.buyer.name ?? "Verified buyer",
    createdAt: r.createdAt.toISOString(),
    isMine: user?.id === r.buyerId,
  }));

  const body: ReviewSummaryDTO = {
    reviews: data,
    avgRating: product.avgRating,
    totalReviews: product.totalReviews,
    eligibleOrderId,
  };
  return NextResponse.json(body);
}

const createSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().max(2000).optional(),
  images: z.array(z.string().url()).max(5).optional(),
});

/** POST /api/reviews — review a product from a delivered order (one per order). */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHENTICATED", "No active session", 401);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  // Verify the order belongs to the buyer, is delivered, and contains the product.
  const order = await prisma.order.findFirst({
    where: {
      id: input.orderId,
      buyerId: user.id,
      status: OrderStatus.DELIVERED,
      items: { some: { productId: input.productId } },
    },
  });
  if (!order) return apiError("NOT_ELIGIBLE", "You can only review delivered purchases", 403);

  const existing = await prisma.review.findUnique({
    where: {
      buyerId_productId_orderId: {
        buyerId: user.id,
        productId: input.productId,
        orderId: input.orderId,
      },
    },
  });
  if (existing) return apiError("ALREADY_REVIEWED", "You already reviewed this item", 409);

  const review = await prisma.$transaction(async (tx) => {
    const r = await tx.review.create({
      data: {
        buyerId: user.id,
        productId: input.productId,
        orderId: input.orderId,
        rating: input.rating,
        title: input.title,
        body: input.body,
        images: input.images ?? [],
      },
    });
    await recomputeProductRating(tx, input.productId);
    return r;
  });

  return NextResponse.json({ id: review.id }, { status: 201 });
}
