import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, OrderStatus, PaymentMethod, PaymentStatus, ProductStatus } from "@bazaarx/db";
import { toMoney, platformFee as feeOf } from "@bazaarx/utils";
import { getCurrentUser } from "@/lib/auth";
import { apiError, unauthorized, validationError } from "@/lib/api";
import { razorpay } from "@/lib/razorpay";
import { notify } from "@/lib/notify";
import { toOrderSummary, orderInclude } from "@/lib/orders";
import { DEFAULT_PLATFORM_FEE_PERCENT } from "@/lib/config";
import type { CreateOrderResult, Paginated, OrderSummaryDTO } from "@bazaarx/types";

const bodySchema = z.object({
  addressId: z.string().min(1),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
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

  const body: Paginated<OrderSummaryDTO> = {
    data: rows.map(toOrderSummary),
    page,
    limit,
    total,
  };
  return NextResponse.json(body);
}

/**
 * POST /api/orders — place an order from the cart.
 * Splits the cart into one Order per seller, decrements stock, clears the cart,
 * and (for RAZORPAY) creates a Razorpay order for the combined total.
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

  // Validate stock up front.
  for (const i of items) {
    if (i.variant.stock < i.quantity) {
      return apiError("OUT_OF_STOCK", `Not enough stock for ${i.product.name}`, 409);
    }
  }

  // Group by seller.
  const groups = new Map<string, typeof items>();
  for (const i of items) {
    const arr = groups.get(i.product.sellerId) ?? [];
    arr.push(i);
    groups.set(i.product.sellerId, arr);
  }

  const grandTotal = toMoney(
    items.reduce((s, i) => s + Number(i.variant.price) * i.quantity, 0),
  );

  // For online payment, create the Razorpay order first (external call before the DB tx).
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

  const orderIds = await prisma.$transaction(async (tx) => {
    const created: string[] = [];

    for (const [sellerId, groupItems] of groups) {
      const total = toMoney(
        groupItems.reduce((s, i) => s + Number(i.variant.price) * i.quantity, 0),
      );
      const fee = feeOf(total, DEFAULT_PLATFORM_FEE_PERCENT);
      const sellerAmount = toMoney(total - fee);

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
            create: groupItems.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
              unitPrice: i.variant.price,
              totalPrice: toMoney(Number(i.variant.price) * i.quantity),
            })),
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

      // Decrement stock atomically; fail the whole tx if any went negative.
      for (const i of groupItems) {
        const res = await tx.productVariant.updateMany({
          where: { id: i.variantId, stock: { gte: i.quantity } },
          data: { stock: { decrement: i.quantity } },
        });
        if (res.count === 0) throw new Error("OUT_OF_STOCK");
      }

      // Notify the seller's user of the new order.
      const seller = groupItems[0]!.product.seller;
      await notify({
        tx,
        userId: seller.userId,
        type: "ORDER_PLACED_SELLER",
        title: "New order received",
        body: `You have a new order for ${formatCount(groupItems)}.`,
        data: { orderId: order.id },
      });
    }

    // Clear the cart.
    await tx.cartItem.deleteMany({ where: { cartId: cart!.id } });

    // Notify the buyer.
    await notify({
      tx,
      userId: user.id,
      type: "ORDER_PLACED",
      title: "Order placed",
      body: `Your order${created.length > 1 ? "s were" : " was"} placed successfully.`,
      data: { orderIds: created },
    });

    return created;
  }).catch((e: unknown) => {
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
  return NextResponse.json(result, { status: 201 });
}

function formatCount(items: { quantity: number }[]): string {
  const n = items.reduce((s, i) => s + i.quantity, 0);
  return `${n} item${n > 1 ? "s" : ""}`;
}
