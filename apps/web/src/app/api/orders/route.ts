import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  prisma,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  CommissionStatus,
} from "@bazaarx/db";
import { toMoney, platformFee as feeOf } from "@bazaarx/utils";
import { getCurrentUser } from "@/lib/auth";
import { apiError, unauthorized, validationError } from "@/lib/api";
import { razorpay } from "@/lib/razorpay";
import { notify } from "@/lib/notify";
import { toOrderSummary, orderInclude } from "@/lib/orders";
import { DEFAULT_PLATFORM_FEE_PERCENT } from "@/lib/config";
import { validateCoupon } from "@/lib/coupon";
import type { CreateOrderResult, Paginated, OrderSummaryDTO } from "@bazaarx/types";

const bodySchema = z.object({
  addressId: z.string().min(1),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  couponCode: z.string().trim().optional(),
});

/** GET /api/orders — the buyer's own orders. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));

  const where = { buyerId: user.id, deletedAt: null };
  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: orderInclude,
    }),
    prisma.order.count({ where }),
  ]);

  const body: Paginated<OrderSummaryDTO> = { data: rows.map(toOrderSummary), page, limit, total };
  return NextResponse.json(body);
}

/**
 * POST /api/orders — place an order from the cart.
 * Splits the cart per seller, decrements stock, clears the cart, and (when a
 * reseller `ref` cookie is present) adds the link's per-unit margin to the
 * matching product and credits the reseller a PENDING commission.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);
  const { addressId, paymentMethod } = parsed.data;

  const address = await prisma.address.findFirst({ where: { id: addressId, userId: user.id } });
  if (!address) return apiError("INVALID_ADDRESS", "Address not found", 422);

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { variant: true, product: { include: { seller: true } } } } },
  });
  const items = (cart?.items ?? []).filter(
    (i) => !i.product.deletedAt && i.product.status === ProductStatus.ACTIVE,
  );
  if (items.length === 0) return apiError("EMPTY_CART", "Your cart is empty", 422);

  for (const i of items) {
    if (i.variant.stock < i.quantity) {
      return apiError("OUT_OF_STOCK", `Not enough stock for ${i.product.name}`, 409);
    }
  }

  // Reseller attribution: resolve the ref cookie to an active link (not self-bought).
  const ref = cookies().get("ref")?.value;
  let attribution: { linkId: string; resellerId: string; productId: string; margin: number } | null = null;
  if (ref) {
    const link = await prisma.resellerLink.findUnique({
      where: { slug: ref },
      include: { reseller: true, product: { select: { status: true, deletedAt: true } } },
    });
    if (
      link &&
      link.reseller.userId !== user.id &&
      link.product.status === ProductStatus.ACTIVE &&
      !link.product.deletedAt &&
      items.some((i) => i.productId === link.productId)
    ) {
      attribution = {
        linkId: link.id,
        resellerId: link.resellerId,
        productId: link.productId,
        margin: Number(link.margin),
      };
    }
  }

  const marginFor = (productId: string, qty: number) =>
    attribution && attribution.productId === productId ? toMoney(attribution.margin * qty) : 0;

  // Resolve per-category platform fee percentages (fallback to the default).
  const categoryIds = [...new Set(items.map((i) => i.product.categoryId))];
  const cats = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, commissionPercent: true },
  });
  const percentByCategory = new Map(
    cats.map((c) => [c.id, c.commissionPercent ?? DEFAULT_PLATFORM_FEE_PERCENT]),
  );
  const feePercentFor = (categoryId: string) =>
    percentByCategory.get(categoryId) ?? DEFAULT_PLATFORM_FEE_PERCENT;

  // Validate an optional coupon against the base subtotal (seller-funded discount).
  const baseSubtotal = toMoney(items.reduce((s, i) => s + Number(i.variant.price) * i.quantity, 0));
  let couponId: string | null = null;
  let discountTotal = 0;
  if (parsed.data.couponCode) {
    const check = await validateCoupon(parsed.data.couponCode, user.id, baseSubtotal);
    if (!check.ok) return apiError("COUPON_INVALID", check.message, 422);
    couponId = check.coupon.id;
    discountTotal = check.discount;
  }

  // Group by seller.
  const groups = new Map<string, typeof items>();
  for (const i of items) {
    const arr = groups.get(i.product.sellerId) ?? [];
    arr.push(i);
    groups.set(i.product.sellerId, arr);
  }

  const grandTotal = toMoney(
    items.reduce(
      (s, i) => s + Number(i.variant.price) * i.quantity + marginFor(i.productId, i.quantity),
      0,
    ) - discountTotal,
  );

  let rzpOrderId: string | undefined;
  if (paymentMethod === "RAZORPAY") {
    try {
      const rzp = await razorpay().orders.create({
        amount: Math.round(grandTotal * 100),
        currency: "INR",
        receipt: `cart_${user.id}_${Date.now()}`,
      });
      rzpOrderId = rzp.id;
    } catch {
      return apiError("PAYMENT_INIT_FAILED", "Could not start payment", 502);
    }
  }

  const orderIds = await prisma
    .$transaction(async (tx) => {
      const created: string[] = [];

      for (const [sellerId, groupItems] of groups) {
        const baseTotal = toMoney(
          groupItems.reduce((s, i) => s + Number(i.variant.price) * i.quantity, 0),
        );
        const marginTotal = toMoney(
          groupItems.reduce((s, i) => s + marginFor(i.productId, i.quantity), 0),
        );
        const fee = toMoney(
          groupItems.reduce(
            (s, i) => s + feeOf(Number(i.variant.price) * i.quantity, feePercentFor(i.product.categoryId)),
            0,
          ),
        );
        // Distribute the coupon discount across orders by base share (seller-funded,
        // never pushing seller amount below zero).
        const orderDiscount =
          discountTotal > 0
            ? Math.min(toMoney((discountTotal * baseTotal) / baseSubtotal), toMoney(baseTotal - fee))
            : 0;
        const sellerAmount = toMoney(baseTotal - fee - orderDiscount);
        const total = toMoney(baseTotal - orderDiscount + marginTotal);

        const order = await tx.order.create({
          data: {
            buyerId: user.id,
            sellerId,
            addressId,
            status: OrderStatus.PLACED,
            paymentMethod: paymentMethod as PaymentMethod,
            totalAmount: total,
            platformFee: fee,
            sellerAmount,
            items: {
              create: groupItems.map((i) => {
                const unitMargin = marginFor(i.productId, 1);
                const unitPrice = toMoney(Number(i.variant.price) + unitMargin);
                return {
                  productId: i.productId,
                  variantId: i.variantId,
                  quantity: i.quantity,
                  unitPrice,
                  totalPrice: toMoney(unitPrice * i.quantity),
                };
              }),
            },
            payment: {
              create: {
                method: paymentMethod as PaymentMethod,
                status: PaymentStatus.PENDING,
                amount: total,
                razorpayOrderId: rzpOrderId,
              },
            },
            tracking: { create: { status: OrderStatus.PLACED, message: "Order placed" } },
          },
        });
        created.push(order.id);

        for (const i of groupItems) {
          const res = await tx.productVariant.updateMany({
            where: { id: i.variantId, stock: { gte: i.quantity } },
            data: { stock: { decrement: i.quantity } },
          });
          if (res.count === 0) throw new Error("OUT_OF_STOCK");
        }

        // Credit the reseller if this order contains the attributed product.
        if (attribution && marginTotal > 0 && groupItems.some((i) => i.productId === attribution!.productId)) {
          await tx.commission.create({
            data: {
              orderId: order.id,
              resellerId: attribution.resellerId,
              resellerLinkId: attribution.linkId,
              amount: marginTotal,
              status: CommissionStatus.PENDING,
            },
          });
          await tx.resellerProfile.update({
            where: { id: attribution.resellerId },
            data: { pendingEarnings: { increment: marginTotal } },
          });
          await tx.resellerLink.update({
            where: { id: attribution.linkId },
            data: { conversions: { increment: 1 } },
          });
        }

        if (couponId && orderDiscount > 0) {
          await tx.couponUsage.create({
            data: { couponId, userId: user.id, orderId: order.id },
          });
        }

        const seller = groupItems[0]!.product.seller;
        await notify({
          tx,
          userId: seller.userId,
          type: "ORDER_PLACED_SELLER",
          title: "New order received",
          body: `You have a new order.`,
          data: { orderId: order.id },
        });
      }

      if (couponId) {
        await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart!.id } });
      await notify({
        tx,
        userId: user.id,
        type: "ORDER_PLACED",
        title: "Order placed",
        body: `Your order${created.length > 1 ? "s were" : " was"} placed successfully.`,
        data: { orderIds: created },
      });

      return created;
    })
    .catch((e: unknown) => {
      if (e instanceof Error && e.message === "OUT_OF_STOCK") return null;
      throw e;
    });

  if (orderIds === null) return apiError("OUT_OF_STOCK", "Stock changed during checkout", 409);

  const result: CreateOrderResult = {
    orderIds,
    ...(paymentMethod === "RAZORPAY" && rzpOrderId
      ? {
          razorpay: {
            razorpayOrderId: rzpOrderId,
            amount: Math.round(grandTotal * 100),
            currency: "INR",
            keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          },
        }
      : {}),
  };

  const res = NextResponse.json(result, { status: 201 });
  if (ref) res.cookies.set("ref", "", { maxAge: 0, path: "/" }); // consume attribution
  return res;
}
