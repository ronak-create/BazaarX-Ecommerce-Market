import { NextResponse } from "next/server";
import { prisma } from "@bazaarx/db";

/**
 * GET /r/:slug — reseller share link. Records a click, drops an attribution
 * cookie, and redirects to the product page. The cookie is read at checkout to
 * credit the reseller's margin.
 */
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const link = await prisma.resellerLink.findUnique({
    where: { slug: params.slug },
    include: { product: { select: { slug: true, deletedAt: true, status: true } } },
  });

  const origin = new URL(req.url).origin;
  if (!link || link.product.deletedAt || link.product.status !== "ACTIVE") {
    return NextResponse.redirect(new URL("/", origin));
  }

  await prisma.resellerLink.update({
    where: { id: link.id },
    data: { clicks: { increment: 1 } },
  });

  const res = NextResponse.redirect(new URL(`/product/${link.product.slug}`, origin));
  res.cookies.set("ref", params.slug, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
    sameSite: "lax",
  });
  return res;
}
