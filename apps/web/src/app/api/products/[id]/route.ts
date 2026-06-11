import { NextResponse } from "next/server";
import { prisma, ProductStatus, type Prisma } from "@bazaarx/db";
import { authorizeApprovedSeller, getSellerProfile } from "@/lib/auth";
import { apiError, forbidden, notFound, unauthorized, validationError } from "@/lib/api";
import { productInputSchema, nestedCreate, toProductDTO } from "@/lib/product-schema";

const patchSchema = productInputSchema.partial();

/** Resolve a product by cuid id or slug. */
async function findProduct(idOrSlug: string) {
  return prisma.product.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], deletedAt: null },
    include: { variants: true, images: true },
  });
}

/** GET /api/products/:id — detail by id or slug. Drafts visible only to the owner. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const product = await findProduct(params.id);
  if (!product) return notFound("Product not found");

  if (product.status !== ProductStatus.ACTIVE) {
    const seller = await getSellerProfile();
    if (!seller || seller.id !== product.sellerId) return notFound("Product not found");
  }
  return NextResponse.json(toProductDTO(product));
}

/** PATCH /api/products/:id — update fields, variants, and images (owner). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await authorizeApprovedSeller();
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || product.deletedAt) return notFound("Product not found");
  if (product.sellerId !== auth.seller.id) return forbidden("Not your product");

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) return apiError("INVALID_CATEGORY", "Category not found", 422);
  }

  const data: Prisma.ProductUpdateInput = {
    name: input.name ?? undefined,
    description: input.description ?? undefined,
    basePrice: input.basePrice ?? undefined,
    discountedPrice: input.discountedPrice === undefined ? undefined : input.discountedPrice,
    brand: input.brand === undefined ? undefined : input.brand,
    tags: input.tags ?? undefined,
    status: (input.status as ProductStatus | undefined) ?? undefined,
    ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
  };

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id: product.id }, data });

      if (input.variants) {
        const { variants } = nestedCreate({ variants: input.variants });
        await tx.productVariant.deleteMany({ where: { productId: product.id } });
        await tx.productVariant.createMany({
          data: variants.map((v) => ({ ...v, productId: product.id })),
        });
      }
      if (input.images) {
        const { images } = nestedCreate({ images: input.images });
        await tx.productImage.deleteMany({ where: { productId: product.id } });
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((i) => ({ ...i, productId: product.id })),
          });
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        include: { variants: true, images: true },
      });
    });
    return NextResponse.json(toProductDTO(updated));
  } catch (e) {
    if (e instanceof Object && "code" in e && (e as { code: string }).code === "P2002") {
      return apiError("DUPLICATE_SKU", "A variant SKU is already in use", 409);
    }
    throw e;
  }
}

/** DELETE /api/products/:id — soft delete (owner). */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await authorizeApprovedSeller();
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || product.deletedAt) return notFound("Product not found");
  if (product.sellerId !== auth.seller.id) return forbidden("Not your product");

  await prisma.product.update({
    where: { id: product.id },
    data: { deletedAt: new Date(), status: ProductStatus.REMOVED },
  });
  return NextResponse.json({ ok: true });
}
