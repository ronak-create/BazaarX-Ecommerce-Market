import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, UserRole, DisputeStatus, PaymentStatus } from "@bazaarx/db";
import { authorizeApi } from "@/lib/auth";
import { apiError, forbidden, notFound, unauthorized } from "@/lib/api";
import { notify } from "@/lib/notify";

const bodySchema = z.object({
  resolution: z.enum(["REFUND", "REJECT"]),
  adminNote: z.string().trim().max(500).optional(),
});

/** POST /api/admin/disputes/:id/resolve — refund (and close) or reject a dispute. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiError("VALIDATION", "Invalid resolution", 422);

  const dispute = await prisma.dispute.findUnique({
    where: { id: params.id },
    include: { order: { include: { payment: true } } },
  });
  if (!dispute) return notFound("Dispute not found");
  if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
    return apiError("ALREADY_RESOLVED", "Dispute is already closed", 409);
  }

  await prisma.$transaction(async (tx) => {
    await tx.dispute.update({
      where: { id: dispute.id },
      data: {
        status: parsed.data.resolution === "REFUND" ? DisputeStatus.RESOLVED : DisputeStatus.CLOSED,
        adminNote: parsed.data.adminNote,
        resolvedAt: new Date(),
      },
    });

    if (
      parsed.data.resolution === "REFUND" &&
      dispute.order.payment &&
      dispute.order.payment.status === PaymentStatus.PAID
    ) {
      await tx.payment.update({
        where: { id: dispute.order.payment.id },
        data: { status: PaymentStatus.REFUNDED },
      });
    }

    await notify({
      tx,
      userId: dispute.raisedById,
      type: "DISPUTE_RESOLVED",
      title: parsed.data.resolution === "REFUND" ? "Dispute resolved — refund issued" : "Dispute closed",
      body: parsed.data.adminNote ?? "An admin reviewed your dispute.",
      data: { orderId: dispute.orderId },
    });
  });

  return NextResponse.json({ ok: true });
}
