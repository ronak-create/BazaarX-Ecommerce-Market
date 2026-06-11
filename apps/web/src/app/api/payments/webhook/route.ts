import { NextResponse } from "next/server";
import { prisma, PaymentStatus } from "@bazaarx/db";
import { verifyWebhookSignature } from "@/lib/razorpay";

/**
 * POST /api/payments/webhook — authoritative payment confirmation from Razorpay.
 * Verifies the signature against the raw body, then marks payments PAID.
 * Configure this URL + secret in the Razorpay dashboard (needs a public origin).
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { order_id?: string; id?: string } } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const entity = event.payload?.payment?.entity;
  const razorpayOrderId = entity?.order_id;

  if ((event.event === "payment.captured" || event.event === "order.paid") && razorpayOrderId) {
    await prisma.payment.updateMany({
      where: { razorpayOrderId, status: { not: PaymentStatus.PAID } },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        razorpayPaymentId: entity?.id,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
