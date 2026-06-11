import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, UserRole } from "@bazaarx/db";
import { authorizeApi } from "@/lib/auth";
import { apiError, forbidden, notFound, unauthorized, validationError } from "@/lib/api";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  imageUrl: z.string().url().nullish(),
});

/** PATCH /api/categories/:id — rename or set image (admin). */
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
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.category.findUnique({ where: { id: params.id } });
  if (!existing) return notFound("Category not found");

  const updated = await prisma.category.update({
    where: { id: params.id },
    data: {
      name: parsed.data.name ?? undefined,
      imageUrl: parsed.data.imageUrl === undefined ? undefined : parsed.data.imageUrl,
    },
  });
  return NextResponse.json(updated);
}

/** DELETE /api/categories/:id — remove a leaf category with no products (admin). */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  const [children, products] = await Promise.all([
    prisma.category.count({ where: { parentId: params.id } }),
    prisma.product.count({ where: { categoryId: params.id } }),
  ]);
  if (children > 0) return apiError("HAS_CHILDREN", "Remove subcategories first", 409);
  if (products > 0) return apiError("HAS_PRODUCTS", "Category still has products", 409);

  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
