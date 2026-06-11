import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, ProductStatus } from "@bazaarx/db";
import { shortSlug } from "@bazaarx/utils";
import { authorizeReseller } from "@/lib/auth";
import { apiError, forbidden, unauthorized, validationError } from "@/lib/api";
import type { ResellerLinkDTO } from "@bazaarx/types";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function toDTO(l: {
  id: string; productId: string; margin: { toString(): string }; slug: string;
  clicks: number; conversions: number; product: { name: string; slug: string };
}): ResellerLinkDTO {
  return {
    id: l.id,
    productId: l.productId,
    productName: l.product.name,
    productSlug: l.product.slug,
    margin: l.margin.toString(),
    slug: l.slug,
    shareUrl: `${appUrl()}/r/${l.slug}`,
    clicks: l.clicks,
    conversions: l.conversions,
  };
}

/** GET /api/reseller/links — the caller's share links. */
export async function GET() {
  const auth = await authorizeReseller();
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden("Become a reseller first");

  const links = await prisma.resellerLink.findMany({
    where: { resellerId: auth.reseller.id },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, slug: true } } },
  });
  return NextResponse.json(links.map(toDTO));
}

const createSchema = z.object({
  productId: z.string().min(1),
  margin: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid margin"),
});

/** POST /api/reseller/links — create a share link with a per-unit margin. */
export async function POST(req: Request) {
  const auth = await authorizeReseller();
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden("Become a reseller first");

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, deletedAt: null, status: ProductStatus.ACTIVE },
  });
  if (!product) return apiError("UNAVAILABLE", "Product not available", 422);

  let slug = shortSlug();
  for (let i = 0; (await prisma.resellerLink.findUnique({ where: { slug } })) && i < 5; i++) {
    slug = shortSlug();
  }

  const link = await prisma.resellerLink.create({
    data: {
      resellerId: auth.reseller.id,
      productId: parsed.data.productId,
      margin: parsed.data.margin,
      slug,
    },
    include: { product: { select: { name: true, slug: true } } },
  });
  return NextResponse.json(toDTO(link), { status: 201 });
}
