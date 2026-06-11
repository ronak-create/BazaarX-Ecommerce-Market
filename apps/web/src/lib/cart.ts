import { prisma } from "@/lib/prisma";
import { toMoney } from "@bazaarx/utils";
import type { CartDTO, CartItemDTO, CartSellerGroup } from "@bazaarx/types";

/** Load the user's cart and shape it into per-seller groups with totals. */
export async function loadCart(userId: string): Promise<CartDTO> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          variant: true,
          product: {
            include: {
              images: true,
              seller: { select: { id: true, businessName: true } },
            },
          },
        },
      },
    },
  });

  const items: CartItemDTO[] = (cart?.items ?? [])
    // Drop items whose product was soft-deleted.
    .filter((i) => !i.product.deletedAt)
    .map((i) => {
      const unit = Number(i.variant.price);
      const image = (i.product.images.find((im) => im.isPrimary) ?? i.product.images[0])?.url ?? null;
      return {
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        productSlug: i.product.slug,
        variantId: i.variantId,
        variantLabel: i.variant.label,
        unitPrice: i.variant.price.toString(),
        quantity: i.quantity,
        lineTotal: toMoney(unit * i.quantity).toFixed(2),
        image,
        stock: i.variant.stock,
        sellerId: i.product.seller.id,
        sellerName: i.product.seller.businessName,
      };
    });

  const groupMap = new Map<string, CartSellerGroup>();
  for (const it of items) {
    let g = groupMap.get(it.sellerId);
    if (!g) {
      g = { sellerId: it.sellerId, sellerName: it.sellerName, items: [], subtotal: "0.00" };
      groupMap.set(it.sellerId, g);
    }
    g.items.push(it);
  }

  let subtotal = 0;
  for (const g of groupMap.values()) {
    const s = g.items.reduce((sum, it) => sum + Number(it.lineTotal), 0);
    g.subtotal = toMoney(s).toFixed(2);
    subtotal += s;
  }

  return {
    groups: [...groupMap.values()],
    itemCount: items.reduce((n, it) => n + it.quantity, 0),
    subtotal: toMoney(subtotal).toFixed(2),
  };
}
