import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, UserRole, BannerPosition } from "@bazaarx/db";
import { authorizeApi } from "@/lib/auth";
import { apiError, forbidden, unauthorized, validationError } from "@/lib/api";

/** GET /api/admin/banners — all banners ordered by priority. */
export async function GET() {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();
  const banners = await prisma.banner.findMany({ orderBy: [{ position: "asc" }, { priority: "desc" }] });
  return NextResponse.json(banners);
}

const createSchema = z.object({
  imageUrl: z.string().url(),
  linkUrl: z.string().url().nullish(),
  position: z.enum(["HOME", "CATEGORY"]).default("HOME"),
  priority: z.number().int().min(0).default(0),
});

/** POST /api/admin/banners — create a banner. */
export async function POST(req: Request) {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);

  const banner = await prisma.banner.create({
    data: {
      imageUrl: parsed.data.imageUrl,
      linkUrl: parsed.data.linkUrl ?? null,
      position: parsed.data.position as BannerPosition,
      priority: parsed.data.priority,
    },
  });
  return NextResponse.json(banner, { status: 201 });
}
