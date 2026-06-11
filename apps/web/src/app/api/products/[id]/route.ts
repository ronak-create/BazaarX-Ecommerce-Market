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
        // Upsert instead of delete+recreate: a variant referenced by a cart
        // item or an order can't be hard-deleted (FK), so update in place,
        // create new ones, and only remove the variants the seller dropped.
        const existing = await tx.productVariant.findMany({
          where: { productId: product.id },
          select: { id: true },
        });
        const existingIds = new Set(existing.map((v) => v.id));
        const keptIds = new Set<string>();

        for (const v of input.variants) {
          const vData = {
            label: v.label,
            attributes: v.attributes as Prisma.InputJsonValue,
            price: v.price,
            stock: v.stock,
            sku: v.sku,
          };
          if (v.id && existingIds.has(v.id)) {
            await tx.productVariant.update({ where: { id: v.id }, data: vData });
            keptIds.add(v.id);
          } else {
            await tx.productVariant.create({ data: { ...vData, productId: product.id } });
          }
        }

        const removed = [...existingIds].filter((id) => !keptIds.has(id));
        if (removed.length > 0) {
          // Cart references are ephemeral — clear them so the variant can go.
          await tx.cartItem.deleteMany({ where: { variantId: { in: removed } } });
          // Variants with order history must stay (FK + audit); take them out
          // of circulation instead of deleting.
          const ordered = await tx.orderItem.findMany({
            where: { variantId: { in: removed } },
            select: { variantId: true },
            distinct: ["variantId"],
          });
          const orderedIds = new Set(ordered.map((o) => o.variantId));
          const deletable = removed.filter((id) => !orderedIds.has(id));
          if (deletable.length > 0) {
            await tx.productVariant.deleteMany({ where: { id: { in: deletable } } });
          }
          if (orderedIds.size > 0) {
            await tx.productVariant.updateMany({ where: { id: { in: [...orderedIds] } }, data: { stock: 0 } });
          }
        }
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
