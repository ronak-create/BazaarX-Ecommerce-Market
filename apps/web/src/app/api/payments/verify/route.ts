import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, PaymentStatus } from "@bazaarx/db";
import { getCurrentUser } from "@/lib/auth";
import { apiError, unauthorized } from "@/lib/api";
import { verifyPaymentSignature } from "@/lib/razorpay";

const bodySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

/**
 * POST /api/payments/verify
 * Client-side confirmation after Razorpay Checkout. Verifies the signature and
 * marks the related payments PAID. The webhook remains the authoritative path.
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
  if (!parsed.success) return apiError("VALIDATION", "Missing payment fields", 422);
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    return apiError("BAD_SIGNATURE", "Payment signature verification failed", 400);
  }

  await prisma.payment.updateMany({
    where: { razorpayOrderId, order: { buyerId: user.id } },
    data: {
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      razorpayPaymentId,
      razorpaySignature,
    },
  });

  return NextResponse.json({ ok: true });
}
