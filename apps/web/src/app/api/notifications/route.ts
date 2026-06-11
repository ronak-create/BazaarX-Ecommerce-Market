import { NextResponse } from "next/server";
import { prisma } from "@bazaarx/db";
import { getCurrentUser } from "@/lib/auth";
import { unauthorized } from "@/lib/api";
import type { NotificationsResponse } from "@bazaarx/types";

/** GET /api/notifications — the caller's recent notifications + unread count. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  const body: NotificationsResponse = {
    items: rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
    unread,
  };
  return NextResponse.json(body);
}

/** POST /api/notifications/read — mark all of the caller's notifications read. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  return NextResponse.json({ ok: true });
}
