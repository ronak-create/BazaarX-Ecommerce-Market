import { NextResponse } from "next/server";
import { prisma, SellerStatus, UserRole } from "@bazaarx/db";
import { authorizeApi } from "@/lib/auth";
import { forbidden, unauthorized } from "@/lib/api";
import type { KycListItem, Paginated } from "@bazaarx/types";

/**
 * GET /api/admin/kyc?status=PENDING&page=&limit=
 * Lists seller applications for review. Defaults to PENDING.
 */
export async function GET(req: Request) {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam && statusParam in SellerStatus
      ? (statusParam as SellerStatus)
      : SellerStatus.PENDING;
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));

  const where = { status };
  const [rows, total] = await Promise.all([
    prisma.sellerProfile.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    }),
    prisma.sellerProfile.count({ where }),
  ]);

  const data: KycListItem[] = rows.map((r) => ({
    id: r.id,
    businessName: r.businessName,
    gstin: r.gstin,
    panNumber: r.panNumber,
    bankAccount: r.bankAccount,
    ifsc: r.ifsc,
    status: r.status,
    rejectionReason: r.rejectionReason,
    documents: r.documents,
    createdAt: r.createdAt.toISOString(),
    user: r.user,
  }));

  const body: Paginated<KycListItem> = { data, page, limit, total };
  return NextResponse.json(body);
}
