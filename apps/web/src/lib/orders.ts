import { prisma, OrderStatus, type Prisma } from "@bazaarx/db";
import type { OrderDetailDTO, OrderSummaryDTO, OrderStatusDTO } from "@bazaarx/types";

/** Shared include shape so summary and detail share one query type. */
export const orderInclude = {
  items: { include: { product: { include: { images: true } }, variant: true } },
  tracking: { orderBy: { timestamp: "asc" } },
  payment: true,
  address: true,
  seller: { select: { businessName: true } },
  buyer: { select: { name: true } },
} satisfies Prisma.OrderInclude;

type OrderWithAll = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function primaryImage(order: OrderWithAll): string | null {
  const imgs = order.items[0]?.product.images ?? [];
  return (imgs.find((i) => i.isPrimary) ?? imgs[0])?.url ?? null;
}

export function toOrderSummary(o: OrderWithAll): OrderSummaryDTO {
  return {
    id: o.id,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.payment?.status ?? "PENDING",
    totalAmount: o.totalAmount.toString(),
    itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
    sellerName: o.seller.businessName,
    buyerName: o.buyer.name,
    createdAt: o.createdAt.toISOString(),
    primaryImage: primaryImage(o),
  };
}

export function toOrderDetail(o: OrderWithAll): OrderDetailDTO {
  const latestTracking = o.tracking[o.tracking.length - 1];
  return {
    ...toOrderSummary(o),
    platformFee: o.platformFee.toString(),
    sellerAmount: o.sellerAmount.toString(),
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      productSlug: i.product.slug,
      variantLabel: i.variant.label,
      quantity: i.quantity,
      unitPrice: i.unitPrice.toString(),
      totalPrice: i.totalPrice.toString(),
      image: (i.product.images.find((im) => im.isPrimary) ?? i.product.images[0])?.url ?? null,
    })),
    tracking: o.tracking.map((t) => ({
      id: t.id,
      status: t.status,
      message: t.message,
      trackingNumber: t.trackingNumber,
      carrier: t.carrier,
      timestamp: t.timestamp.toISOString(),
    })),
    address: {
      id: o.address.id,
      fullName: o.address.fullName,
      phone: o.address.phone,
      line1: o.address.line1,
      line2: o.address.line2 ?? "",
      city: o.address.city,
      state: o.address.state,
      pincode: o.address.pincode,
      isDefault: o.address.isDefault,
    },
    trackingNumber: latestTracking?.trackingNumber ?? null,
    carrier: latestTracking?.carrier ?? null,
  };
}

/** Seller-driven forward transitions: from -> allowed next. */
const SELLER_NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PLACED]: [OrderStatus.CONFIRMED, OrderStatus.SHIPPED],
  [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED],
  [OrderStatus.SHIPPED]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURNED],
};

export function sellerCanTransition(from: OrderStatus, to: OrderStatus): boolean {
  return SELLER_NEXT[from]?.includes(to) ?? false;
}

/** Append a tracking row for a status change (within a transaction). */
export async function addTracking(
  tx: Prisma.TransactionClient,
  orderId: string,
  status: OrderStatusDTO,
  opts: { message?: string; trackingNumber?: string; carrier?: string } = {},
): Promise<void> {
  await tx.orderTracking.create({
    data: {
      orderId,
      status: status as OrderStatus,
      message: opts.message,
      trackingNumber: opts.trackingNumber,
      carrier: opts.carrier,
    },
  });
}
