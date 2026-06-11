import { NextResponse } from "next/server";
import { prisma, UserRole, type Prisma } from "@bazaarx/db";
import { authorizeApi } from "@/lib/auth";
import { forbidden, unauthorized } from "@/lib/api";
import type { AdminUserDTO, Paginated } from "@bazaarx/types";

/** GET /api/admin/users?role=&q=&page= — user directory. */
export async function GET(req: Request) {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 25));
  const roleParam = url.searchParams.get("role");
  const q = url.searchParams.get("q")?.trim();

  const where: Prisma.UserWhereInput = {
    ...(roleParam && roleParam in UserRole ? { role: roleParam as UserRole } : {}),
    ...(q
      ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { sellerProfile: { select: { status: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  const data: AdminUserDTO[] = rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isBanned: u.deletedAt != null,
    sellerStatus: u.sellerProfile?.status ?? null,
    createdAt: u.createdAt.toISOString(),
  }));

  const body: Paginated<AdminUserDTO> = { data, page, limit, total };
  return NextResponse.json(body);
}
